import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import type { CanonListItem } from './types.js';
import { resolveSkillName, getTributeName } from './naming.js';
import { CANON_SUBDIRS, scanDirForSkills } from './helpers.js';
import { getGitCommit, getGitRemote } from '../utils/git.js';

const DEFAULT_CANON_PATH = path.join(homedir(), 'local-tech-projects', 'lens', 'canon');

export function getCanonSourcePath(): string {
  return process.env.CANON_SKILLS_PATH || DEFAULT_CANON_PATH;
}

export function listCanonSkills(): CanonListItem[] {
  const canonPath = getCanonSourcePath();
  const skillsByName = new Map<string, CanonListItem>();

  if (!fs.existsSync(canonPath)) return [];

  // Search canon subdirectories (preferred source)
  for (const subdir of CANON_SUBDIRS) {
    const searchPath = subdir ? path.join(canonPath, subdir) : canonPath;
    scanDirForSkills(searchPath, subdir, skillsByName);
  }

  return Array.from(skillsByName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function findSkillSourcePath(skillName: string): string | null {
  // Resolve tribute names to generic names
  const resolvedName = resolveSkillName(skillName);
  // Also get the tribute directory name for generic→tribute lookups
  const tributeName = getTributeName(resolvedName);
  const canonPath = getCanonSourcePath();

  // Try both the resolved (generic) name and tribute directory name
  const namesToTry = tributeName ? [resolvedName, tributeName] : [resolvedName];

  for (const name of namesToTry) {
    for (const subdir of CANON_SUBDIRS) {
      const searchPath = subdir ? path.join(canonPath, subdir, name) : path.join(canonPath, name);

      if (fs.existsSync(searchPath) && fs.existsSync(path.join(searchPath, 'SKILL.md'))) {
        return searchPath;
      }
    }
  }

  return null;
}

export function getCanonSourceInfo(): { path: string; commit?: string; remote?: string } {
  const canonPath = getCanonSourcePath();
  return {
    path: canonPath,
    commit: getGitCommit(canonPath),
    remote: getGitRemote(canonPath)
  };
}
