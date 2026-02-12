import * as fs from 'fs';
import * as path from 'path';
import { hashSkillDirectory } from './hash.js';
import type { CanonListItem, SkillStatus } from './types.js';

/** Subdirectories to search in canon-skills */
export const CANON_SUBDIRS = [
  '', 'javascript', 'typescript', 'go', 'java', 'python', 'angular', 'testing',
  'visualization', 'business', 'ui-ux', 'csharp', 'react', 'security',
  'engineering', 'writing', 'patterns', 'database'
];

export function isValidSkillDir(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, 'SKILL.md'));
}

export function scanDirForSkills( // first wins

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

export function deduplicateSkills(
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

export function determineSkillStatus(
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

export function generateLineDiff(installedContent: string, sourceContent: string): string[] {
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

export function getInstalledSkills(projectPath: string): string[] {
  const skillsDir = path.join(projectPath, '.claude', 'canon');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort();
}

export function getInstalledSkillDirs(skillsDir: string): string[] {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir).filter(f => {
    const fullPath = path.join(skillsDir, f);
    return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
  });
}
