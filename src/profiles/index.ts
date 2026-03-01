/**
 * Profile management - create and apply configuration profiles
 *
 * Supports composable profiles that can be combined with + syntax:
 *   lens profile apply base-tech+javascript+react /path/to/project
 *
 * Module structure:
 * - validation.ts - Schema validation and type guards
 * - paths.ts - Path constants and configuration
 * - loader.ts - Profile loading and extends resolution
 * - combiner.ts - Profile combination (+ syntax)
 * - persistence.ts - Profile saving
 * - apply.ts - Apply profiles to projects
 */

// Re-export validation
export { SKILL_CATEGORIES, validateProfileSchema } from './validation.js';
export type { ValidationResult } from './validation.js';

// Re-export paths
export {
  CLAUDE_DIR_NAME,
  DEBUG,
  USER_PROFILES_DIR,
  BUILTIN_PROFILES_DIR,
  MCP_SERVERS_DIR,
  CANON_SUBDIRS,
  SKILL_LIBRARY_PATHS,
  getSkillLibraryPaths
} from './paths.js';

// Re-export loader
export {
  listProfiles,
  listProfilesAsync,
  getProfile,
  getProfileAsync,
  mergeArrays
} from './loader.js';

// Re-export combiner
export { parseProfileString, combineProfiles } from './combiner.js';

// Re-export persistence
export { saveProfile, saveProfileAsync } from './persistence.js';

// Example profile for documentation/tests
import type { ComposableProfile } from '../types.js';

export const exampleComposableProfile: ComposableProfile = {
  name: 'example',
  description: 'Example composable profile',
  composable: true,
  skills: {
    security: ['owasp'],
    canon: ['react-state', 'react-test']
  },
  agents: ['css-expert', 'code-reviewer'],
  commands: ['viz/*'],
  claudeMd: {
    autoInvoke: [
      { context: 'React components, hooks', action: 'INVOKE `/react-state`' },
      { context: 'Writing or reviewing tests', action: 'INVOKE `/react-test`' }
    ]
  }
};
