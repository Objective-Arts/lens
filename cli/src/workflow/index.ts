/**
 * Workflow Skills Management
 *
 * Manages universal workflow skills (not canon) that apply across all projects.
 * Uses copy-with-manifest pattern for portability.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import type {
  WorkflowManifest,
  WorkflowSource,
  InstalledWorkflowInfo,
  WorkflowStatusInfo,
  WorkflowSkillInfo,
  WorkflowSkillStatus
} from './types.js';

// Default workflow skills source (relative to claude-optimal)
const DEFAULT_WORKFLOW_SOURCE = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../../workflow-skills'
);

// Alternative paths to check
const WORKFLOW_PATHS = [
  DEFAULT_WORKFLOW_SOURCE,
  path.resolve(process.env.HOME || '', '.claude/workflow-skills'),
  path.resolve(process.env.HOME || '', 'workflow-skills')
];

/**
 * Get the workflow skills source path
 */
export function getWorkflowSourcePath(): string {
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
  let commit: string | undefined;
  let remote: string | undefined;

  try {
    commit = execSync('git rev-parse --short HEAD', {
      cwd: sourcePath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    // Not a git repo
  }

  try {
    remote = execSync('git remote get-url origin', {
      cwd: sourcePath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    // No remote
  }

  return {
    type: 'local',
    path: sourcePath,
    commit,
    remote,
    gitRemote: remote
  };
}

/**
 * List all available workflow skills from source
 */
export function listWorkflowSkills(): WorkflowSkillInfo[] {
  const sourcePath = getWorkflowSourcePath();
  const skills: WorkflowSkillInfo[] = [];

  if (!fs.existsSync(sourcePath)) {
    return skills;
  }

  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'node_modules') continue;

    const skillPath = path.join(sourcePath, entry.name);
    const skillFile = path.join(skillPath, 'SKILL.md');

    if (fs.existsSync(skillFile)) {
      // Extract description from frontmatter
      const content = fs.readFileSync(skillFile, 'utf-8');
      const descMatch = content.match(/^---[\s\S]*?description:\s*(.+?)[\r\n]/m);
      const description = descMatch?.[1]?.trim();

      skills.push({
        name: entry.name,
        path: skillPath,
        description
      });
    }
  }

  return skills;
}

/**
 * Get the workflow manifest for a project
 */
export function getWorkflowManifest(projectPath: string): WorkflowManifest | null {
  const manifestPath = path.join(projectPath, '.claude', 'workflow-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Save the workflow manifest for a project
 */
export function saveWorkflowManifest(projectPath: string, manifest: WorkflowManifest): void {
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
export function createWorkflowManifest(): WorkflowManifest {
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

/**
 * Hash a directory's contents
 */
function hashDirectory(dirPath: string): string {
  const hash = createHash('sha256');

  function processDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      if (entry.isDirectory()) {
        hash.update(`dir:${relativePath}\n`);
        processDir(fullPath);
      } else {
        const content = fs.readFileSync(fullPath);
        hash.update(`file:${relativePath}:${content.length}\n`);
        hash.update(content);
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    processDir(dirPath);
  }

  return hash.digest('hex').slice(0, 16);
}

/**
 * Copy a directory recursively
 */
function copyDirectoryRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install a workflow skill to a project
 */
export function installWorkflowSkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean } = {}
): { success: boolean; message: string } {
  const sourcePath = getWorkflowSourcePath();
  const skillSourcePath = path.join(sourcePath, skillName);

  if (!fs.existsSync(skillSourcePath)) {
    return { success: false, message: `Workflow skill not found: ${skillName}` };
  }

  const skillFile = path.join(skillSourcePath, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    return { success: false, message: `Invalid workflow skill (no SKILL.md): ${skillName}` };
  }

  const targetPath = path.join(projectPath, '.claude', 'skills', skillName);

  if (fs.existsSync(targetPath) && !options.force) {
    return { success: false, message: `Skill already installed: ${skillName}. Use --force to overwrite.` };
  }

  // Copy skill directory
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true });
  }
  copyDirectoryRecursive(skillSourcePath, targetPath);

  // Update manifest
  let manifest = getWorkflowManifest(projectPath);
  if (!manifest) {
    manifest = createWorkflowManifest();
  }

  const sourceInfo = getWorkflowSourceInfo();
  const hash = hashDirectory(targetPath);

  manifest.skills[skillName] = {
    installedAt: new Date().toISOString(),
    sourceFile: path.relative(sourcePath, skillFile),
    hash,
    modified: false,
    installedCommit: sourceInfo.commit
  };

  saveWorkflowManifest(projectPath, manifest);

  return { success: true, message: `Installed workflow skill: ${skillName}` };
}

/**
 * Install all workflow skills to a project
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
    } else if (result.message.includes('already installed')) {
      results.skipped.push(`${skill.name}: already installed`);
    } else {
      results.errors.push(`${skill.name}: ${result.message}`);
    }
  }

  return results;
}

/**
 * Check the status of installed workflow skills
 */
export function checkWorkflowStatus(projectPath: string): WorkflowStatusInfo[] {
  const manifest = getWorkflowManifest(projectPath);
  if (!manifest) {
    return [];
  }

  const sourcePath = getWorkflowSourcePath();
  const sourceInfo = getWorkflowSourceInfo();
  const statuses: WorkflowStatusInfo[] = [];

  for (const [skillName, info] of Object.entries(manifest.skills)) {
    const installedPath = path.join(projectPath, '.claude', 'skills', skillName);
    const sourceSkillPath = path.join(sourcePath, skillName);

    if (!fs.existsSync(installedPath)) {
      statuses.push({
        name: skillName,
        status: 'missing',
        installedCommit: info.installedCommit
      });
      continue;
    }

    const currentHash = hashDirectory(installedPath);
    const modified = currentHash !== info.hash;

    if (!fs.existsSync(sourceSkillPath)) {
      statuses.push({
        name: skillName,
        status: 'unknown',
        installedCommit: info.installedCommit,
        modified
      });
      continue;
    }

    const sourceHash = hashDirectory(sourceSkillPath);

    let status: WorkflowSkillStatus;
    if (modified) {
      status = 'modified';
    } else if (info.installedCommit !== sourceInfo.commit) {
      // Check if source content actually changed
      if (currentHash !== sourceHash) {
        status = 'outdated';
      } else {
        status = 'current';
      }
    } else {
      status = 'current';
    }

    statuses.push({
      name: skillName,
      status,
      installedCommit: info.installedCommit,
      sourceCommit: sourceInfo.commit,
      modified
    });
  }

  return statuses;
}

/**
 * Upgrade workflow skills
 */
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
    // Skip if specific skills requested and this isn't one
    if (options.skills && !options.skills.includes(status.name)) {
      continue;
    }

    if (status.status === 'current') {
      results.skipped.push(`${status.name}: already current`);
      continue;
    }

    if (status.status === 'modified' && !options.force) {
      results.skipped.push(`${status.name}: locally modified (use --force to overwrite)`);
      continue;
    }

    if (status.status === 'missing' || status.status === 'unknown') {
      results.skipped.push(`${status.name}: ${status.status}`);
      continue;
    }

    // Upgrade the skill
    const result = installWorkflowSkill(status.name, projectPath, { force: true });
    if (result.success) {
      results.upgraded.push(status.name);
    } else {
      results.errors.push(`${status.name}: ${result.message}`);
    }
  }

  return results;
}

/**
 * Get installed workflow skills
 */
export function getInstalledWorkflowSkills(projectPath: string): string[] {
  const manifest = getWorkflowManifest(projectPath);
  if (!manifest) {
    return [];
  }
  return Object.keys(manifest.skills);
}

export type { WorkflowManifest, WorkflowSkillInfo, WorkflowStatusInfo };
