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
import { isValidSkillName } from '../utils/validation.js';
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

function updateManifestAfterCopy(
  projectPath: string,
  skillName: string,
  sourcePath: string,
  targetPath: string
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
    sourceFile: (() => {
      const rel = path.relative(canonPath, sourcePath);
      return rel.startsWith('..') ? skillName : (rel || skillName);
    })(),
    hash: hashSkillDirectory(targetPath),
    modified: false
  });
  writeManifest(projectPath, manifest);
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

  updateManifestAfterCopy(projectPath, skillName, sourcePath, targetPath);

  return { success: true, message: `Copied skill: ${skillName}` };
}

function categorizeForUpgrade(
  status: SkillStatusInfo | undefined,
  force: boolean
): { action: 'upgrade' | 'skip' | 'error'; message: string } {
  if (!status) {
    return { action: 'error', message: 'not installed' };
  }
  if (status.status === 'current') {
    return { action: 'skip', message: 'already current' };
  }
  if (status.status === 'modified' && !force) {
    return { action: 'skip', message: 'locally modified (use --force to overwrite)' };
  }
  if (status.status === 'missing') {
    return { action: 'error', message: 'source not found' };
  }
  return { action: 'upgrade', message: '' };
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
    const status = statuses.find(s => s.name === skillName);
    const category = categorizeForUpgrade(status, force);

    if (category.action === 'skip') {
      result.skipped.push(`${skillName}: ${category.message}`);
      continue;
    }
    if (category.action === 'error') {
      result.errors.push(`${skillName}: ${category.message}`);
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
