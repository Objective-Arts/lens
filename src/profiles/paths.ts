/**
 * Profile and skill path configuration.
 *
 * Centralized path constants for profiles and skill libraries.
 * Uses the PATHS module for package-relative asset resolution.
 */

import * as path from 'path';
import { homedir } from 'os';
import type { SkillLibraryPaths } from '../types.js';
import { PATHS } from '../paths.js';

/** Claude directory name */
export const CLAUDE_DIR_NAME = '.claude';

/** Debug mode flag */
export const DEBUG = process.env.NODE_ENV === 'development' || process.env.CC_DEBUG === 'true';

/** User profiles directory */
export const USER_PROFILES_DIR = process.env.CC_USER_PROFILES_DIR ??
  path.join(homedir(), '.claude', 'profiles');

/** Built-in profiles directory — resolved from installed package */
export const BUILTIN_PROFILES_DIR = process.env.CC_BUILTIN_PROFILES_DIR ??
  PATHS.profiles;

/** MCP servers source directory — resolved from installed package */
export const MCP_SERVERS_DIR = process.env.CC_MCP_SERVERS_DIR ??
  PATHS.mcp;

/** Canon subdirectories to search for skills */
export const CANON_SUBDIRS = [
  'javascript', 'typescript', 'go', 'java', 'python', 'angular',
  'testing', 'visualization', 'business', 'ui-ux', 'csharp',
  'react', 'security', 'engineering', 'writing', 'database'
] as const;

/** Skill library paths — canon resolves from installed package */
export const SKILL_LIBRARY_PATHS: SkillLibraryPaths = {
  security: process.env.CC_SKILLS_SECURITY ?? path.join(homedir(), '.claude', 'skill-library', 'security'),
  tech: process.env.CC_SKILLS_TECH ?? path.join(homedir(), '.claude', 'skill-library', 'tech'),
  canon: process.env.CC_SKILLS_CANON ?? PATHS.canons,
  global: process.env.CC_SKILLS_GLOBAL ?? path.join(homedir(), '.claude', 'skills')
};

export function getSkillLibraryPaths(): SkillLibraryPaths {
  return { ...SKILL_LIBRARY_PATHS };
}
