/**
 * Canon source path resolution.
 *
 * Find skills in canon source directories.
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import type { CanonListItem } from './types.js';
import { resolveSkillName, getTributeName } from './naming.js';
import { CANON_SUBDIRS, scanDirForSkills } from './helpers.js';
import { getGitCommit, getGitRemote } from './manifest.js';

/** Default canon source path */
const DEFAULT_CANON_PATH = path.join(homedir(), 'local-tech-projects', 'lens', 'canon');

/**
 * Get the configured canon source path.
 */
export function getCanonSourcePath(): string {
  return process.env.CANON_SKILLS_PATH || DEFAULT_CANON_PATH;
}

/**
 * List all available canon skills from the source directory.
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

  return Array.from(skillsByName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find the source path for a skill by name.
 */
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

/**
 * Get canon source info for display.
 */
export function getCanonSourceInfo(): { path: string; commit?: string; remote?: string } {
  const canonPath = getCanonSourcePath();
  return {
    path: canonPath,
    commit: getGitCommit(canonPath),
    remote: getGitRemote(canonPath)
  };
}
