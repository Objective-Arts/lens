/**
 * Canon source path resolution.
 *
 * Find skills in canon source directories.
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import type { CanonListItem } from './types.js';
import { resolveSkillName } from './naming.js';
import { CANON_SUBDIRS, scanDirForSkills } from './helpers.js';
import { getGitCommit, getGitRemote } from './manifest.js';

/** Default canon source paths */
const DEFAULT_CANON_PATH = path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'canon');
const SECURITY_SKILL_PATH = path.join(homedir(), '.claude', 'skill-library', 'security');
const TECH_SKILL_PATH = path.join(homedir(), '.claude', 'skill-library', 'tech');

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

  // Fallback: security skills from skill-library
  scanDirForSkills(SECURITY_SKILL_PATH, 'security', skillsByName);

  return Array.from(skillsByName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find the source path for a skill by name.
 */
export function findSkillSourcePath(skillName: string): string | null {
  // Resolve tribute names to generic names when flag is set
  const resolvedName = resolveSkillName(skillName);
  const canonPath = getCanonSourcePath();

  for (const subdir of CANON_SUBDIRS) {
    const searchPath = subdir ? path.join(canonPath, subdir, resolvedName) : path.join(canonPath, resolvedName);

    if (fs.existsSync(searchPath) && fs.existsSync(path.join(searchPath, 'SKILL.md'))) {
      return searchPath;
    }
  }

  // Check security skills
  const securityPath = path.join(SECURITY_SKILL_PATH, resolvedName);
  if (fs.existsSync(securityPath) && fs.existsSync(path.join(securityPath, 'SKILL.md'))) {
    return securityPath;
  }

  // Check tech skills
  const techPath = path.join(TECH_SKILL_PATH, resolvedName);
  if (fs.existsSync(techPath) && fs.existsSync(path.join(techPath, 'SKILL.md'))) {
    return techPath;
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
