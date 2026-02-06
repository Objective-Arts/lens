/**
 * Canon skill copy-with-manifest system
 *
 * Skills are copied (not symlinked) into .claude/skills/ as real files.
 * A manifest tracks source, version, and upgrade path.
 * Projects are fully portable - work standalone.
 * Upgrades are explicit - run `lens canon upgrade`.
 *
 * Module structure:
 * - types.ts - Type definitions
 * - hash.ts - Content hashing
 * - manifest.ts - Manifest read/write
 * - naming.ts - Name resolution (tribute -> generic)
 * - helpers.ts - Low-level helpers
 * - source.ts - Source path resolution
 * - operations.ts - Copy, upgrade, diff, status
 * - deployment.ts - Deploy and verify
 */

// Re-export types
export * from './types.js';

// Re-export hash
export * from './hash.js';

// Re-export manifest
export * from './manifest.js';

// Re-export naming
export * from './naming.js';

// Re-export helpers (selective - only public API)
export { CANON_SUBDIRS } from './helpers.js';

// Re-export source
export {
  getCanonSourcePath,
  listCanonSkills,
  findSkillSourcePath,
  getCanonSourceInfo
} from './source.js';

// Re-export operations
export {
  checkSkillStatus,
  copySkill,
  upgradeSkills,
  diffSkill
} from './operations.js';

// Re-export deployment
export {
  deployAllSkills,
  verifySkillsMatch
} from './deployment.js';
