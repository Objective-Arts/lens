/**
 * Runtime asset path resolution for Lens.
 *
 * Resolves all asset paths relative to the package installation location,
 * NOT the current working directory. Every module that reads canons, profiles,
 * skills, pipeline scripts, rubrics, phases, or config must use this module.
 *
 * Dual resolution for backwards compatibility:
 *   1. Primary: the package installation directory (for global installs)
 *   2. Fallback: the current working directory / repo root (for dev mode)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Package root detection
// ---------------------------------------------------------------------------

/** dirname of this file — works from both src/ and dist/ */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Package root: from dist/paths.js  -> up one level -> package root
 *               from src/paths.ts   -> up one level -> package root (via tsx)
 */
const PACKAGE_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Mode detection (logged once)
// ---------------------------------------------------------------------------

type ResolveMode = 'installed' | 'dev';

let _resolvedMode: ResolveMode | null = null;

function detectMode(): ResolveMode {
  if (_resolvedMode) return _resolvedMode;

  // If package.json is at our computed root AND node_modules exists as a
  // sibling (typical for npm global prefix), we are likely installed.
  // Otherwise we are running from the repo (dev mode).
  const hasPackageJson = fs.existsSync(path.join(PACKAGE_ROOT, 'package.json'));
  const hasCanon = fs.existsSync(path.join(PACKAGE_ROOT, 'canon'));
  const hasSrc = fs.existsSync(path.join(PACKAGE_ROOT, 'src'));

  // Dev mode: has package.json AND src/ directory (repo checkout)
  // Installed mode: has package.json AND canon/ but no src/ (published package)
  if (hasPackageJson && hasSrc) {
    _resolvedMode = 'dev';
  } else if (hasPackageJson && hasCanon) {
    _resolvedMode = 'installed';
  } else {
    // Fallback: check if we can find canon at the package root
    _resolvedMode = hasCanon ? 'installed' : 'dev';
  }

  // Log once for debugging
  if (process.env.CC_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
    console.debug(`[lens] Asset resolution mode: ${_resolvedMode} (root: ${PACKAGE_ROOT})`);
  }

  return _resolvedMode;
}

// ---------------------------------------------------------------------------
// Resolve helper
// ---------------------------------------------------------------------------

/**
 * Try the package root first (installed mode).
 * If the directory doesn't exist there, fall back to cwd-relative (dev mode).
 * If neither exists, return the package-root version (callers handle missing).
 */
function resolveAssetPath(relativePath: string): string {
  const packagePath = path.join(PACKAGE_ROOT, relativePath);

  if (fs.existsSync(packagePath)) {
    return packagePath;
  }

  // Dev fallback: resolve relative to cwd (for running from repo root)
  const cwdPath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  // Neither exists — return package root version as default
  return packagePath;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LensPaths {
  /** Package root directory */
  readonly root: string;
  /** Canon skills: canon/ */
  readonly canons: string;
  /** Profile YAML files: profiles/ */
  readonly profiles: string;
  /** Claude skills directory: .claude/skills/ */
  readonly skills: string;
  /** Workflow skills source: workflow-skills/ */
  readonly workflowSkills: string;
  /** Pipeline orchestrator: scripts/pipeline.sh */
  readonly pipeline: string;
  /** Rubric files: .claude/rubric/ or workflow-skills/rubric/ */
  readonly rubrics: string;
  /** Phase definitions: .claude/phases/ */
  readonly phases: string;
  /** Config directory: config/ */
  readonly config: string;
  /** MCP servers: mcp-servers/ */
  readonly mcp: string;
  /** Plans directory: .claude/plans/ */
  readonly plans: string;
  /** Claude config: .claude/config/ */
  readonly claudeConfig: string;
  /** Resolution mode: 'installed' or 'dev' */
  readonly mode: ResolveMode;
}

/** Resolve rubrics path: prefer .claude/rubric, fall back to workflow-skills/rubric */
function resolveRubricsPath(): string {
  const claudeRubric = resolveAssetPath('.claude/rubric');
  if (fs.existsSync(claudeRubric)) return claudeRubric;
  return resolveAssetPath('workflow-skills/rubric');
}

/**
 * Lazily resolved paths object.
 * Each property is resolved on first access and cached.
 */
function createPaths(): LensPaths {
  const cache: Partial<Record<keyof LensPaths, string>> = {};

  function cached(key: keyof LensPaths, resolver: () => string): string {
    const existing = cache[key];
    if (existing !== undefined) return existing;
    const resolved = resolver();
    cache[key] = resolved;
    return resolved;
  }

  return {
    get root() { return PACKAGE_ROOT; },
    get canons() { return cached('canons', () => resolveAssetPath('canon')); },
    get profiles() { return cached('profiles', () => resolveAssetPath('profiles')); },
    get skills() { return cached('skills', () => resolveAssetPath('.claude/skills')); },
    get workflowSkills() { return cached('workflowSkills', () => resolveAssetPath('workflow-skills')); },
    get pipeline() { return cached('pipeline', () => resolveAssetPath('scripts/pipeline.sh')); },
    get rubrics() { return cached('rubrics', resolveRubricsPath); },
    get phases() { return cached('phases', () => resolveAssetPath('.claude/phases')); },
    get config() { return cached('config', () => resolveAssetPath('config')); },
    get mcp() { return cached('mcp', () => resolveAssetPath('mcp-servers')); },
    get plans() { return cached('plans', () => resolveAssetPath('.claude/plans')); },
    get claudeConfig() { return cached('claudeConfig', () => resolveAssetPath('.claude/config')); },
    get mode() { return detectMode(); }
  };
}

/** Singleton PATHS instance — the primary export */
export const PATHS: LensPaths = createPaths();

/**
 * Reset the cached resolution mode.
 * ONLY for use in tests — allows testing different detection scenarios.
 */
export function resetModeCache(): void {
  _resolvedMode = null;
}
