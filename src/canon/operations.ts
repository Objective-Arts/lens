import * as fs from 'fs';
import * as path from 'path';
import { hashSkillDirectory } from './hash.js';
import {
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest
} from './manifest.js';
import { getGitCommit, getGitRemote } from '../utils/git.js';
import type { SkillStatusInfo, CanonUpgradeResult } from './types.js';
import {
  determineSkillStatus,
  generateLineDiff,
  getInstalledSkills
} from './helpers.js';
import { copyDirectorySync } from '../utils/fs.js';
import { getCanonSourcePath, findSkillSourcePath } from './source.js';

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

export function copySkill(
  skillName: string,
  projectPath: string,
  options: { force?: boolean } = {}
): { success: boolean; message: string } {
  if (!isValidSkillName(skillName)) {
    return { success: false, message: `Invalid skill name (path traversal): ${skillName}` };
  }

  const targetPath = path.join(projectPath, '.claude', 'skills', skillName);
  const force = options.force ?? false;

  // Validate skill can be copied
  const sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    return { success: false, message: `Skill not found in source: ${skillName}` };
  }
  if (fs.existsSync(targetPath) && !force) {
    return { success: false, message: `Skill already exists: ${skillName}. Use --force to overwrite.` };
  }

  // Prepare target directory and copy skill files
  const skillsDir = path.dirname(targetPath);
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true });
  }
  copyDirectorySync(sourcePath, targetPath);

  // Update manifest after copy
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
    sourceFile: (() => {
      const rel = path.relative(canonPath, sourcePath);
      return rel.startsWith('..') ? skillName : (rel || skillName);
    })(),
    hash: hashSkillDirectory(targetPath),
    modified: false
  });
  writeManifest(projectPath, manifest);

  return { success: true, message: `Copied skill: ${skillName}` };
}

export function upgradeSkills(
  projectPath: string,
  options: { force?: boolean; skills?: string[] } = {}
): CanonUpgradeResult {
  const result: CanonUpgradeResult = { upgraded: [], skipped: [], errors: [] };
  const statuses = checkSkillStatus(projectPath);
  const force = options.force ?? false;
  const skillsToUpgrade = options.skills || statuses.map(s => s.name);

  for (const skillName of skillsToUpgrade) {
    // Categorize skill for upgrade decision
    const status = statuses.find(s => s.name === skillName);
    if (!status) {
      result.errors.push(`${skillName}: not installed`);
      continue;
    }
    if (status.status === 'current') {
      result.skipped.push(`${skillName}: already current`);
      continue;
    }
    if (status.status === 'modified' && !force) {
      result.skipped.push(`${skillName}: locally modified (use --force to overwrite)`);
      continue;
    }
    if (status.status === 'missing') {
      result.errors.push(`${skillName}: source not found`);
      continue;
    }

    const copyResult = copySkill(skillName, projectPath, { force: true });
    if (copyResult.success) {
      result.upgraded.push(skillName);
    } else {
      result.errors.push(`${skillName}: ${copyResult.message}`);
    }
  }

  return result;
}

export function diffSkill(skillName: string, projectPath: string): string | null {
  if (!isValidSkillName(skillName)) {
    return `Invalid skill name (path traversal): ${skillName}`;
  }

  const installedPath = path.join(projectPath, '.claude', 'skills', skillName);

  // Validate paths
  if (!fs.existsSync(installedPath)) {
    return `Skill not installed: ${skillName}`;
  }
  const sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    return `Source not found for: ${skillName}`;
  }

  const installedMd = path.join(installedPath, 'SKILL.md');
  const sourceMd = path.join(sourcePath, 'SKILL.md');

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
