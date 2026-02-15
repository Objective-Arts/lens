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
import { copyDirectorySync } from '../utils/fs.js';
import { hashDirectoryContents, hashFileContents } from '../utils/hash.js';

/** Skills visible as slash commands in Claude Code */
const USER_FACING_SKILLS = new Set([
  'build', 'improve', 'quick-change',
  'ai-smell-scan', 'ai-smell-review', 'generate-docs', 'lens'
]);

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

function getWorkflowSourcePath(): string {
  for (const p of WORKFLOW_PATHS) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return DEFAULT_WORKFLOW_SOURCE;
}

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

function getWorkflowManifest(projectPath: string): WorkflowManifest | null {
  const manifestPath = path.join(projectPath, '.claude', 'workflow-manifest.json');
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return null;
  }
}

function saveWorkflowManifest(projectPath: string, manifest: WorkflowManifest): void {
  const claudeDir = path.join(projectPath, '.claude');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  const manifestPath = path.join(claudeDir, 'workflow-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

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

function findWorkflowSkillPath(skillName: string): string | null {
  const skills = listWorkflowSkills();
  const found = skills.find(s => s.name === skillName);
  return found?.path ?? null;
}

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

export function installWorkflowSkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean; targetDir?: string } = {}
): { success: boolean; message: string } {
  if (!isValidSkillName(skillName)) {
    return { success: false, message: `Invalid skill name (path traversal): ${skillName}` };
  }

  const sourcePath = getWorkflowSourcePath();
  const validation = validateSkillSource(skillName, sourcePath);
  if (!validation.valid) return { success: false, message: validation.message };

  const dir = options.targetDir ?? path.join(projectPath, '.claude', 'skills');
  const targetPath = path.join(dir, skillName);
  if (fs.existsSync(targetPath) && !options.force) {
    return { success: false, message: `Skill already installed: ${skillName}. Use --force to overwrite.` };
  }

  if (fs.existsSync(targetPath)) {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(targetPath);
    } else {
      fs.rmSync(targetPath, { recursive: true });
    }
  }
  copyDirectorySync(validation.skillSourcePath, targetPath);
  recordSkillInstall(projectPath, skillName, targetPath);

  return { success: true, message: `Installed workflow skill: ${skillName}` };
}

/**
 * Install all workflow skills to a project.
 *
 * User-facing skills go to `.claude/skills/` (visible as slash commands).
 * Internal phase skills go to `.claude/phases/` (used by build/improve, not visible).
 */
export function installAllWorkflowSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { installed: string[]; skipped: string[]; errors: string[] } {
  const skills = listWorkflowSkills();
  const results = { installed: [] as string[], skipped: [] as string[], errors: [] as string[] };

  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const phasesDir = path.join(projectPath, '.claude', 'phases');
  if (!fs.existsSync(phasesDir)) fs.mkdirSync(phasesDir, { recursive: true });

  for (const skill of skills) {
    const targetDir = USER_FACING_SKILLS.has(skill.name) ? skillsDir : phasesDir;
    const result = installWorkflowSkill(skill.name, projectPath, { ...options, targetDir });
    if (result.success) {
      results.installed.push(skill.name);
    } else if (!options.force && fs.existsSync(path.join(targetDir, skill.name))) {
      results.skipped.push(`${skill.name}: already installed`);
    } else {
      results.errors.push(`${skill.name}: ${result.message}`);
    }
  }

  // Copy quality-gate script to target project
  const sourcePath = getWorkflowSourcePath();
  const gateSource = path.join(path.dirname(sourcePath), 'scripts', 'quality-gate.ts');
  const gateTarget = path.join(projectPath, '.claude', 'scripts', 'quality-gate.ts');
  if (fs.existsSync(gateSource)) {
    fs.mkdirSync(path.dirname(gateTarget), { recursive: true });
    fs.copyFileSync(gateSource, gateTarget);
    const manifest = getWorkflowManifest(projectPath);
    if (manifest) {
      manifest.scriptHash = hashFileContents(gateSource);
      saveWorkflowManifest(projectPath, manifest);
    }
  }

  // Copy rubric files to target project
  const rubricSource = path.join(sourcePath, 'rubric');
  const rubricTarget = path.join(projectPath, '.claude', 'rubric');
  if (fs.existsSync(rubricSource)) {
    if (fs.existsSync(rubricTarget)) {
      fs.rmSync(rubricTarget, { recursive: true });
    }
    copyDirectorySync(rubricSource, rubricTarget);
  }

  // Copy universal lessons file to target project (seed only — don't overwrite accumulated lessons)
  const lessonsSource = path.join(sourcePath, 'lessons.md');
  const lessonsTarget = path.join(projectPath, '.claude', 'universal-lessons.md');
  if (fs.existsSync(lessonsSource) && !fs.existsSync(lessonsTarget)) {
    fs.copyFileSync(lessonsSource, lessonsTarget);
  }

  return results;
}

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

export function checkWorkflowStatus(projectPath: string): WorkflowStatusInfo[] {
  const manifest = getWorkflowManifest(projectPath);
  if (!manifest) return [];

  const sourcePath = getWorkflowSourcePath();
  const sourceInfo = getWorkflowSourceInfo();

  return Object.entries(manifest.skills).map(([skillName, info]) => {
    const subdir = USER_FACING_SKILLS.has(skillName) ? 'skills' : 'phases';
    const installedPath = path.join(projectPath, '.claude', subdir, skillName);
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

    // Categorize skill for upgrade decision
    if (status.status === 'current') {
      results.skipped.push(`${status.name}: already current`);
      continue;
    }
    if (status.status === 'modified' && !force) {
      results.skipped.push(`${status.name}: locally modified (use --force to overwrite)`);
      continue;
    }
    if (status.status === 'missing' || status.status === 'unknown') {
      results.skipped.push(`${status.name}: ${status.status}`);
      continue;
    }

    const targetDir = USER_FACING_SKILLS.has(status.name)
      ? path.join(projectPath, '.claude', 'skills')
      : path.join(projectPath, '.claude', 'phases');
    const result = installWorkflowSkill(status.name, projectPath, { force: true, targetDir });
    if (result.success) {
      results.upgraded.push(status.name);
    } else {
      results.errors.push(`${status.name}: ${result.message}`);
    }
  }

  // Re-copy quality-gate script if outdated
  const sourcePath = getWorkflowSourcePath();
  const gateSource = path.join(path.dirname(sourcePath), 'scripts', 'quality-gate.ts');
  const gateTarget = path.join(projectPath, '.claude', 'scripts', 'quality-gate.ts');
  if (fs.existsSync(gateSource)) {
    const currentHash = manifest.scriptHash;
    const sourceHash = hashFileContents(gateSource);
    if (currentHash !== sourceHash) {
      fs.mkdirSync(path.dirname(gateTarget), { recursive: true });
      fs.copyFileSync(gateSource, gateTarget);
      manifest.scriptHash = sourceHash;
      saveWorkflowManifest(projectPath, manifest);
      results.upgraded.push('quality-gate.ts (script)');
    }
  }

  // Re-copy rubric files (always overwrite — rubrics are read-only source)
  const rubricSource = path.join(sourcePath, 'rubric');
  const rubricTarget = path.join(projectPath, '.claude', 'rubric');
  if (fs.existsSync(rubricSource)) {
    if (fs.existsSync(rubricTarget)) {
      fs.rmSync(rubricTarget, { recursive: true });
    }
    copyDirectorySync(rubricSource, rubricTarget);
    results.upgraded.push('rubric/ (criteria files)');
  }

  // Seed universal lessons if missing (don't overwrite — project accumulates its own)
  const lessonsSource = path.join(sourcePath, 'lessons.md');
  const lessonsTarget = path.join(projectPath, '.claude', 'universal-lessons.md');
  if (fs.existsSync(lessonsSource) && !fs.existsSync(lessonsTarget)) {
    fs.copyFileSync(lessonsSource, lessonsTarget);
    results.upgraded.push('universal-lessons.md (seeded)');
  }

  return results;
}

export type { WorkflowSkillInfo, WorkflowStatusInfo };
