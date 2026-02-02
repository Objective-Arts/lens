/**
 * Canon skill deployment and verification.
 *
 * Deploy skills to projects and verify installations.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CanonListItem } from './types.js';
import { copyDirectoryRecursive, deduplicateSkills, getInstalledSkillDirs } from './helpers.js';
import { listCanonSkills, getCanonSourcePath } from './source.js';

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

/**
 * Deploy all canon skills to a project's .claude/skills/ directory.
 */
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

/**
 * Verify that installed skills match the canon source exactly.
 */
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
