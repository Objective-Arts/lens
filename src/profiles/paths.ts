/**
 * Profile and skill path configuration.
 *
 * Centralized path constants for profiles and skill libraries.
 */

import * as path from 'path';
import { homedir } from 'os';
import type { SkillLibraryPaths } from '../types.js';

/** Claude directory name */
export const CLAUDE_DIR_NAME = '.claude';

/** Current manifest version */
export const MANIFEST_VERSION = 1;

/** Debug mode flag */
export const DEBUG = process.env.NODE_ENV === 'development' || process.env.CC_DEBUG === 'true';

/** User profiles directory */
export const USER_PROFILES_DIR = process.env.CC_USER_PROFILES_DIR ??
  path.join(homedir(), '.claude', 'profiles');

/** Built-in profiles directory */
export const BUILTIN_PROFILES_DIR = process.env.CC_BUILTIN_PROFILES_DIR ??
  path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'profiles');

/** MCP servers source directory */
export const MCP_SERVERS_DIR = process.env.CC_MCP_SERVERS_DIR ??
  path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'mcp-servers');

/** Phase config source directory */
export const PHASE_CONFIG_SOURCE_DIR = process.env.CC_PHASE_CONFIG_DIR ??
  path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'config');

/** Canon subdirectories to search for skills */
export const CANON_SUBDIRS = [
  'javascript', 'typescript', 'go', 'java', 'python', 'angular',
  'testing', 'visualization', 'business', 'ui-ux', 'csharp',
  'react', 'security', 'engineering', 'database'
] as const;

/** Skill library paths */
export const SKILL_LIBRARY_PATHS: SkillLibraryPaths = {
  security: process.env.CC_SKILLS_SECURITY ?? path.join(homedir(), '.claude', 'skill-library', 'security'),
  tech: process.env.CC_SKILLS_TECH ?? path.join(homedir(), '.claude', 'skill-library', 'tech'),
  canon: process.env.CC_SKILLS_CANON ?? path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'canon'),
  global: process.env.CC_SKILLS_GLOBAL ?? path.join(homedir(), '.claude', 'skills')
};

/** Get skill library paths (copy to prevent mutation) */
export function getSkillLibraryPaths(): SkillLibraryPaths {
  return { ...SKILL_LIBRARY_PATHS };
}
