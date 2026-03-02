import * as fs from 'fs';
import * as path from 'path';
import type {
  WorkflowManifest,
  WorkflowSource,
  WorkflowStatusInfo,
  WorkflowSkillInfo,
  WorkflowSkillStatus
} from './types.js';
import { getGitCommit, getGitRemote } from '../utils/git.js';
import { copyDirectorySync, isEnoent } from '../utils/fs.js';
import { hashDirectoryContents } from '../utils/hash.js';
import { isValidSkillName, isRecord } from '../utils/validation.js';
import { registerInstallation, listInstallations, pruneRegistry } from './registry.js';
import { PATHS } from '../paths.js';
import {
  lstatTarget, removeTarget, checkAlreadyInstalled,
  copyQualityGateScript, copyRubricFiles,
  upgradeQualityGateScript, upgradeRubricFiles,
  installOneSkill, upgradeOneSkill
} from './install-helpers.js';

/** Skills visible as slash commands in Claude Code */
export const USER_FACING_SKILLS = new Set([
  'change', 'cleanup',
  'code-scan', 'ai-smell-scan', 'deadcode-scan', 'naming-scan',
  'refactor-scan', 'dedupe-scan', 'canon-audit', 'generate-docs',
]);

/**
 * Resolve workflow skills source directory.
 *
 * CC_WORKFLOW_SKILLS_PATH is an explicit override for developers who want to
 * point at a different workflow-skills checkout (e.g., a linked fork).
 * PATHS.workflowSkills handles normal installed/dev resolution and is the
 * default when the env var is absent.
 */
function getWorkflowSourcePath(env: NodeJS.ProcessEnv = process.env): string {
  const envPath = env.CC_WORKFLOW_SKILLS_PATH;
  if (envPath && !envPath.includes('\0') && path.isAbsolute(envPath) && fs.existsSync(envPath)) {
    return envPath;
  }
  return PATHS.workflowSkills;
}

export function getWorkflowSourceInfo(): WorkflowSource & { commit?: string; remote?: string } {
  const sourcePath = getWorkflowSourcePath();
  const commit = getGitCommit(sourcePath);
  const remote = getGitRemote(sourcePath);
  return { type: 'local', path: sourcePath, commit, remote, gitRemote: remote };
}

function readSkillDescription(skillFile: string): { exists: true; description?: string } | null {
  try {
    const content = fs.readFileSync(skillFile, 'utf-8');
    const descMatch = content.match(/^---[\s\S]*?description:\s*(.+?)[\r\n]/m);
    return { exists: true, description: descMatch?.[1]?.trim() };
  } catch (cause) {
    if (!isEnoent(cause)) {
      console.warn(`Warning: failed to read skill description: ${skillFile}`);
    }
    return null;
  }
}

function isSkillDirectory(entry: { isDirectory(): boolean; name: string }): boolean {
  return entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules';
}

function collectSkillsFromDir(dirPath: string, accumulator: WorkflowSkillInfo[]): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!isSkillDirectory(entry)) continue;
    const skillPath = path.join(dirPath, entry.name);
    const result = readSkillDescription(path.join(skillPath, 'SKILL.md'));
    if (result) {
      accumulator.push({ name: entry.name, path: skillPath, description: result.description });
    } else {
      collectSkillsFromDir(skillPath, accumulator);
    }
  }
}

export function listWorkflowSkills(): WorkflowSkillInfo[] {
  const sourcePath = getWorkflowSourcePath();
  if (!fs.existsSync(sourcePath)) return [];

  const skills: WorkflowSkillInfo[] = [];
  collectSkillsFromDir(sourcePath, skills);
  return skills;
}

function isWorkflowManifest(value: unknown): value is WorkflowManifest {
  if (!isRecord(value)) return false;
  if (!isRecord(value.skills)) return false;
  if (!isRecord(value.source)) return false;
  return typeof value.installedAt === 'string';
}

const MAX_MANIFEST_SIZE = 1024 * 1024; // 1 MB

function getWorkflowManifest(projectPath: string): WorkflowManifest | null {
  const manifestPath = path.join(projectPath, '.claude', 'workflow-manifest.json');
  try {
    const stat = fs.statSync(manifestPath);
    if (stat.size > MAX_MANIFEST_SIZE) {
      throw new Error('workflow-manifest.json exceeds 1 MB size limit');
    }
    const fileContent = fs.readFileSync(manifestPath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    if (!isWorkflowManifest(parsed)) {
      throw new Error(
        'Invalid workflow manifest: expected object with "source" (object), "installedAt" (string), and "skills" (object)'
      );
    }
    return parsed;
  } catch (cause) {
    if (isEnoent(cause)) return null;
    throw new Error('Failed to load workflow manifest', { cause });
  }
}

function saveWorkflowManifest(projectPath: string, manifest: WorkflowManifest): void {
  const claudeDir = path.join(projectPath, '.claude');
  if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
  const filePath = path.join(claudeDir, 'workflow-manifest.json');
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(manifest, null, 2));
    fs.renameSync(tmpPath, filePath);
  } catch (cause) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw new Error('Failed to save workflow manifest', { cause });
  }
}

function createWorkflowManifest(): WorkflowManifest {
  const sourceInfo = getWorkflowSourceInfo();
  return {
    source: { type: sourceInfo.type, path: sourceInfo.path, gitRemote: sourceInfo.gitRemote },
    installedAt: new Date().toISOString(),
    sourceCommit: sourceInfo.commit,
    skills: {}
  };
}

function findWorkflowSkillPath(skillName: string): string | null {
  const found = listWorkflowSkills().find(s => s.name === skillName);
  return found?.path ?? null;
}

function validateSkillSource(
  skillName: string
): { valid: true; skillSourcePath: string } | { valid: false; message: string } {
  const skillSourcePath = findWorkflowSkillPath(skillName);
  if (!skillSourcePath) {
    return { valid: false, message: `Workflow skill not found: ${skillName}` };
  }
  if (!fs.existsSync(path.join(skillSourcePath, 'SKILL.md'))) {
    return { valid: false, message: `Invalid workflow skill (no SKILL.md): ${skillName}` };
  }
  return { valid: true, skillSourcePath };
}

function recordSkillInstall(projectPath: string, skillName: string, targetPath: string): void {
  let manifest = getWorkflowManifest(projectPath);
  if (!manifest) manifest = createWorkflowManifest();
  const sourceInfo = getWorkflowSourceInfo();
  manifest.skills[skillName] = {
    installedAt: new Date().toISOString(),
    sourceFile: path.join(skillName, 'SKILL.md'),
    hash: hashDirectoryContents(targetPath),
    modified: false,
    installedCommit: sourceInfo.commit
  };
  saveWorkflowManifest(projectPath, manifest);
}

function prepareInstallTarget(
  targetPath: string,
  skillSourcePath: string,
  skillName: string,
  force: boolean
): { proceed: true; isUpdate: boolean } | { proceed: false; message: string } {
  const { exists, isSymlink } = lstatTarget(targetPath);
  const isCopy = exists && !isSymlink;
  if (isCopy && !force) {
    const alreadyInstalled = checkAlreadyInstalled(targetPath, skillSourcePath, skillName);
    if (alreadyInstalled) return { proceed: false, message: alreadyInstalled.message };
  }
  if (exists) removeTarget(targetPath, isSymlink, path.dirname(targetPath));
  return { proceed: true, isUpdate: isCopy && !force };
}

export function installWorkflowSkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean; targetDir?: string } = {}
): { success: boolean; message: string } {
  if (!isValidSkillName(skillName)) {
    return { success: false, message: `Invalid skill name (path traversal): ${skillName}` };
  }

  const validation = validateSkillSource(skillName);
  if (!validation.valid) return { success: false, message: validation.message };

  const dir = options.targetDir ?? path.join(projectPath, '.claude', 'skills');
  const targetPath = path.join(dir, skillName);
  const prep = prepareInstallTarget(targetPath, validation.skillSourcePath, skillName, options.force ?? false);
  if (!prep.proceed) return { success: false, message: prep.message };

  copyDirectorySync(validation.skillSourcePath, targetPath);
  recordSkillInstall(projectPath, skillName, targetPath);

  return prep.isUpdate
    ? { success: true, message: `Updated skill: ${skillName} (source changed)` }
    : { success: true, message: `Installed workflow skill: ${skillName}` };
}

/**
 * Install all workflow skills to a project.
 *
 * Only user-facing skills go to `.claude/skills/` (visible as slash commands).
 * Internal phase skills are referenced directly from `workflow-skills/` by
 * the build/improve orchestrators — no installation needed.
 */
export function installAllWorkflowSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { installed: string[]; skipped: string[]; errors: string[] } {
  const skills = listWorkflowSkills();
  const results = { installed: [] as string[], skipped: [] as string[], errors: [] as string[] };
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });

  for (const skill of skills) {
    installOneSkill(skill, projectPath, skillsDir, options, USER_FACING_SKILLS, installWorkflowSkill, results);
  }

  const sourcePath = getWorkflowSourcePath();
  const manifest = getWorkflowManifest(projectPath);
  if (manifest) copyQualityGateScript(projectPath, sourcePath, manifest, (m) => saveWorkflowManifest(projectPath, m));
  copyRubricFiles(projectPath, sourcePath);
  registerInstallation(projectPath);

  return results;
}

function determineSkillStatus(
  installedInfo: { hash: string; installedCommit?: string },
  installedPath: string,
  sourceSkillPath: string,
  sourceCommit?: string
): WorkflowStatusInfo & { name: string } {
  const base = { name: '', installedCommit: installedInfo.installedCommit };

  if (!fs.existsSync(installedPath)) return { ...base, status: 'missing' };

  const currentHash = hashDirectoryContents(installedPath);
  const modified = currentHash !== installedInfo.hash;

  if (!fs.existsSync(sourceSkillPath)) return { ...base, status: 'unknown', modified };

  const sourceHash = hashDirectoryContents(sourceSkillPath);
  let status: WorkflowSkillStatus;
  if (modified) {
    status = 'modified';
  } else if (installedInfo.installedCommit !== sourceCommit && currentHash !== sourceHash) {
    status = 'outdated';
  } else {
    status = 'current';
  }

  return { ...base, status, sourceCommit, modified };
}

export function checkWorkflowStatus(projectPath: string): WorkflowStatusInfo[] {
  const manifest = getWorkflowManifest(projectPath);
  if (!manifest) return [];

  const sourcePath = getWorkflowSourcePath();
  const sourceInfo = getWorkflowSourceInfo();

  return Object.entries(manifest.skills)
    .filter(([skillName]) => USER_FACING_SKILLS.has(skillName))
    .map(([skillName, info]) => {
      const installedPath = path.join(projectPath, '.claude', 'skills', skillName);
      const sourceSkillPath = findWorkflowSkillPath(skillName) ?? path.join(sourcePath, skillName);
      const status = determineSkillStatus(info, installedPath, sourceSkillPath, sourceInfo.commit);
      return { ...status, name: skillName };
    });
}

export function upgradeWorkflowSkills(
  projectPath: string,
  options: { force?: boolean; skills?: string[] } = {}
): { upgraded: string[]; skipped: string[]; errors: string[] } {
  const manifest = getWorkflowManifest(projectPath);
  if (!manifest) {
    return { upgraded: [], skipped: [], errors: ['No workflow manifest found'] };
  }

  const statuses = checkWorkflowStatus(projectPath);
  const force = options.force ?? false;
  const results = { upgraded: [] as string[], skipped: [] as string[], errors: [] as string[] };

  for (const status of statuses) {
    if (options.skills && !options.skills.includes(status.name)) continue;
    upgradeOneSkill(status, projectPath, force, USER_FACING_SKILLS, installWorkflowSkill, results);
  }

  const sourcePath = getWorkflowSourcePath();
  upgradeQualityGateScript(projectPath, sourcePath, manifest, (m) => saveWorkflowManifest(projectPath, m), results.upgraded);
  upgradeRubricFiles(projectPath, sourcePath, results.upgraded);

  return results;
}

export function pushWorkflowSkills(
  options?: { force?: boolean }
): { updated: string[]; current: string[]; errors: string[]; pruned: string[] } {
  const pruned = pruneRegistry();
  const installations = listInstallations();
  const results = { updated: [] as string[], current: [] as string[], errors: [] as string[], pruned };

  for (const { projectPath, entry } of installations) {
    try {
      const upgrade = upgradeWorkflowSkills(projectPath, { force: options?.force });
      if (upgrade.upgraded.length > 0) {
        results.updated.push(projectPath);
      } else {
        results.current.push(projectPath);
      }
      registerInstallation(projectPath, entry.profileName);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      results.errors.push(`${projectPath}: ${message}`);
    }
  }

  return results;
}

export { registerInstallation, listInstallations, pruneRegistry } from './registry.js';
export type { InstallationEntry, InstallationRegistry } from './registry.js';
export type { WorkflowSkillInfo, WorkflowStatusInfo };
