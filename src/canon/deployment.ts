import * as fs from 'fs';
import * as path from 'path';
import { deduplicateSkills, getInstalledSkillDirs } from './helpers.js';
import { copyDirectorySync } from '../utils/fs.js';
import { listCanonSkills, getCanonSourcePath } from './source.js';

interface DeployResult {
  type: 'deployed' | 'skipped' | 'error';
  name?: string;
  error?: string;
}

interface VerifyResult {
  matches: string[];
  differs: { name: string; reason: string }[];
  missingInProject: string[];
  extraInProject: string[];
  allMatch: boolean;
}

function deploySingleSkill(
  skill: { name: string; path: string },
  skillsDir: string,
  force: boolean
): DeployResult {
  const sourceFile = path.join(skill.path, 'SKILL.md');
  const targetDir = path.join(skillsDir, skill.name);

  if (!fs.existsSync(sourceFile)) {
    return { type: 'error', error: `${skill.name}: SKILL.md not found` };
  }
  if (fs.existsSync(targetDir) && !force) {
    return { type: 'skipped' };
  }

  try {
    const resolvedTarget = path.resolve(targetDir);
    const resolvedParent = path.resolve(skillsDir);
    if (!resolvedTarget.startsWith(resolvedParent + path.sep)) {
      return { type: 'error', error: `${skill.name}: target path escapes skills directory` };
    }
    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true });
    copyDirectorySync(skill.path, targetDir);
    return { type: 'deployed', name: skill.name };
  } catch (err) {
    return { type: 'error', error: `${skill.name}: ${err instanceof Error ? err.message : 'copy failed'}` };
  }
}

export function deployAllSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { deployed: number; skipped: number; errors: string[]; deployedNames: string[] } {
  const result = { deployed: 0, skipped: 0, errors: [] as string[], deployedNames: [] as string[] };
  const skills = deduplicateSkills(listCanonSkills(), getCanonSourcePath());
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const force = options.force ?? false;

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  for (const skill of skills) {
    const deployResult = deploySingleSkill(skill, skillsDir, force);
    switch (deployResult.type) {
      case 'deployed':
        result.deployed++;
        if (deployResult.name) result.deployedNames.push(deployResult.name);
        break;
      case 'skipped':
        result.skipped++;
        break;
      case 'error':
        if (deployResult.error) result.errors.push(deployResult.error);
        break;
    }
  }

  return result;
}

function compareSkillContent(
  skill: { name: string; path: string },
  skillsDir: string
): { type: 'match' | 'differs' | 'missing' } | null {
  const sourceFile = path.join(skill.path, 'SKILL.md');
  const targetFile = path.join(skillsDir, skill.name, 'SKILL.md');

  let sourceContent: string;
  let targetContent: string;
  try { sourceContent = fs.readFileSync(sourceFile, 'utf-8'); }
  catch { return null; } // Source missing — skip comparison
  try { targetContent = fs.readFileSync(targetFile, 'utf-8'); }
  catch { return { type: 'missing' }; }

  return sourceContent === targetContent ? { type: 'match' } : { type: 'differs' };
}

function createEmptyVerifyResult(): VerifyResult {
  return {
    matches: [], differs: [], missingInProject: [], extraInProject: [], allMatch: true
  };
}

function applyComparison(result: VerifyResult, skillName: string, type: 'match' | 'differs' | 'missing'): void {
  switch (type) {
    case 'match': result.matches.push(skillName); break;
    case 'differs':
      result.differs.push({ name: skillName, reason: 'content differs' });
      result.allMatch = false;
      break;
    case 'missing':
      result.missingInProject.push(skillName);
      result.allMatch = false;
      break;
  }
}

export function verifySkillsMatch(projectPath: string): VerifyResult {
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const result = createEmptyVerifyResult();

  if (!fs.existsSync(skillsDir)) {
    result.allMatch = false;
    return result;
  }

  const canonSkills = deduplicateSkills(listCanonSkills(), getCanonSourcePath());
  const installedDirs = getInstalledSkillDirs(skillsDir);
  const canonSkillNames = new Set(canonSkills.map(s => s.name));

  for (const skill of canonSkills) {
    const comparison = compareSkillContent(skill, skillsDir);
    if (comparison) {
      applyComparison(result, skill.name, comparison.type);
    }
  }

  result.extraInProject = installedDirs.filter(name => !canonSkillNames.has(name));
  return result;
}
