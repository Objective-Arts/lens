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
import { hashSkillDirectory } from './hash.js';
import {
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  getGitCommit,
  getGitRemote
} from './manifest.js';
import type {
  CanonListItem,
  SkillStatus,
  SkillStatusInfo,
  CanonUpgradeResult
} from './types.js';

export * from './types.js';
export * from './hash.js';
export * from './manifest.js';

// Default canon source paths - use claude-optimal/canon as the source of truth
const DEFAULT_CANON_PATH = path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'canon');
const SECURITY_SKILL_PATH = path.join(homedir(), '.claude', 'skill-library', 'security');
const TECH_SKILL_PATH = path.join(homedir(), '.claude', 'skill-library', 'tech');

// Subdirectories to search in canon-skills
const CANON_SUBDIRS = ['', 'javascript', 'go', 'java', 'python', 'angular', 'testing', 'visualization', 'business', 'ui-ux', 'csharp', 'react', 'security', 'engineering', 'writing', 'patterns'];

/**
 * Get the configured canon source path.
 *
 * Can be overridden via `CANON_SKILLS_PATH` environment variable.
 *
 * @returns Absolute path to canon skills directory
 *
 * @example
 * ```typescript
 * const sourcePath = getCanonSourcePath();
 * // Default: ~/local-tech-projects/claude-optimal/canon
 * ```
 */
export function getCanonSourcePath(): string {
  // TODO: Could be configurable via env var or config file
  return process.env.CANON_SKILLS_PATH || DEFAULT_CANON_PATH;
}

/**
 * List all available canon skills from the source directory.
 *
 * Searches all category subdirectories (javascript, testing, etc.)
 * and returns skills that have a valid SKILL.md file.
 *
 * @returns Array of available skills with name, path, and category
 *
 * @example
 * ```typescript
 * const skills = listCanonSkills();
 * skills.forEach(skill => {
 *   console.log(`${skill.name} (${skill.category})`);
 * });
 * ```
 */
export function listCanonSkills(): CanonListItem[] {
  const canonPath = getCanonSourcePath();
  const skillsByName = new Map<string, CanonListItem>();

  if (!fs.existsSync(canonPath)) {
    return [];
  }

  // Search in all subdirectories of canon source (preferred)
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
        // Canon source always wins - don't overwrite
        if (!skillsByName.has(entry.name)) {
          skillsByName.set(entry.name, {
            name: entry.name,
            path: skillPath,
            category: subdir || 'root'
          });
        }
      }
    }
  }

  // Also add security skills from skill-library (fallback for skills not in canon)
  if (fs.existsSync(SECURITY_SKILL_PATH)) {
    const entries = fs.readdirSync(SECURITY_SKILL_PATH, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const skillPath = path.join(SECURITY_SKILL_PATH, entry.name);
      const skillMdPath = path.join(skillPath, 'SKILL.md');

      if (fs.existsSync(skillMdPath)) {
        // Only add if not already in canon
        if (!skillsByName.has(entry.name)) {
          skillsByName.set(entry.name, {
            name: entry.name,
            path: skillPath,
            category: 'security'
          });
        }
      }
    }
  }

  return Array.from(skillsByName.values()).sort((a, b) => a.name.localeCompare(b.name));
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
 * Check the status of all installed skills compared to source.
 *
 * Compares each installed skill's content hash against the source
 * to determine if it's current, outdated, modified, or missing.
 *
 * @param projectPath - Project directory containing installed skills
 * @returns Array of status info for each installed skill
 *
 * @example
 * ```typescript
 * const statuses = checkSkillStatus('./myproject');
 * const outdated = statuses.filter(s => s.status === 'outdated');
 * console.log(`${outdated.length} skills need updates`);
 * ```
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
 * Copy a skill from source to project.
 *
 * Copies the skill directory (not symlink) and updates the canon manifest
 * with version tracking information.
 *
 * @param skillName - Name of the skill to copy
 * @param projectPath - Target project directory
 * @param options - Copy options
 * @param options.force - Overwrite existing skill (default: false)
 * @returns Result with success status and message
 *
 * @example
 * ```typescript
 * const result = copySkill('abramov', './myproject');
 * if (result.success) {
 *   console.log('Skill copied successfully');
 * }
 *
 * // Force overwrite
 * const forceResult = copySkill('abramov', './myproject', { force: true });
 * ```
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
 * Upgrade outdated skills from source.
 *
 * Updates all installed skills that have newer versions in source.
 * Skips locally modified skills unless `force` is true.
 *
 * @param projectPath - Project directory containing installed skills
 * @param options - Upgrade options
 * @param options.force - Overwrite locally modified skills (default: false)
 * @param options.skills - Specific skills to upgrade (default: all)
 * @returns Result with upgraded, skipped, and error arrays
 *
 * @example
 * ```typescript
 * // Upgrade all outdated skills
 * const result = upgradeSkills('./myproject');
 * console.log(`Upgraded: ${result.upgraded.join(', ')}`);
 *
 * // Upgrade specific skills with force
 * const result = upgradeSkills('./myproject', {
 *   skills: ['abramov', 'dodds'],
 *   force: true
 * });
 * ```
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

/**
 * Deploy all canon skills to a project's .claude/skills/ directory.
 *
 * Copies each SKILL.md file as {skillname}.md to the target project.
 * This is the recommended way to set up a new project with all canon skills.
 *
 * @param projectPath - Target project directory
 * @param options - Deploy options
 * @param options.force - Overwrite existing skills (default: false)
 * @returns Result with deployed count and any errors
 *
 * @example
 * ```typescript
 * const result = deployAllSkills('./myproject');
 * console.log(`Deployed ${result.deployed} skills`);
 * ```
 */
export function deployAllSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { deployed: number; skipped: number; errors: string[]; deployedNames: string[] } {
  const result = { deployed: 0, skipped: 0, errors: [] as string[], deployedNames: [] as string[] };

  // Deduplicate skills, preferring canon source over skill-library
  const allSkills = listCanonSkills();
  const canonSourcePath = getCanonSourcePath();
  const skillsByName = new Map<string, typeof allSkills[0]>();

  for (const skill of allSkills) {
    const existing = skillsByName.get(skill.name);
    if (!existing) {
      skillsByName.set(skill.name, skill);
    } else if (skill.path.startsWith(canonSourcePath) && !existing.path.startsWith(canonSourcePath)) {
      // Prefer canon source over skill-library
      skillsByName.set(skill.name, skill);
    }
  }

  const skills = Array.from(skillsByName.values());
  const skillsDir = path.join(projectPath, '.claude', 'skills');

  // Ensure skills directory exists
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  for (const skill of skills) {
    const sourceFile = path.join(skill.path, 'SKILL.md');
    const targetDir = path.join(skillsDir, skill.name);

    if (!fs.existsSync(sourceFile)) {
      result.errors.push(`${skill.name}: SKILL.md not found`);
      continue;
    }

    // Check if directory already exists (skip to avoid duplicates)
    if (fs.existsSync(targetDir) && !options.force) {
      result.skipped++;
      continue;
    }

    try {
      // Remove existing directory if force
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true });
      }
      // Copy entire directory (preserves SKILL.md, SUMMARY.md, etc.)
      copyDirectoryRecursive(skill.path, targetDir);
      result.deployed++;
      result.deployedNames.push(skill.name);
    } catch (err) {
      result.errors.push(`${skill.name}: ${err instanceof Error ? err.message : 'copy failed'}`);
    }
  }

  return result;
}

/**
 * Verify that installed skills match the canon source exactly.
 *
 * Compares each skill in the project against the source canon repository
 * to identify any differences, missing skills, or extra files.
 *
 * @param projectPath - Project directory containing installed skills
 * @returns Verification result with matches, differences, and summary
 *
 * @example
 * ```typescript
 * const result = verifySkillsMatch('./myproject');
 * if (result.allMatch) {
 *   console.log('All skills are identical to canon source');
 * } else {
 *   console.log(`${result.differs.length} skills differ`);
 * }
 * ```
 */
export function verifySkillsMatch(projectPath: string): {
  matches: string[];
  differs: { name: string; reason: string }[];
  missingInProject: string[];
  extraInProject: string[];
  allMatch: boolean;
} {
  const result = {
    matches: [] as string[],
    differs: [] as { name: string; reason: string }[],
    missingInProject: [] as string[],
    extraInProject: [] as string[],
    allMatch: true
  };

  const skillsDir = path.join(projectPath, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) {
    result.allMatch = false;
    return result;
  }

  // Get all canon skills from source, deduplicated by name
  // Prefer canon source path over skill-library
  const allSkills = listCanonSkills();
  const canonSourcePath = getCanonSourcePath();
  const skillsByName = new Map<string, typeof allSkills[0]>();

  for (const skill of allSkills) {
    const existing = skillsByName.get(skill.name);
    if (!existing) {
      skillsByName.set(skill.name, skill);
    } else if (skill.path.startsWith(canonSourcePath) && !existing.path.startsWith(canonSourcePath)) {
      // Prefer canon source over skill-library
      skillsByName.set(skill.name, skill);
    }
  }

  const canonSkills = Array.from(skillsByName.values());
  const canonSkillNames = new Set(canonSkills.map(s => s.name));

  // Get installed skill directories (not flat .md files)
  const installedFiles = fs.readdirSync(skillsDir)
    .filter(f => {
      const fullPath = path.join(skillsDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
    });

  // Compare each canon skill (deduplicated)
  for (const skill of canonSkills) {
    const sourceFile = path.join(skill.path, 'SKILL.md');
    const targetDir = path.join(skillsDir, skill.name);
    const targetFile = path.join(targetDir, 'SKILL.md');

    if (!fs.existsSync(sourceFile)) {
      continue; // Skip if source doesn't have SKILL.md
    }

    if (!fs.existsSync(targetDir) || !fs.existsSync(targetFile)) {
      result.missingInProject.push(skill.name);
      result.allMatch = false;
      continue;
    }

    // Compare content
    const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
    const targetContent = fs.readFileSync(targetFile, 'utf-8');

    if (sourceContent === targetContent) {
      result.matches.push(skill.name);
    } else {
      result.differs.push({ name: skill.name, reason: 'content differs' });
      result.allMatch = false;
    }
  }

  // Find extra files in project not in canon
  for (const installed of installedFiles) {
    if (!canonSkillNames.has(installed)) {
      // Check if it's a workflow skill or other non-canon skill
      result.extraInProject.push(installed);
    }
  }

  return result;
}
