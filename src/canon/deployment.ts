import * as fs from 'fs';
import * as path from 'path';
import { deduplicateSkills, getInstalledSkillDirs } from './helpers.js';
import { copyDirectorySync } from '../utils/fs.js';
import { listCanonSkills, getCanonSourcePath } from './source.js';

export function deployAllSkills(
  projectPath: string,
  options: { force?: boolean } = {}
): { deployed: number; skipped: number; errors: string[]; deployedNames: string[] } {
  const result = { deployed: 0, skipped: 0, errors: [] as string[], deployedNames: [] as string[] };
  const skills = deduplicateSkills(listCanonSkills(), getCanonSourcePath());
  const skillsDir = path.join(projectPath, '.claude', 'canon');
  const force = options.force ?? false;

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
    if (fs.existsSync(targetDir) && !force) {
      result.skipped++;
      continue;
    }

    try {
      if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true });
      copyDirectorySync(skill.path, targetDir);
      result.deployed++;
      result.deployedNames.push(skill.name);
    } catch (err) {
      result.errors.push(`${skill.name}: ${err instanceof Error ? err.message : 'copy failed'}`);
    }
  }

  return result;
}

export function verifySkillsMatch(projectPath: string): {
  matches: string[];
  differs: { name: string; reason: string }[];
  missingInProject: string[];
  extraInProject: string[];
  allMatch: boolean;
} {
  const skillsDir = path.join(projectPath, '.claude', 'canon');
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

  // Compare each canon skill against source
  for (const skill of canonSkills) {
    const sourceFile = path.join(skill.path, 'SKILL.md');
    const targetFile = path.join(skillsDir, skill.name, 'SKILL.md');

    let sourceContent: string;
    let targetContent: string;
    try { sourceContent = fs.readFileSync(sourceFile, 'utf-8'); }
    catch {
      result.matches.push(skill.name); // Skip if no source
      continue;
    }
    try { targetContent = fs.readFileSync(targetFile, 'utf-8'); }
    catch {
      result.missingInProject.push(skill.name);
      result.allMatch = false;
      continue;
    }

    if (sourceContent === targetContent) {
      result.matches.push(skill.name);
    } else {
      result.differs.push({ name: skill.name, reason: 'content differs' });
      result.allMatch = false;
    }
  }

  // Find extra skills not in canon
  result.extraInProject = installedDirs.filter(name => !canonSkillNames.has(name));

  return result;
}
