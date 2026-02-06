/**
 * Workflow Skills Management
 *
 * Manages universal workflow skills (not canon) that apply across all projects.
 * Uses copy-with-manifest pattern for portability.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  WorkflowManifest,
  WorkflowSource,
  WorkflowStatusInfo,
  WorkflowSkillInfo,
  WorkflowSkillStatus
} from './types.js';
import { copyDirectorySync } from '../utils/fs.js';
import { getGitCommit, getGitRemote } from '../utils/git.js';
import { hashDirectoryContents } from '../utils/hash.js';

// Default workflow skills source (in-repo, relative to compiled output)
// From dist/workflow/ or src/workflow/, go up 2 levels to project root
const DEFAULT_WORKFLOW_SOURCE = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../workflow-skills'
);

// Alternative paths to check (order matters - first match wins)
const WORKFLOW_PATHS = [
  // Environment variable override
  process.env.CC_WORKFLOW_SKILLS_PATH,
  // Relative to project root (works in dev and dist)
  DEFAULT_WORKFLOW_SOURCE,
  // User's home directory alternatives
  path.resolve(process.env.HOME || '', '.claude/workflow-skills'),
  path.resolve(process.env.HOME || '', 'workflow-skills')
].filter((p): p is string => Boolean(p));

/**
 * Get the workflow skills source path
 */
function getWorkflowSourcePath(): string {
  for (const p of WORKFLOW_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return DEFAULT_WORKFLOW_SOURCE;
}

/**
 * Get info about the workflow source
 */
export function getWorkflowSourceInfo(): WorkflowSource & { commit?: string; remote?: string } {
  const sourcePath = getWorkflowSourcePath();
  const commit = getGitCommit(sourcePath);
  const remote = getGitRemote(sourcePath);

  return {
    type: 'local',
    path: sourcePath,
    commit,
    remote,
    gitRemote: remote
  };
}

/** Try to read SKILL.md and extract description. Returns null if file missing. */
function readSkillDescription(skillFile: string): { exists: true; description?: string } | null {
  try {
    const content = fs.readFileSync(skillFile, 'utf-8');
    const descMatch = content.match(/^---[\s\S]*?description:\s*(.+?)[\r\n]/m);
    return { exists: true, description: descMatch?.[1]?.trim() };
  } catch {
    return null;
  }
}

export function listWorkflowSkills(): WorkflowSkillInfo[] {
  const sourcePath = getWorkflowSourcePath();
  if (!fs.existsSync(sourcePath)) return [];

  const skills: WorkflowSkillInfo[] = [];

  const scanDir = (dirPath: string): void => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const skillPath = path.join(dirPath, entry.name);
      const result = readSkillDescription(path.join(skillPath, 'SKILL.md'));
      if (result) {
        skills.push({ name: entry.name, path: skillPath, description: result.description });
      } else {
        // Recurse into subdirectories (e.g., workflow/, utils/, ralph-loop/)
        scanDir(skillPath);
      }
    }
  };

  scanDir(sourcePath);
  return skills;
}

/**
 * Get the workflow manifest for a project
 */
function getWorkflowManifest(projectPath: string): WorkflowManifest | null {
  const manifestPath = path.join(projectPath, '.claude', 'workflow-manifest.json');
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Save the workflow manifest for a project
 */
function saveWorkflowManifest(projectPath: string, manifest: WorkflowManifest): void {
  const claudeDir = path.join(projectPath, '.claude');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  const manifestPath = path.join(claudeDir, 'workflow-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Create initial workflow manifest
 */
function createWorkflowManifest(): WorkflowManifest {
  const sourceInfo = getWorkflowSourceInfo();

  return {
    source: {
      type: sourceInfo.type,
      path: sourceInfo.path,
      gitRemote: sourceInfo.gitRemote
    },
    installedAt: new Date().toISOString(),
    sourceCommit: sourceInfo.commit,
    skills: {}
  };
}

/** Reject skill names with path traversal characters */
function isValidSkillName(name: string): boolean {
  return !name.includes('/') && !name.includes('\\') && !name.includes('..');
}

/** Find a workflow skill's source path by name (searches nested subdirectories) */
function findWorkflowSkillPath(skillName: string): string | null {
  const skills = listWorkflowSkills();
  const found = skills.find(s => s.name === skillName);
  return found?.path ?? null;
}

/** Validate skill source exists and has SKILL.md */
function validateSkillSource(
  skillName: string,
  _sourcePath: string
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

/** Record skill installation in manifest */
function recordSkillInstall(
  projectPath: string,
  skillName: string,
  targetPath: string
): void {
  let manifest = getWorkflowManifest(projectPath);
  if (!manifest) {
    manifest = createWorkflowManifest();
  }

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

/**
 * Install a workflow skill to a project
 */
export function installWorkflowSkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean } = {}
): { success: boolean; message: string } {
  if (!isValidSkillName(skillName)) {
    return { success: false, message: `Invalid skill name (path traversal): ${skillName}` };
  }

  const sourcePath = getWorkflowSourcePath();
  const validation = validateSkillSource(skillName, sourcePath);
  if (!validation.valid) return { success: false, message: validation.message };

  const targetPath = path.join(projectPath, '.claude', 'skills', skillName);
  if (fs.existsSync(targetPath) && !options.force) {
    return { success: false, message: `Skill already installed: ${skillName}. Use --force to overwrite.` };
  }

  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true });
  }
  copyDirectorySync(validation.skillSourcePath, targetPath);
  recordSkillInstall(projectPath, skillName, targetPath);

  return { success: true, message: `Installed workflow skill: ${skillName}` };
}

/**
 * Install all workflow skills to a project.
 *
 * Copies all available workflow skills (ralph-loop, implement, adversarial-review, etc.)
 * to the project's `.claude/skills/` directory.
 *
 * @param projectPath - Target project directory
 * @param options - Installation options
 * @param options.force - Overwrite existing skills (default: false)
 * @returns Result with installed, skipped, and error arrays
 *
 * @example
 * ```typescript
 * const result = installAllWorkflowSkills('./myproject');
 * console.log(`Installed ${result.installed.length} workflow skills`);
 *
 * // Force reinstall
 * const result = installAllWorkflowSkills('./myproject', { force: true });
 * ```
 */
export function installAllWorkflowSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { installed: string[]; skipped: string[]; errors: string[] } {
  const skills = listWorkflowSkills();
  const results = { installed: [] as string[], skipped: [] as string[], errors: [] as string[] };

  for (const skill of skills) {
    const result = installWorkflowSkill(skill.name, projectPath, options);
    if (result.success) {
      results.installed.push(skill.name);
    } else if (!options.force && fs.existsSync(path.join(projectPath, '.claude', 'skills', skill.name))) {
      results.skipped.push(`${skill.name}: already installed`);
    } else {
      results.errors.push(`${skill.name}: ${result.message}`);
    }
  }

  return results;
}

/** Determine status of a single installed workflow skill */
function determineSkillStatus(
  info: { hash: string; installedCommit?: string },
  installedPath: string,
  sourceSkillPath: string,
  sourceCommit?: string
): WorkflowStatusInfo & { name: string } {
  const base = { name: '', installedCommit: info.installedCommit };

  if (!fs.existsSync(installedPath)) {
    return { ...base, status: 'missing' };
  }

  const currentHash = hashDirectoryContents(installedPath);
  const modified = currentHash !== info.hash;

  if (!fs.existsSync(sourceSkillPath)) {
    return { ...base, status: 'unknown', modified };
  }

  const sourceHash = hashDirectoryContents(sourceSkillPath);
  let status: WorkflowSkillStatus;

  if (modified) {
    status = 'modified';
  } else if (info.installedCommit !== sourceCommit && currentHash !== sourceHash) {
    status = 'outdated';
  } else {
    status = 'current';
  }

  return { ...base, status, sourceCommit, modified };
}

/**
 * Check the status of installed workflow skills
 */
export function checkWorkflowStatus(projectPath: string): WorkflowStatusInfo[] {
  const manifest = getWorkflowManifest(projectPath);
  if (!manifest) return [];

  const sourcePath = getWorkflowSourcePath();
  const sourceInfo = getWorkflowSourceInfo();

  return Object.entries(manifest.skills).map(([skillName, info]) => {
    const installedPath = path.join(projectPath, '.claude', 'skills', skillName);
    const sourceSkillPath = path.join(sourcePath, skillName);
    const status = determineSkillStatus(info, installedPath, sourceSkillPath, sourceInfo.commit);
    return { ...status, name: skillName };
  });
}

/** Categorize a skill status for upgrade decision */
function categorizeForUpgrade(
  status: WorkflowStatusInfo,
  force: boolean
): 'upgrade' | { skip: string } {
  if (status.status === 'current') return { skip: `${status.name}: already current` };
  if (status.status === 'modified' && !force) {
    return { skip: `${status.name}: locally modified (use --force to overwrite)` };
  }
  if (status.status === 'missing' || status.status === 'unknown') {
    return { skip: `${status.name}: ${status.status}` };
  }
  return 'upgrade';
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
  const results = { upgraded: [] as string[], skipped: [] as string[], errors: [] as string[] };

  for (const status of statuses) {
    if (options.skills && !options.skills.includes(status.name)) continue;

    const category = categorizeForUpgrade(status, options.force ?? false);
    if (category !== 'upgrade') {
      results.skipped.push(category.skip);
      continue;
    }

    const result = installWorkflowSkill(status.name, projectPath, { force: true });
    result.success
      ? results.upgraded.push(status.name)
      : results.errors.push(`${status.name}: ${result.message}`);
  }

  return results;
}

export type { WorkflowSkillInfo, WorkflowStatusInfo };
