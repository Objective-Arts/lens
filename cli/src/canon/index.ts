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
const CANON_SUBDIRS = ['', 'javascript', 'go', 'java', 'python', 'angular', 'testing', 'visualization', 'business', 'ui-ux', 'csharp', 'react', 'security', 'engineering', 'writing', 'patterns', 'database'];

// ============================================================================
// Helper Functions (Kernighan: single responsibility)
// ============================================================================

/** Check if a directory contains a valid skill (has SKILL.md) */
function isValidSkillDir(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, 'SKILL.md'));
}

/** Scan a directory for skills, adding to map (first wins) */
function scanDirForSkills(
  searchPath: string,
  category: string,
  skillsByName: Map<string, CanonListItem>
): void {
  if (!fs.existsSync(searchPath)) return;

  const entries = fs.readdirSync(searchPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    if (CANON_SUBDIRS.includes(entry.name) && category === '') continue;

    const skillPath = path.join(searchPath, entry.name);
    if (isValidSkillDir(skillPath) && !skillsByName.has(entry.name)) {
      skillsByName.set(entry.name, {
        name: entry.name,
        path: skillPath,
        category: category || 'root'
      });
    }
  }
}

/** Deduplicate skills, preferring canon source over skill-library */
function deduplicateSkills(
  allSkills: CanonListItem[],
  canonSourcePath: string
): CanonListItem[] {
  const skillsByName = new Map<string, CanonListItem>();
  for (const skill of allSkills) {
    const existing = skillsByName.get(skill.name);
    if (!existing) {
      skillsByName.set(skill.name, skill);
    } else if (skill.path.startsWith(canonSourcePath) && !existing.path.startsWith(canonSourcePath)) {
      skillsByName.set(skill.name, skill);
    }
  }
  return Array.from(skillsByName.values());
}

/** Determine skill status based on hashes */
function determineSkillStatus(
  installedPath: string,
  sourcePath: string | null,
  manifestHash: string | undefined
): { status: SkillStatus; sourceHash?: string } {
  if (!sourcePath) {
    return { status: 'missing' };
  }

  const sourceHash = hashSkillDirectory(sourcePath);
  const currentHash = hashSkillDirectory(installedPath);

  if (manifestHash) {
    if (currentHash !== manifestHash) return { status: 'modified', sourceHash };
    if (sourceHash !== manifestHash) return { status: 'outdated', sourceHash };
    return { status: 'current', sourceHash };
  }

  return { status: currentHash === sourceHash ? 'current' : 'outdated', sourceHash };
}

/** Validate that skill can be copied */
function validateSkillCopy(
  skillName: string,
  targetPath: string,
  force: boolean
): { valid: true; sourcePath: string } | { valid: false; message: string } {
  const sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    return { valid: false, message: `Skill not found in source: ${skillName}` };
  }
  if (fs.existsSync(targetPath) && !force) {
    return { valid: false, message: `Skill already exists: ${skillName}. Use --force to overwrite.` };
  }
  return { valid: true, sourcePath };
}

/** Prepare target directory and copy skill files */
function performSkillCopy(sourcePath: string, targetPath: string): void {
  const skillsDir = path.dirname(targetPath);
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true });
  }
  copyDirectoryRecursive(sourcePath, targetPath);
}

/** Update manifest after copying a skill */
function updateManifestAfterCopy(
  projectPath: string,
  skillName: string,
  targetPath: string,
  sourcePath: string
): void {
  const canonPath = getCanonSourcePath();
  let manifest = readManifest(projectPath);

  if (!manifest) {
    manifest = createManifest({
      type: 'local',
      path: canonPath,
      gitRemote: getGitRemote(canonPath)
    });
  }

  updateSkillInManifest(manifest, skillName, {
    installedCommit: getGitCommit(canonPath),
    installedAt: new Date().toISOString(),
    sourceFile: path.relative(canonPath, sourcePath) || skillName,
    hash: hashSkillDirectory(targetPath),
    modified: false
  });

  writeManifest(projectPath, manifest);
}

/** Categorize a skill for upgrade decision */
function categorizeSkillForUpgrade(
  skillName: string,
  statuses: SkillStatusInfo[],
  force: boolean
): 'upgrade' | { skip: string } | { error: string } {
  const status = statuses.find(s => s.name === skillName);

  if (!status) return { error: `${skillName}: not installed` };
  if (status.status === 'current') return { skip: `${skillName}: already current` };
  if (status.status === 'modified' && !force) {
    return { skip: `${skillName}: locally modified (use --force to overwrite)` };
  }
  if (status.status === 'missing') return { error: `${skillName}: source not found` };
  return 'upgrade';
}

/** Validate paths for diff operation */
function validateDiffPaths(
  skillName: string,
  installedPath: string
): { valid: true; sourcePath: string } | { valid: false; message: string } {
  if (!fs.existsSync(installedPath)) {
    return { valid: false, message: `Skill not installed: ${skillName}` };
  }
  const sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    return { valid: false, message: `Source not found for: ${skillName}` };
  }
  return { valid: true, sourcePath };
}

/** Generate line-by-line diff between two strings */
function generateLineDiff(installedContent: string, sourceContent: string): string[] {
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

  return diff;
}

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

  if (!fs.existsSync(canonPath)) return [];

  // Search canon subdirectories (preferred source)
  for (const subdir of CANON_SUBDIRS) {
    const searchPath = subdir ? path.join(canonPath, subdir) : canonPath;
    scanDirForSkills(searchPath, subdir, skillsByName);
  }

  // Fallback: security skills from skill-library
  scanDirForSkills(SECURITY_SKILL_PATH, 'security', skillsByName);

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

  return installedSkills.map(skillName => {
    const installedPath = path.join(skillsDir, skillName);
    const manifestInfo = manifest?.skills[skillName];
    const sourcePath = findSkillSourcePath(skillName);
    const { status, sourceHash } = determineSkillStatus(installedPath, sourcePath, manifestInfo?.hash);

    return {
      name: skillName,
      status,
      installedHash: manifestInfo?.hash,
      sourceHash,
      installedCommit: manifestInfo?.installedCommit,
      sourceCommit,
      installedAt: manifestInfo?.installedAt,
      sourcePath: sourcePath ?? undefined
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
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
  const targetPath = path.join(projectPath, '.claude', 'skills', skillName);
  const validation = validateSkillCopy(skillName, targetPath, options.force ?? false);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  performSkillCopy(validation.sourcePath, targetPath);
  updateManifestAfterCopy(projectPath, skillName, targetPath, validation.sourcePath);

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
  const result: CanonUpgradeResult = { upgraded: [], skipped: [], errors: [] };
  const statuses = checkSkillStatus(projectPath);
  const skillsToUpgrade = options.skills || statuses.map(s => s.name);

  for (const skillName of skillsToUpgrade) {
    const category = categorizeSkillForUpgrade(skillName, statuses, options.force ?? false);

    if (category === 'upgrade') {
      const copyResult = copySkill(skillName, projectPath, { force: true });
      copyResult.success
        ? result.upgraded.push(skillName)
        : result.errors.push(`${skillName}: ${copyResult.message}`);
    } else if ('skip' in category) {
      result.skipped.push(category.skip);
    } else {
      result.errors.push(category.error);
    }
  }

  return result;
}

/**
 * Show diff between installed and source skill
 */
export function diffSkill(skillName: string, projectPath: string): string | null {
  const installedPath = path.join(projectPath, '.claude', 'skills', skillName);
  const validation = validateDiffPaths(skillName, installedPath);

  if (!validation.valid) return validation.message;

  const installedMd = path.join(installedPath, 'SKILL.md');
  const sourceMd = path.join(validation.sourcePath, 'SKILL.md');

  if (!fs.existsSync(installedMd) || !fs.existsSync(sourceMd)) {
    return 'Cannot compare: SKILL.md missing';
  }

  const installedContent = fs.readFileSync(installedMd, 'utf-8');
  const sourceContent = fs.readFileSync(sourceMd, 'utf-8');

  if (installedContent === sourceContent) return 'No differences in SKILL.md';

  const diff = generateLineDiff(installedContent, sourceContent);
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
/** Deploy a single skill, returns success/skip/error */
function deploySkill(
  skill: CanonListItem,
  skillsDir: string,
  force: boolean
): 'deployed' | 'skipped' | string {
  const sourceFile = path.join(skill.path, 'SKILL.md');
  const targetDir = path.join(skillsDir, skill.name);

  if (!fs.existsSync(sourceFile)) return `${skill.name}: SKILL.md not found`;
  if (fs.existsSync(targetDir) && !force) return 'skipped';

  try {
    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true });
    copyDirectoryRecursive(skill.path, targetDir);
    return 'deployed';
  } catch (err) {
    return `${skill.name}: ${err instanceof Error ? err.message : 'copy failed'}`;
  }
}

export function deployAllSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { deployed: number; skipped: number; errors: string[]; deployedNames: string[] } {
  const result = { deployed: 0, skipped: 0, errors: [] as string[], deployedNames: [] as string[] };
  const skills = deduplicateSkills(listCanonSkills(), getCanonSourcePath());
  const skillsDir = path.join(projectPath, '.claude', 'skills');

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  for (const skill of skills) {
    const status = deploySkill(skill, skillsDir, options.force ?? false);
    if (status === 'deployed') {
      result.deployed++;
      result.deployedNames.push(skill.name);
    } else if (status === 'skipped') {
      result.skipped++;
    } else {
      result.errors.push(status);
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
/** Compare a single skill against source, returns match status */
function compareSkillToSource(
  skill: CanonListItem,
  skillsDir: string
): 'match' | 'missing' | 'differs' {
  const sourceFile = path.join(skill.path, 'SKILL.md');
  const targetFile = path.join(skillsDir, skill.name, 'SKILL.md');

  if (!fs.existsSync(sourceFile)) return 'match'; // Skip if no source
  if (!fs.existsSync(targetFile)) return 'missing';

  const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
  const targetContent = fs.readFileSync(targetFile, 'utf-8');
  return sourceContent === targetContent ? 'match' : 'differs';
}

/** Get installed skill directories */
function getInstalledSkillDirs(skillsDir: string): string[] {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir).filter(f => {
    const fullPath = path.join(skillsDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
  });
}

export function verifySkillsMatch(projectPath: string): {
  matches: string[];
  differs: { name: string; reason: string }[];
  missingInProject: string[];
  extraInProject: string[];
  allMatch: boolean;
} {
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const result = {
    matches: [] as string[],
    differs: [] as { name: string; reason: string }[],
    missingInProject: [] as string[],
    extraInProject: [] as string[],
    allMatch: true
  };

  if (!fs.existsSync(skillsDir)) {
    result.allMatch = false;
    return result;
  }

  const canonSkills = deduplicateSkills(listCanonSkills(), getCanonSourcePath());
  const canonSkillNames = new Set(canonSkills.map(s => s.name));
  const installedDirs = getInstalledSkillDirs(skillsDir);

  // Compare each canon skill
  for (const skill of canonSkills) {
    const status = compareSkillToSource(skill, skillsDir);
    if (status === 'match') {
      result.matches.push(skill.name);
    } else if (status === 'missing') {
      result.missingInProject.push(skill.name);
      result.allMatch = false;
    } else {
      result.differs.push({ name: skill.name, reason: 'content differs' });
      result.allMatch = false;
    }
  }

  // Find extra skills not in canon
  result.extraInProject = installedDirs.filter(name => !canonSkillNames.has(name));

  return result;
}
