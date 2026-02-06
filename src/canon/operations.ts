/**
 * Canon skill operations.
 *
 * Copy, upgrade, diff, and status checking for skills.
 */

import * as fs from 'fs';
import * as path from 'path';
import { hashSkillDirectory } from './hash.js';
import {
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  getGitCommit,
  getGitRemote
} from './manifest.js';
import type { SkillStatusInfo, CanonUpgradeResult } from './types.js';
import {
  determineSkillStatus,
  generateLineDiff,
  copyDirectoryRecursive,
  getInstalledSkills
} from './helpers.js';
import { getCanonSourcePath, findSkillSourcePath } from './source.js';

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

/**
 * Check the status of all installed skills compared to source.
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

/** Reject skill names with path traversal characters */
function isValidSkillName(name: string): boolean {
  return !name.includes('/') && !name.includes('\\') && !name.includes('..');
}

/**
 * Copy a skill from source to project.
 */
export function copySkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean } = {}
): { success: boolean; message: string } {
  if (!isValidSkillName(skillName)) {
    return { success: false, message: `Invalid skill name (path traversal): ${skillName}` };
  }
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
 * Show diff between installed and source skill.
 */
export function diffSkill(skillName: string, projectPath: string): string | null {
  if (!isValidSkillName(skillName)) {
    return `Invalid skill name (path traversal): ${skillName}`;
  }
  const installedPath = path.join(projectPath, '.claude', 'skills', skillName);
  const validation = validateDiffPaths(skillName, installedPath);

  if (!validation.valid) return validation.message;

  const installedMd = path.join(installedPath, 'SKILL.md');
  const sourceMd = path.join(validation.sourcePath, 'SKILL.md');

  let installedContent: string;
  let sourceContent: string;
  try { installedContent = fs.readFileSync(installedMd, 'utf-8'); }
  catch { return 'Cannot compare: installed SKILL.md missing'; }
  try { sourceContent = fs.readFileSync(sourceMd, 'utf-8'); }
  catch { return 'Cannot compare: source SKILL.md missing'; }

  if (installedContent === sourceContent) return 'No differences in SKILL.md';

  const diff = generateLineDiff(installedContent, sourceContent);
  return diff.slice(0, 50).join('\n') + (diff.length > 50 ? '\n... (truncated)' : '');
}
