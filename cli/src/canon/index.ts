/**
 * Canon skill copy-with-manifest system
 *
 * Skills are copied (not symlinked) into .claude/skills/ as real files.
 * A manifest tracks source, version, and upgrade path.
 * Projects are fully portable - work standalone.
 * Upgrades are explicit - run `cc-config canon upgrade`.
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { hashSkillDirectory, isSkillModified } from './hash.js';
import {
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  getGitCommit,
  getGitRemote
} from './manifest.js';
import type {
  CanonManifest,
  CanonSource,
  CanonListItem,
  SkillStatus,
  SkillStatusInfo,
  CanonUpgradeResult,
  InstalledSkillInfo
} from './types.js';

export * from './types.js';
export * from './hash.js';
export * from './manifest.js';

// Default canon source paths
const DEFAULT_CANON_PATH = path.join(homedir(), 'local-tech-projects', 'canon-skills');
const SECURITY_SKILL_PATH = path.join(homedir(), '.claude', 'skill-library', 'security');
const TECH_SKILL_PATH = path.join(homedir(), '.claude', 'skill-library', 'tech');

// Subdirectories to search in canon-skills
const CANON_SUBDIRS = ['', 'javascript', 'typescript', 'go', 'java', 'python', 'angular', 'testing', 'visualization', 'business'];

/**
 * Get the configured canon source path
 */
export function getCanonSourcePath(): string {
  // TODO: Could be configurable via env var or config file
  return process.env.CANON_SKILLS_PATH || DEFAULT_CANON_PATH;
}

/**
 * List all available canon skills from the source directory
 */
export function listCanonSkills(): CanonListItem[] {
  const canonPath = getCanonSourcePath();
  const skills: CanonListItem[] = [];

  if (!fs.existsSync(canonPath)) {
    return skills;
  }

  // Search in all subdirectories
  for (const subdir of CANON_SUBDIRS) {
    const searchPath = subdir ? path.join(canonPath, subdir) : canonPath;

    if (!fs.existsSync(searchPath)) continue;

    const entries = fs.readdirSync(searchPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (CANON_SUBDIRS.includes(entry.name) && subdir === '') continue; // Skip subdirs at root level

      const skillPath = path.join(searchPath, entry.name);
      const skillMdPath = path.join(skillPath, 'SKILL.md');

      // Only include if it has a SKILL.md file
      if (fs.existsSync(skillMdPath)) {
        skills.push({
          name: entry.name,
          path: skillPath,
          category: subdir || 'root'
        });
      }
    }
  }

  // Also add security skills
  if (fs.existsSync(SECURITY_SKILL_PATH)) {
    const entries = fs.readdirSync(SECURITY_SKILL_PATH, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const skillPath = path.join(SECURITY_SKILL_PATH, entry.name);
      const skillMdPath = path.join(skillPath, 'SKILL.md');

      if (fs.existsSync(skillMdPath)) {
        skills.push({
          name: entry.name,
          path: skillPath,
          category: 'security'
        });
      }
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find the source path for a skill by name
 */
export function findSkillSourcePath(skillName: string): string | null {
  // Check canon-skills first
  const canonPath = getCanonSourcePath();

  for (const subdir of CANON_SUBDIRS) {
    const searchPath = subdir ? path.join(canonPath, subdir, skillName) : path.join(canonPath, skillName);

    if (fs.existsSync(searchPath) && fs.existsSync(path.join(searchPath, 'SKILL.md'))) {
      return searchPath;
    }
  }

  // Check security skills
  const securityPath = path.join(SECURITY_SKILL_PATH, skillName);
  if (fs.existsSync(securityPath) && fs.existsSync(path.join(securityPath, 'SKILL.md'))) {
    return securityPath;
  }

  // Check tech skills
  const techPath = path.join(TECH_SKILL_PATH, skillName);
  if (fs.existsSync(techPath) && fs.existsSync(path.join(techPath, 'SKILL.md'))) {
    return techPath;
  }

  return null;
}

/**
 * List skills installed in a project's .claude/skills/ directory
 */
export function getInstalledSkills(projectPath: string): string[] {
  const skillsDir = path.join(projectPath, '.claude', 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort();
}

/**
 * Check the status of all installed skills vs source
 */
export function checkSkillStatus(projectPath: string): SkillStatusInfo[] {
  const manifest = readManifest(projectPath);
  const installedSkills = getInstalledSkills(projectPath);
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const canonPath = getCanonSourcePath();
  const sourceCommit = getGitCommit(canonPath);

  const statuses: SkillStatusInfo[] = [];

  for (const skillName of installedSkills) {
    const installedPath = path.join(skillsDir, skillName);
    const manifestInfo = manifest?.skills[skillName];
    const sourcePath = findSkillSourcePath(skillName);

    let status: SkillStatus = 'unknown';
    let sourceHash: string | undefined;

    if (sourcePath) {
      sourceHash = hashSkillDirectory(sourcePath);

      if (manifestInfo) {
        // Check if locally modified
        const currentHash = hashSkillDirectory(installedPath);
        if (currentHash !== manifestInfo.hash) {
          status = 'modified';
        } else if (sourceHash !== manifestInfo.hash) {
          status = 'outdated';
        } else {
          status = 'current';
        }
      } else {
        // No manifest entry - check against source
        const currentHash = hashSkillDirectory(installedPath);
        if (currentHash === sourceHash) {
          status = 'current';
        } else {
          status = 'outdated';
        }
      }
    } else {
      status = 'missing'; // Source not found
    }

    statuses.push({
      name: skillName,
      status,
      installedHash: manifestInfo?.hash,
      sourceHash,
      installedCommit: manifestInfo?.installedCommit,
      sourceCommit,
      installedAt: manifestInfo?.installedAt,
      sourcePath: sourcePath ?? undefined
    });
  }

  return statuses.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Copy a skill from source to project
 */
export function copySkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean } = {}
): { success: boolean; message: string } {
  const sourcePath = findSkillSourcePath(skillName);

  if (!sourcePath) {
    return { success: false, message: `Skill not found in source: ${skillName}` };
  }

  const targetPath = path.join(projectPath, '.claude', 'skills', skillName);

  // Check if already exists
  if (fs.existsSync(targetPath) && !options.force) {
    return { success: false, message: `Skill already exists: ${skillName}. Use --force to overwrite.` };
  }

  // Ensure skills directory exists
  const skillsDir = path.dirname(targetPath);
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  // Remove existing if force
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true });
  }

  // Copy the skill directory
  copyDirectoryRecursive(sourcePath, targetPath);

  // Update manifest
  const canonPath = getCanonSourcePath();
  let manifest = readManifest(projectPath);

  if (!manifest) {
    manifest = createManifest({
      type: 'local',
      path: canonPath,
      gitRemote: getGitRemote(canonPath)
    });
  }

  const hash = hashSkillDirectory(targetPath);
  const sourceCommit = getGitCommit(canonPath);

  updateSkillInManifest(manifest, skillName, {
    installedCommit: sourceCommit,
    installedAt: new Date().toISOString(),
    sourceFile: path.relative(canonPath, sourcePath) || skillName,
    hash,
    modified: false
  });

  writeManifest(projectPath, manifest);

  return { success: true, message: `Copied skill: ${skillName}` };
}

/**
 * Upgrade outdated skills from source
 */
export function upgradeSkills(
  projectPath: string,
  options: { force?: boolean; skills?: string[] } = {}
): CanonUpgradeResult {
  const result: CanonUpgradeResult = {
    upgraded: [],
    skipped: [],
    errors: []
  };

  const statuses = checkSkillStatus(projectPath);
  const skillsToUpgrade = options.skills || statuses.map(s => s.name);

  for (const skillName of skillsToUpgrade) {
    const status = statuses.find(s => s.name === skillName);

    if (!status) {
      result.errors.push(`${skillName}: not installed`);
      continue;
    }

    if (status.status === 'current') {
      result.skipped.push(`${skillName}: already current`);
      continue;
    }

    if (status.status === 'modified' && !options.force) {
      result.skipped.push(`${skillName}: locally modified (use --force to overwrite)`);
      continue;
    }

    if (status.status === 'missing') {
      result.errors.push(`${skillName}: source not found`);
      continue;
    }

    // Perform the upgrade
    const copyResult = copySkill(skillName, projectPath, { force: true });
    if (copyResult.success) {
      result.upgraded.push(skillName);
    } else {
      result.errors.push(`${skillName}: ${copyResult.message}`);
    }
  }

  return result;
}

/**
 * Show diff between installed and source skill
 */
export function diffSkill(skillName: string, projectPath: string): string | null {
  const installedPath = path.join(projectPath, '.claude', 'skills', skillName);
  const sourcePath = findSkillSourcePath(skillName);

  if (!fs.existsSync(installedPath)) {
    return `Skill not installed: ${skillName}`;
  }

  if (!sourcePath) {
    return `Source not found for: ${skillName}`;
  }

  // Simple diff - compare SKILL.md content
  const installedMd = path.join(installedPath, 'SKILL.md');
  const sourceMd = path.join(sourcePath, 'SKILL.md');

  if (!fs.existsSync(installedMd) || !fs.existsSync(sourceMd)) {
    return 'Cannot compare: SKILL.md missing';
  }

  const installedContent = fs.readFileSync(installedMd, 'utf-8');
  const sourceContent = fs.readFileSync(sourceMd, 'utf-8');

  if (installedContent === sourceContent) {
    return 'No differences in SKILL.md';
  }

  // Return a simple line diff
  const installedLines = installedContent.split('\n');
  const sourceLines = sourceContent.split('\n');

  const diff: string[] = [];
  const maxLines = Math.max(installedLines.length, sourceLines.length);

  for (let i = 0; i < maxLines; i++) {
    const installed = installedLines[i] ?? '';
    const source = sourceLines[i] ?? '';

    if (installed !== source) {
      if (installed && !source) {
        diff.push(`- ${i + 1}: ${installed.slice(0, 80)}`);
      } else if (!installed && source) {
        diff.push(`+ ${i + 1}: ${source.slice(0, 80)}`);
      } else {
        diff.push(`- ${i + 1}: ${installed.slice(0, 80)}`);
        diff.push(`+ ${i + 1}: ${source.slice(0, 80)}`);
      }
    }
  }

  return diff.slice(0, 50).join('\n') + (diff.length > 50 ? '\n... (truncated)' : '');
}

/**
 * Recursively copy a directory
 */
function copyDirectoryRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

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
 * Get canon source info for display
 */
export function getCanonSourceInfo(): { path: string; commit?: string; remote?: string } {
  const canonPath = getCanonSourcePath();
  return {
    path: canonPath,
    commit: getGitCommit(canonPath),
    remote: getGitRemote(canonPath)
  };
}
