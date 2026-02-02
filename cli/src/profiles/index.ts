/**
 * Profile management - create and apply configuration profiles
 *
 * Supports composable profiles that can be combined with + syntax:
 *   cc-config profile apply base-tech+javascript+react /path/to/project
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { homedir } from 'os';
import type { Profile, ComposableProfile, SkillLibraryPaths, SkillCategory, MCPServerCategory, ProfileHooksConfig } from '../types.js';
import {
  getServer,
  isServerInstalled,
  installAndEnableServer,
  enableServer,
  disableServer,
  listServers,
  checkRequiredEnv
} from '../mcp/index.js';
import {
  findSkillSourcePath,
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  getGitCommit,
  getGitRemote,
  hashSkillDirectory,
  getCanonSourcePath
} from '../canon/index.js';
import {
  installAllWorkflowSkills
} from '../workflow/index.js';

// ============================================================================
// Constants (with as const for literal types - Cherny)
// ============================================================================

/** Skill categories for iteration */
const SKILL_CATEGORIES = ['security', 'tech', 'canon', 'global'] as const;

/** Canon subdirectories to search for skills */
const CANON_SUBDIRS = [
  'javascript', 'typescript', 'go', 'java', 'python', 'angular',
  'testing', 'visualization', 'business', 'ui-ux', 'csharp',
  'react', 'security', 'engineering', 'database'
] as const;

/** Debug mode for development logging (Crockford: fail fast, visible errors) */
const DEBUG = process.env.NODE_ENV === 'development' || process.env.CC_DEBUG === 'true';

/** Claude directory name - extracted as constant to avoid magic strings */
const CLAUDE_DIR_NAME = '.claude';

/** Current manifest version for future migrations */
const MANIFEST_VERSION = 1;

// ============================================================================
// Configurable Paths (can be overridden via environment variables)
// ============================================================================

/** User profiles directory */
const USER_PROFILES_DIR = process.env.CC_USER_PROFILES_DIR ??
  path.join(homedir(), '.claude', 'profiles');

/** Built-in profiles directory (shipped with claude-optimal) */
const BUILTIN_PROFILES_DIR = process.env.CC_BUILTIN_PROFILES_DIR ??
  path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'profiles');

/** MCP servers source directory */
const MCP_SERVERS_DIR = process.env.CC_MCP_SERVERS_DIR ??
  path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'mcp-servers');

/** Skill library paths - using satisfies for validation while preserving inference (Cherny) */
const SKILL_LIBRARY_PATHS = {
  security: process.env.CC_SKILLS_SECURITY ?? path.join(homedir(), '.claude', 'skill-library', 'security'),
  tech: process.env.CC_SKILLS_TECH ?? path.join(homedir(), '.claude', 'skill-library', 'tech'),
  canon: process.env.CC_SKILLS_CANON ?? path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'canon'),
  global: process.env.CC_SKILLS_GLOBAL ?? path.join(homedir(), '.claude', 'skills')
} satisfies SkillLibraryPaths;

// ============================================================================
// Type Guards (Cherny: prefer type guards over unsafe casts)
// ============================================================================

/** Type guard for Record<string, unknown> */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Type guard for string arrays */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/** Type guard for auto-invoke items */
function isAutoInvokeItem(value: unknown): value is { context: string; action: string } {
  return isRecord(value) &&
    typeof value.context === 'string' &&
    typeof value.action === 'string';
}

// ============================================================================
// Discriminated Union Result Types (Cherny: exhaustive pattern matching)
// ============================================================================

/** Result type for MCP JSON creation */
type McpJsonResult =
  | { status: 'created'; warning?: string }
  | { status: 'skipped' }
  | { status: 'error'; error: string };

/** Result type for validation */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Profile Schema Validation
// ============================================================================

/** Validate skills object (Kernighan: single responsibility) */
function validateSkills(skills: unknown, filename: string): string[] {
  if (skills === undefined) return [];
  if (!isRecord(skills)) return [`${filename}: 'skills' must be an object`];

  const errors: string[] = [];
  for (const category of SKILL_CATEGORIES) {
    const val = skills[category];
    if (val !== undefined && !isStringArray(val)) {
      errors.push(`${filename}: 'skills.${category}' must be an array of strings`);
    }
  }
  return errors;
}

/** Validate claudeMd object (Kernighan: single responsibility) */
function validateClaudeMd(claudeMd: unknown, filename: string): string[] {
  if (claudeMd === undefined) return [];
  if (!isRecord(claudeMd)) return [`${filename}: 'claudeMd' must be an object`];

  const errors: string[] = [];
  if (claudeMd.standards !== undefined && !isStringArray(claudeMd.standards)) {
    errors.push(`${filename}: 'claudeMd.standards' must be an array of strings`);
  }
  if (claudeMd.antiPatterns !== undefined && !isStringArray(claudeMd.antiPatterns)) {
    errors.push(`${filename}: 'claudeMd.antiPatterns' must be an array of strings`);
  }
  if (claudeMd.autoInvoke !== undefined) {
    if (!Array.isArray(claudeMd.autoInvoke)) {
      errors.push(`${filename}: 'claudeMd.autoInvoke' must be an array`);
    } else {
      claudeMd.autoInvoke.forEach((item, i) => {
        if (!isAutoInvokeItem(item)) {
          errors.push(`${filename}: 'claudeMd.autoInvoke[${i}]' must have 'context' and 'action' strings`);
        }
      });
    }
  }
  return errors;
}

/** Validate hooks object (Kernighan: single responsibility) */
function validateHooks(hooks: unknown, filename: string): string[] {
  if (hooks === undefined) return [];
  if (!isRecord(hooks)) return [`${filename}: 'hooks' must be an object`];

  const errors: string[] = [];
  const validEventTypes = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Notification'];
  for (const eventType of Object.keys(hooks)) {
    if (!validEventTypes.includes(eventType)) {
      errors.push(`${filename}: 'hooks.${eventType}' is not a valid hook event type`);
    }
    if (!Array.isArray(hooks[eventType])) {
      errors.push(`${filename}: 'hooks.${eventType}' must be an array`);
    }
  }
  return errors;
}

/**
 * Validate a parsed YAML object against the ComposableProfile schema
 * Uses type guards instead of unsafe casts (Cherny)
 */
function validateProfileSchema(data: unknown, filename: string): ValidationResult {
  if (!isRecord(data)) {
    return { valid: false, errors: [`${filename}: Profile must be an object`] };
  }

  const errors: string[] = [];

  // Required fields
  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push(`${filename}: 'name' is required and must be a non-empty string`);
  }

  // Optional string fields
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push(`${filename}: 'description' must be a string`);
  }
  if (data.projectType !== undefined && data.projectType !== 'software' && data.projectType !== 'business') {
    errors.push(`${filename}: 'projectType' must be 'software' or 'business'`);
  }

  // Optional array fields
  if (data.agents !== undefined && !isStringArray(data.agents)) {
    errors.push(`${filename}: 'agents' must be an array of strings`);
  }
  if (data.commands !== undefined && !isStringArray(data.commands)) {
    errors.push(`${filename}: 'commands' must be an array of strings`);
  }

  // Nested object validation (delegated to helpers)
  errors.push(...validateSkills(data.skills, filename));
  errors.push(...validateClaudeMd(data.claudeMd, filename));
  errors.push(...validateHooks(data.hooks, filename));

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Profile Loading (Async)
// ============================================================================

/** Config files that are not profiles - skip validation */
const CONFIG_FILES = new Set(['keyword-detection.yaml', 'workflow-phases.yaml']);

/**
 * Load profiles from a directory (async)
 */
async function loadProfilesFromDirAsync(dir: string): Promise<ComposableProfile[]> {
  try {
    await fsPromises.access(dir);
  } catch (error) {
    // Directory doesn't exist - this is expected for optional directories
    if (DEBUG) {
      console.debug(`Profile directory not accessible: ${dir}`);
    }
    return [];
  }

  const profiles: ComposableProfile[] = [];

  try {
    const files = await fsPromises.readdir(dir);
    const yamlFiles = files
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .filter(f => !CONFIG_FILES.has(f));

    for (const file of yamlFiles) {
      const filePath = path.join(dir, file);
      try {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const parsed = parseYaml(content);

        // Validate schema
        const validation = validateProfileSchema(parsed, file);
        if (!validation.valid) {
          console.error(`Profile validation failed for ${file}:`);
          validation.errors.forEach(e => console.error(`  - ${e}`));
          continue;
        }

        // Safe to cast after validation
        profiles.push(parsed as ComposableProfile);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to parse profile ${file} in ${dir}: ${message}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error reading profiles directory ${dir}: ${message}`);
  }

  return profiles;
}

/**
 * Load profiles from a directory (sync - for backwards compatibility)
 */
function loadProfilesFromDir(dir: string): ComposableProfile[] {
  if (!fs.existsSync(dir)) {
    if (DEBUG) {
      console.debug(`Profile directory not found: ${dir}`);
    }
    return [];
  }

  const profiles: ComposableProfile[] = [];
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .filter(f => !CONFIG_FILES.has(f));

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseYaml(content);

      // Validate schema
      const validation = validateProfileSchema(parsed, file);
      if (!validation.valid) {
        console.error(`Profile validation failed for ${file}:`);
        validation.errors.forEach(e => console.error(`  - ${e}`));
        continue;
      }

      // Safe to cast after validation
      profiles.push(parsed as ComposableProfile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse profile ${file} in ${dir}: ${message}`);
    }
  }

  return profiles;
}

/**
 * List all available profiles from both built-in and user directories.
 *
 * Loads profiles from:
 * - Built-in: `~/local-tech-projects/claude-optimal/profiles/`
 * - User: `~/.claude/profiles/`
 *
 * User profiles override built-in profiles with the same name.
 *
 * @returns Array of all available composable profiles
 *
 * @example
 * ```typescript
 * const profiles = await listProfilesAsync();
 * console.log(`Available profiles: ${profiles.map(p => p.name).join(', ')}`);
 * ```
 */
export async function listProfilesAsync(): Promise<ComposableProfile[]> {
  const [builtinProfiles, userProfiles] = await Promise.all([
    loadProfilesFromDirAsync(BUILTIN_PROFILES_DIR),
    loadProfilesFromDirAsync(USER_PROFILES_DIR)
  ]);

  const profileMap = new Map<string, ComposableProfile>();

  for (const profile of builtinProfiles) {
    profileMap.set(profile.name, profile);
  }

  for (const profile of userProfiles) {
    profileMap.set(profile.name, profile);
  }

  return Array.from(profileMap.values());
}

/**
 * List all available profiles (synchronous version).
 *
 * @returns Array of all available composable profiles
 * @see {@link listProfilesAsync} for async version
 */
export function listProfiles(): ComposableProfile[] {
  const builtinProfiles = loadProfilesFromDir(BUILTIN_PROFILES_DIR);
  const userProfiles = loadProfilesFromDir(USER_PROFILES_DIR);

  const profileMap = new Map<string, ComposableProfile>();

  for (const profile of builtinProfiles) {
    profileMap.set(profile.name, profile);
  }

  for (const profile of userProfiles) {
    profileMap.set(profile.name, profile);
  }

  return Array.from(profileMap.values());
}

/**
 * Get a single profile by name.
 *
 * @param name - Profile name to look up
 * @returns The profile if found, null otherwise
 *
 * @example
 * ```typescript
 * const profile = getProfile('javascript');
 * if (profile) {
 *   console.log(`Skills: ${profile.skills?.canon?.join(', ')}`);
 * }
 * ```
 */
export function getProfile(name: string): ComposableProfile | null {
  const profiles = listProfiles();
  const profile = profiles.find(p => p.name === name) ?? null;

  if (!profile) {
    return null;
  }

  // Resolve extends chain
  return resolveProfileExtends(profile, profiles, new Set());
}

/**
 * Resolve a profile's extends chain, merging parent profiles.
 *
 * @param profile - The profile to resolve
 * @param allProfiles - All available profiles for lookup
 * @param visited - Set of already-visited profile names (cycle detection)
 * @returns Merged profile with all extended profiles applied
 */
function resolveProfileExtends(
  profile: ComposableProfile,
  allProfiles: ComposableProfile[],
  visited: Set<string>
): ComposableProfile {
  // No extends - return as-is
  if (!profile.extends) {
    return profile;
  }

  // Cycle detection
  if (visited.has(profile.name)) {
    console.warn(`Circular extends detected: ${profile.name}`);
    return profile;
  }
  visited.add(profile.name);

  // Find parent profile
  const parent = allProfiles.find(p => p.name === profile.extends);
  if (!parent) {
    console.warn(`Extended profile not found: ${profile.extends} (from ${profile.name})`);
    return profile;
  }

  // Recursively resolve parent's extends
  const resolvedParent = resolveProfileExtends(parent, allProfiles, visited);

  // Merge parent into child (child overrides parent)
  return mergeProfiles(resolvedParent, profile);
}

/**
 * Merge ralph.skills configurations, combining skills per stage
 */
function mergeRalphSkills(
  parent: ComposableProfile['ralph'],
  child: ComposableProfile['ralph']
): ComposableProfile['ralph'] {
  const parentSkills = parent?.skills ?? {};
  const childSkills = child?.skills ?? {};

  // Deep merge skills per stage
  const mergedSkills = {
    plan: mergeArrays(parentSkills.plan ?? [], childSkills.plan ?? []),
    build: mergeArrays(parentSkills.build ?? [], childSkills.build ?? []),
    refactor: mergeArrays(parentSkills.refactor ?? [], childSkills.refactor ?? []),
    test: mergeArrays(parentSkills.test ?? [], childSkills.test ?? []),
    review: mergeArrays(parentSkills.review ?? [], childSkills.review ?? []),
    doc: mergeArrays(parentSkills.doc ?? [], childSkills.doc ?? [])
  };

  // Merge other ralph config (child overrides parent)
  return {
    ...parent,
    ...child,
    skills: mergedSkills
  };
}

/**
 * Merge two profiles, with child overriding/extending parent.
 */
function mergeProfiles(parent: ComposableProfile, child: ComposableProfile): ComposableProfile {
  return {
    name: child.name,
    description: child.description ?? parent.description,
    projectType: child.projectType ?? parent.projectType,
    composable: child.composable ?? parent.composable,
    // Don't carry extends forward - it's been resolved
    skills: {
      security: mergeArrays(parent.skills?.security ?? [], child.skills?.security ?? []),
      tech: mergeArrays(parent.skills?.tech ?? [], child.skills?.tech ?? []),
      canon: mergeArrays(parent.skills?.canon ?? [], child.skills?.canon ?? []),
      global: mergeArrays(parent.skills?.global ?? [], child.skills?.global ?? [])
    },
    agents: mergeArrays(parent.agents ?? [], child.agents ?? []),
    commands: mergeArrays(parent.commands ?? [], child.commands ?? []),
    claudeMd: {
      standards: mergeArrays(parent.claudeMd?.standards ?? [], child.claudeMd?.standards ?? []),
      antiPatterns: mergeArrays(parent.claudeMd?.antiPatterns ?? [], child.claudeMd?.antiPatterns ?? []),
      autoInvoke: mergeArrays(parent.claudeMd?.autoInvoke ?? [], child.claudeMd?.autoInvoke ?? [])
    },
    mcpServers: {
      enable: mergeArrays(parent.mcpServers?.enable ?? [], child.mcpServers?.enable ?? []),
      disable: mergeArrays(parent.mcpServers?.disable ?? [], child.mcpServers?.disable ?? [])
    },
    hooks: mergeHooks(parent.hooks, child.hooks),
    ralph: mergeRalphSkills(parent.ralph, child.ralph)
  };
}

/**
 * Get a single profile by name (async version).
 *
 * @param name - Profile name to look up
 * @returns The profile if found, null otherwise
 */
export async function getProfileAsync(name: string): Promise<ComposableProfile | null> {
  const profiles = await listProfilesAsync();
  const profile = profiles.find(p => p.name === name) ?? null;

  if (!profile) {
    return null;
  }

  // Resolve extends chain
  return resolveProfileExtends(profile, profiles, new Set());
}

// ============================================================================
// Profile Parsing and Combination
// ============================================================================

/**
 * Parse a profile string that may contain `+` for composition.
 *
 * Splits the input on `+` to support combining multiple profiles.
 *
 * @param profileString - Profile string, possibly with `+` separators
 * @returns Array of individual profile names
 *
 * @example
 * ```typescript
 * parseProfileString('base-tech+javascript+react');
 * // Returns: ['base-tech', 'javascript', 'react']
 *
 * parseProfileString('single-profile');
 * // Returns: ['single-profile']
 * ```
 */
export function parseProfileString(profileString: string): string[] {
  return profileString.split('+').map(s => s.trim()).filter(Boolean);
}

/**
 * Merge arrays with deduplication using Set
 */
function mergeArrays<T>(target: T[], source: T[]): T[] {
  return [...new Set([...target, ...source])];
}

/**
 * Merge hooks from two profiles.
 * Combines hook arrays for each event type.
 */
function mergeHooks(
  parent: ProfileHooksConfig | undefined,
  child: ProfileHooksConfig | undefined
): ProfileHooksConfig | undefined {
  if (!parent && !child) return undefined;
  if (!parent) return child;
  if (!child) return parent;

  const eventTypes = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Notification'] as const;
  const merged: ProfileHooksConfig = {};

  for (const eventType of eventTypes) {
    const parentHooks = parent[eventType] ?? [];
    const childHooks = child[eventType] ?? [];
    if (parentHooks.length > 0 || childHooks.length > 0) {
      merged[eventType] = [...parentHooks, ...childHooks];
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Combine multiple profiles into a single merged profile.
 *
 * Merges skills, commands, agents, and claudeMd sections.
 * Arrays are deduplicated; ralph config uses last-wins.
 *
 * @param profileNames - Array of profile names to combine
 * @returns Merged profile, or null if no valid profiles found
 *
 * @example
 * ```typescript
 * const combined = combineProfiles(['base-tech', 'javascript', 'react']);
 * if (combined) {
 *   console.log(`Combined profile: ${combined.name}`);
 *   // Name is: "base-tech + javascript + react"
 * }
 * ```
 */
/** Create empty combined profile structure (Bloch: static factory) */
function createEmptyCombined(profileNames: string[]): ComposableProfile {
  return {
    name: profileNames.join(' + '),
    description: `Combined profile: ${profileNames.join(' + ')}`,
    composable: true,
    skills: { security: [], tech: [], canon: [], global: [] },
    agents: [],
    commands: [],
    claudeMd: { standards: [], antiPatterns: [], autoInvoke: [] }
  };
}

/** Merge skills by category (Kernighan: single responsibility) */
function mergeSkillsInto(combined: ComposableProfile, skills: ComposableProfile['skills']): void {
  if (!skills || !combined.skills) return;
  for (const category of SKILL_CATEGORIES) {
    const src = skills[category as SkillCategory] ?? [];
    const dst = combined.skills[category as SkillCategory] ?? [];
    combined.skills[category as SkillCategory] = mergeArrays(dst, src);
  }
}

/** Merge claudeMd sections (Kernighan: single responsibility) */
function mergeClaudeMdInto(combined: ComposableProfile, claudeMd: ComposableProfile['claudeMd']): void {
  if (!claudeMd || !combined.claudeMd) return;
  if (claudeMd.standards) {
    combined.claudeMd.standards = mergeArrays(combined.claudeMd.standards ?? [], claudeMd.standards);
  }
  if (claudeMd.antiPatterns) {
    combined.claudeMd.antiPatterns = mergeArrays(combined.claudeMd.antiPatterns ?? [], claudeMd.antiPatterns);
  }
  if (claudeMd.autoInvoke) {
    combined.claudeMd.autoInvoke = [...(combined.claudeMd.autoInvoke ?? []), ...claudeMd.autoInvoke];
  }
}

/** Merge MCP servers (Kernighan: single responsibility) */
function mergeMcpServersInto(combined: ComposableProfile, mcpServers: ComposableProfile['mcpServers']): void {
  if (!mcpServers) return;
  if (!combined.mcpServers) {
    combined.mcpServers = { enable: [], disable: [] };
  }
  if (mcpServers.enable) {
    combined.mcpServers.enable = mergeArrays(combined.mcpServers.enable, mcpServers.enable);
  }
  if (mcpServers.disable) {
    combined.mcpServers.disable = mergeArrays(combined.mcpServers.disable, mcpServers.disable);
  }
}

/** Combine multiple profiles into one (Gang-of-Four: Composite pattern) */
export function combineProfiles(profileNames: string[]): ComposableProfile | null {
  const profiles = profileNames
    .map(name => getProfile(name))
    .filter((p): p is ComposableProfile => p !== null);

  if (profiles.length === 0) return null;
  if (profiles.length === 1) return profiles[0];

  const combined = createEmptyCombined(profileNames);

  for (const profile of profiles) {
    mergeSkillsInto(combined, profile.skills);
    if (profile.agents) combined.agents = mergeArrays(combined.agents ?? [], profile.agents);
    if (profile.commands) combined.commands = mergeArrays(combined.commands ?? [], profile.commands);
    mergeClaudeMdInto(combined, profile.claudeMd);
    mergeMcpServersInto(combined, profile.mcpServers);
    if (profile.ralph) combined.ralph = mergeRalphSkills(combined.ralph, profile.ralph);
    if (profile.hooks) combined.hooks = mergeHooks(combined.hooks, profile.hooks);
  }

  return combined;
}

// ============================================================================
// Skill Path Resolution
// ============================================================================

/**
 * Find the source path for a skill based on its category (async)
 */
async function findSkillPathAsync(skillName: string, category: SkillCategory): Promise<string | null> {
  const basePath = SKILL_LIBRARY_PATHS[category];

  if (category === 'canon') {
    // Check subdirectories for canon skills
    for (const subdir of CANON_SUBDIRS) {
      const skillPath = path.join(basePath, subdir, skillName);
      try {
        await fsPromises.access(skillPath);
        return skillPath;
      } catch {
        // Not found in this subdir, continue searching
      }
    }
    // Check root of canon
    const rootPath = path.join(basePath, skillName);
    try {
      await fsPromises.access(rootPath);
      return rootPath;
    } catch {
      if (DEBUG) {
        console.debug(`Skill not found in canon: ${skillName}`);
      }
      return null;
    }
  }

  // For other categories, check directly
  const skillPath = path.join(basePath, skillName);
  try {
    await fsPromises.access(skillPath);
    return skillPath;
  } catch {
    if (DEBUG) {
      console.debug(`Skill not found: ${skillName} in ${category}`);
    }
    return null;
  }
}

// ============================================================================
// Profile Persistence
// ============================================================================

/**
 * Save a profile to the user profiles directory (async)
 */
export async function saveProfileAsync(profile: ComposableProfile): Promise<void> {
  await fsPromises.mkdir(USER_PROFILES_DIR, { recursive: true });

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(USER_PROFILES_DIR, filename);
  const content = stringifyYaml(profile);

  await fsPromises.writeFile(filepath, content, 'utf-8');
}

/**
 * Save a profile (sync - for backwards compatibility)
 */
export function saveProfile(profile: ComposableProfile): void {
  if (!fs.existsSync(USER_PROFILES_DIR)) {
    fs.mkdirSync(USER_PROFILES_DIR, { recursive: true });
  }

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(USER_PROFILES_DIR, filename);
  const content = stringifyYaml(profile);

  fs.writeFileSync(filepath, content, 'utf-8');
}

// ============================================================================
// Directory Operations (Async)
// ============================================================================

/**
 * Recursively copy a directory (async)
 */
async function copyDirectoryRecursiveAsync(src: string, dest: string): Promise<void> {
  await fsPromises.mkdir(dest, { recursive: true });

  const entries = await fsPromises.readdir(src, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursiveAsync(srcPath, destPath);
    } else {
      await fsPromises.copyFile(srcPath, destPath);
    }
  }));
}

// ============================================================================
// MCP Server Configuration
// ============================================================================

/**
 * Create project-level .mcp.json for external validation servers (async)
 * Returns discriminated union for exhaustive handling (Cherny)
 */
async function createProjectMcpJsonAsync(projectPath: string): Promise<McpJsonResult> {
  const targetPath = path.join(projectPath, '.mcp.json');

  // Don't overwrite existing config
  try {
    await fsPromises.access(targetPath);
    return { status: 'skipped' };
  } catch {
    // File doesn't exist, continue
  }

  // Check if MCP servers exist
  const geminiServer = path.join(MCP_SERVERS_DIR, 'gemini-reviewer', 'index.js');
  const qodanaServer = path.join(MCP_SERVERS_DIR, 'qodana', 'dist', 'index.js');

  let geminiExists = false;
  let qodanaExists = false;

  try {
    await fsPromises.access(geminiServer);
    geminiExists = true;
  } catch {
    if (DEBUG) {
      console.debug(`Gemini server not found at: ${geminiServer}`);
    }
  }

  try {
    await fsPromises.access(qodanaServer);
    qodanaExists = true;
  } catch {
    if (DEBUG) {
      console.debug(`Qodana server not found at: ${qodanaServer}`);
    }
  }

  // Build .mcp.json config
  const mcpConfig: {
    mcpServers: Record<string, {
      type: string;
      command: string;
      args: string[];
    }>;
  } = { mcpServers: {} };

  if (geminiExists) {
    mcpConfig.mcpServers['gemini-reviewer'] = {
      type: 'stdio',
      command: 'node',
      args: [geminiServer]
    };
  }

  if (qodanaExists) {
    mcpConfig.mcpServers['qodana'] = {
      type: 'stdio',
      command: 'node',
      args: [qodanaServer]
    };
  }

  // Warn if no servers found but still create file
  let warning: string | undefined;
  if (!geminiExists && !qodanaExists) {
    warning = 'No MCP servers found in claude-optimal/mcp-servers. Created empty .mcp.json';
    console.warn(warning);
  }

  try {
    await fsPromises.writeFile(targetPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    return { status: 'created', warning };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', error: `Failed to write .mcp.json: ${message}` };
  }
}

/**
 * Apply MCP server configuration from a profile
 */
async function applyMcpServers(mcpConfig: {
  enable?: string[];
  disable?: string[];
  categories?: MCPServerCategory[];
  requireAll?: boolean;
}): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const result = { created: [] as string[], skipped: [] as string[], errors: [] as string[] };

  const serversToEnable = new Set<string>(mcpConfig.enable ?? []);

  // Add servers from categories
  if (mcpConfig.categories) {
    for (const category of mcpConfig.categories) {
      const categoryServers = listServers({ category });
      for (const server of categoryServers) {
        serversToEnable.add(server.name);
      }
    }
  }

  // Remove disabled servers
  for (const server of mcpConfig.disable ?? []) {
    serversToEnable.delete(server);
  }

  // Process each server
  for (const serverName of serversToEnable) {
    const serverDef = getServer(serverName);

    if (!serverDef) {
      const message = `MCP server ${serverName} not in registry`;
      if (mcpConfig.requireAll) {
        result.errors.push(message);
      } else {
        result.skipped.push(`${message} (skipping)`);
      }
      continue;
    }

    // Check required env vars
    if (serverDef.requiredEnv?.length) {
      const envCheck = checkRequiredEnv(serverDef);
      if (!envCheck.ok) {
        const message = `MCP server ${serverName} requires: ${envCheck.missing.join(', ')}`;
        if (mcpConfig.requireAll) {
          result.errors.push(message);
        } else {
          result.skipped.push(`${message} - set env vars to enable`);
        }
        continue;
      }
    }

    // Install or enable
    if (isServerInstalled(serverName)) {
      const enableResult = enableServer(serverName);
      if (enableResult.success) {
        result.created.push(`MCP server ${serverName}: enabled`);
      } else {
        result.skipped.push(`MCP server ${serverName}: ${enableResult.message}`);
      }
    } else {
      const installResult = installAndEnableServer(serverName);
      if (installResult.success) {
        result.created.push(`MCP server ${serverName}: installed and enabled`);
      } else {
        result.errors.push(`MCP server ${serverName}: ${installResult.message}`);
      }
    }
  }

  // Handle explicit disables
  for (const serverName of mcpConfig.disable ?? []) {
    const disableResult = disableServer(serverName);
    if (disableResult.success && !disableResult.warnings?.length) {
      result.created.push(`MCP server ${serverName}: disabled`);
    }
  }

  return result;
}

// ============================================================================
// CLAUDE.md Generation
// ============================================================================

/**
 * Get workflow skill commands documentation from installed skills
 */
function getWorkflowCommandsDocs(projectPath: string): string {
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) {
    return '';
  }

  // 8 Ralph phases as standalone skills + orchestrator
  const workflowSkills = [
    { name: 'ralph-loop', cmd: '/ralph-loop [prd-file] [--max N] [--resume]', desc: 'Autonomous PRD implementation loop' },
    { name: 'plan', cmd: '/plan [task]', desc: 'Create implementation plan before coding' },
    { name: 'structure-first', cmd: '/structure-first [feature]', desc: 'Design data structures before implementation' },
    { name: 'implement', cmd: '/implement [target]', desc: 'Implement code from plan' },
    { name: 'refactor-check', cmd: '/refactor-check [target]', desc: 'Systematic code cleanup' },
    { name: 'adversarial-review', cmd: '/adversarial-review [path]', desc: 'Hard-ass code review via Gemini' },
    { name: 'static-analysis', cmd: '/static-analysis [path]', desc: 'Run Qodana and fix issues' },
    { name: 'test', cmd: '/test [level]', desc: 'Write and run tests' },
    { name: 'doc-code', cmd: '/doc-code [path]', desc: 'Generate documentation' }
  ] as const;

  const installed = workflowSkills.filter(s =>
    fs.existsSync(path.join(skillsDir, s.name))
  );

  if (installed.length === 0) {
    return '';
  }

  const rows = installed.map(s => `| \`${s.cmd}\` | ${s.desc} |`).join('\n');

  return `
## Available Commands

| Command | Description |
|---------|-------------|
${rows}

**Flags for /ralph-loop:**
- \`--max N\` — Override max iterations (default: 50)
- \`--resume\` — Continue from last incomplete PRD item
- \`--external\` — Enable Gemini + Qodana post-loop validation
- \`--dry-run\` — Show what would be done without executing
`;
}

/**
 * Update CLAUDE.md with profile info (async)
 */
async function updateClaudeMdWithProfileAsync(
  claudeMdPath: string,
  profile: ComposableProfile,
  projectPath?: string
): Promise<void> {
  let content = '';

  try {
    content = await fsPromises.readFile(claudeMdPath, 'utf-8');
  } catch {
    // File doesn't exist, start fresh
    if (DEBUG) {
      console.debug(`Creating new CLAUDE.md at: ${claudeMdPath}`);
    }
  }

  // Build profile section
  let newSections = `## Profiles Applied\n\n\`${profile.name}\`\n`;

  // Add available commands section
  if (projectPath) {
    const cmdDocs = getWorkflowCommandsDocs(projectPath);
    if (cmdDocs) {
      newSections += cmdDocs;
    }
  }

  // Add standards
  const standards = profile.claudeMd?.standards ?? [];
  if (standards.length > 0) {
    newSections += `\n## Standards\n\n${standards.map(s => `- ${s}`).join('\n')}\n`;
  }

  // Add anti-patterns
  const antiPatterns = profile.claudeMd?.antiPatterns ?? [];
  if (antiPatterns.length > 0) {
    newSections += `\n## Anti-Patterns (Avoid)\n\n${antiPatterns.map(p => `- ${p}`).join('\n')}\n`;
  }

  // Add auto-invoke table
  const autoInvoke = profile.claudeMd?.autoInvoke ?? [];
  if (autoInvoke.length > 0) {
    const autoInvokeTable = autoInvoke.map(ai => `| ${ai.context} | ${ai.action} |`).join('\n');
    newSections += `\n## Auto-Invoke Skills\n\n| Context | Action |\n|---------|--------|\n${autoInvokeTable}\n`;
  }

  // Remove existing sections
  content = content
    .replace(/## Profiles Applied[\s\S]*?(?=\n## [^A]|\n# |$)/g, '')
    .replace(/## Available Commands[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Standards[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Anti-Patterns[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Auto-Invoke[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Insert new sections
  const firstHeadingMatch = content.match(/^#[^#].*\n/m);
  if (firstHeadingMatch) {
    const insertPos = (firstHeadingMatch.index ?? 0) + firstHeadingMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + newSections + '\n' + content.slice(insertPos).trim();
  } else {
    content = newSections + '\n' + content;
  }

  await fsPromises.writeFile(claudeMdPath, content.trim() + '\n', 'utf-8');
}

// ============================================================================
// Profile Application
// ============================================================================

export interface ApplyResult {
  created: string[];
  linked: string[];
  skipped: string[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Decomposed Profile Application Helpers (P1 refactor)
// ============================================================================

/** Result of copying a single skill */
interface SkillCopyResult {
  skillName: string;
  status: 'copied' | 'skipped' | 'error';
  message: string;
  sourcePath?: string;
}

/**
 * Copy a single skill to the project (used for parallel execution)
 */
async function copySkillToProject(
  skillName: string,
  category: SkillCategory,
  skillsDir: string,
  _canonPath: string
): Promise<SkillCopyResult> {
  let sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    sourcePath = await findSkillPathAsync(skillName, category);
  }

  if (!sourcePath) {
    return {
      skillName,
      status: 'error',
      message: `Skill not found: ${skillName} (${category})`
    };
  }

  const targetPath = path.join(skillsDir, skillName);

  // Use fs.existsSync instead of try/catch (P2)
  if (fs.existsSync(targetPath)) {
    return {
      skillName,
      status: 'skipped',
      message: `${skillName} (already exists)`
    };
  }

  try {
    await copyDirectoryRecursiveAsync(sourcePath, targetPath);
    return {
      skillName,
      status: 'copied',
      message: `${skillName} (copied from ${sourcePath})`,
      sourcePath
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      skillName,
      status: 'error',
      message: `Failed to copy skill ${skillName}: ${message}`
    };
  }
}

/**
 * Apply skills from profile to project (decomposed helper)
 * Uses Promise.all for parallel copying (P2)
 */
async function applySkillsToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.skills) return;

  const projectClaudePath = path.join(projectPath, CLAUDE_DIR_NAME);
  const skillsDir = path.join(projectClaudePath, 'skills');
  await fsPromises.mkdir(skillsDir, { recursive: true });

  const canonPath = getCanonSourcePath();
  let manifest = readManifest(projectPath);
  if (!manifest) {
    manifest = createManifest({
      type: 'local',
      path: canonPath,
      gitRemote: getGitRemote(canonPath),
      version: MANIFEST_VERSION
    });
  }

  // Collect all skill copy promises for parallel execution (P2)
  const copyPromises: Promise<SkillCopyResult>[] = [];

  for (const category of SKILL_CATEGORIES) {
    const skills = profile.skills[category as SkillCategory] ?? [];
    for (const skillName of skills) {
      copyPromises.push(
        copySkillToProject(skillName, category as SkillCategory, skillsDir, canonPath)
      );
    }
  }

  // Execute all copies in parallel (P2)
  const copyResults = await Promise.all(copyPromises);

  // Process results and update manifest
  const sourceCommit = getGitCommit(canonPath);

  for (const copyResult of copyResults) {
    switch (copyResult.status) {
      case 'copied':
        result.linked.push(copyResult.message);
        if (copyResult.sourcePath) {
          const targetPath = path.join(skillsDir, copyResult.skillName);
          const hash = hashSkillDirectory(targetPath);
          updateSkillInManifest(manifest, copyResult.skillName, {
            installedCommit: sourceCommit,
            installedAt: new Date().toISOString(),
            sourceFile: path.relative(canonPath, copyResult.sourcePath) || copyResult.skillName,
            hash,
            modified: false
          });
        }
        break;
      case 'skipped':
        result.skipped.push(copyResult.message);
        break;
      case 'error':
        result.errors.push(copyResult.message);
        break;
    }
  }

  writeManifest(projectPath, manifest);
  result.created.push(`${CLAUDE_DIR_NAME}/canon-manifest.json`);
}

/**
 * Apply commands from profile to project (decomposed helper)
 * Uses Promise.all for parallel symlinking (P2)
 */
async function applyCommandsToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.commands || profile.commands.length === 0) return;

  const projectClaudePath = path.join(projectPath, CLAUDE_DIR_NAME);
  const globalClaudePath = path.join(homedir(), CLAUDE_DIR_NAME);
  const commandsDir = path.join(projectClaudePath, 'commands');
  await fsPromises.mkdir(commandsDir, { recursive: true });

  // Parallel command linking (P2)
  const linkPromises = profile.commands.map(async (cmdPattern) => {
    const [cmdName] = cmdPattern.split('/');
    const globalCmdPath = path.join(globalClaudePath, 'commands', cmdName);
    const targetPath = path.join(commandsDir, cmdName);

    // Use fs.existsSync instead of try/catch (P2)
    if (!fs.existsSync(globalCmdPath)) {
      return { type: 'warning' as const, message: `Global command not found: ${cmdName}` };
    }

    if (fs.existsSync(targetPath)) {
      return { type: 'skipped' as const, message: `command:${cmdName} (already exists)` };
    }

    try {
      await fsPromises.symlink(globalCmdPath, targetPath);
      return { type: 'linked' as const, message: `command:${cmdName} → ${globalCmdPath}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { type: 'error' as const, message: `Failed to link command ${cmdName}: ${message}` };
    }
  });

  const linkResults = await Promise.all(linkPromises);

  for (const linkResult of linkResults) {
    switch (linkResult.type) {
      case 'linked':
        result.linked.push(linkResult.message);
        break;
      case 'skipped':
        result.skipped.push(linkResult.message);
        break;
      case 'warning':
        result.warnings.push(linkResult.message);
        break;
      case 'error':
        result.errors.push(linkResult.message);
        break;
    }
  }
}

/**
 * Apply MCP configuration from profile (decomposed helper)
 */
async function applyMcpToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  // Handle MCP servers
  if (profile.mcpServers) {
    const mcpResult = await applyMcpServers(profile.mcpServers);
    result.created.push(...mcpResult.created);
    result.skipped.push(...mcpResult.skipped);
    result.errors.push(...mcpResult.errors);
  }

  // Create .mcp.json if using ralph (needs Gemini + Qodana for review phases)
  const needsMcpServers = profile.ralph !== undefined ||
    profile.name?.includes('ralph-integration');

  if (needsMcpServers) {
    const mcpJsonResult = await createProjectMcpJsonAsync(projectPath);

    // Exhaustive switch on discriminated union (Cherny)
    switch (mcpJsonResult.status) {
      case 'created':
        result.created.push('.mcp.json (external validation servers)');
        if (mcpJsonResult.warning) {
          result.warnings.push(mcpJsonResult.warning);
        }
        break;
      case 'skipped':
        result.skipped.push('.mcp.json (already exists)');
        break;
      case 'error':
        result.errors.push(`.mcp.json: ${mcpJsonResult.error}`);
        break;
    }
  }
}

// ============================================================================
// Hooks Configuration
// ============================================================================

/**
 * Apply hooks configuration from profile to project's settings.json.
 * Merges profile hooks with existing hooks (appends, doesn't overwrite).
 */
async function applyHooksToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.hooks) {
    return;
  }

  const settingsPath = path.join(projectPath, CLAUDE_DIR_NAME, 'settings.json');
  let settings: Record<string, unknown> = {};

  // Load existing settings if present
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      result.warnings.push('Could not parse existing settings.json, creating new');
    }
  }

  // Merge hooks (append to existing, don't overwrite)
  const existingHooks = (settings.hooks as Record<string, unknown[]>) || {};
  const profileHooks = profile.hooks as Record<string, unknown[]>;

  for (const [eventType, hookItems] of Object.entries(profileHooks)) {
    if (!existingHooks[eventType]) {
      existingHooks[eventType] = [];
    }
    existingHooks[eventType].push(...hookItems);
  }

  settings.hooks = existingHooks;

  // Write updated settings
  await fsPromises.mkdir(path.dirname(settingsPath), { recursive: true });
  await fsPromises.writeFile(settingsPath, JSON.stringify(settings, null, 2));

  const hookTypes = Object.keys(profileHooks).join(', ');
  result.created.push(`Hooks installed: ${hookTypes}`);
}

// ============================================================================
// Phase Configuration Files
// ============================================================================

/** Source directory for phase config files */
const PHASE_CONFIG_SOURCE_DIR = process.env.CC_PHASE_CONFIG_DIR ??
  path.join(homedir(), 'local-tech-projects', 'claude-optimal', 'config');

/**
 * Copy phase configuration files to project's config/ directory.
 * These files define the 8-phase workflow and keyword detection rules.
 */
async function copyPhaseConfigFiles(
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  const targetConfigDir = path.join(projectPath, 'config');
  const files = ['workflow-phases.yaml', 'keyword-detection.yaml'];

  // Check if source directory exists
  if (!fs.existsSync(PHASE_CONFIG_SOURCE_DIR)) {
    result.warnings.push(`Phase config source not found: ${PHASE_CONFIG_SOURCE_DIR}`);
    return;
  }

  // Create target config directory
  await fsPromises.mkdir(targetConfigDir, { recursive: true });

  for (const file of files) {
    const sourcePath = path.join(PHASE_CONFIG_SOURCE_DIR, file);
    const targetPath = path.join(targetConfigDir, file);

    if (!fs.existsSync(sourcePath)) {
      result.warnings.push(`Phase config file not found: ${file}`);
      continue;
    }

    // Don't overwrite existing config (user may have customized)
    if (fs.existsSync(targetPath)) {
      result.skipped.push(`config/${file} (already exists)`);
      continue;
    }

    try {
      await fsPromises.copyFile(sourcePath, targetPath);
      result.created.push(`config/${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Failed to copy ${file}: ${message}`);
    }
  }
}

// ============================================================================
// Ralph Configuration Generation
// ============================================================================

/**
 * Generate .claude/ralph-config.yaml with merged skills and iteration config
 */
async function generateRalphConfig(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  // Only generate if ralph config exists
  if (!profile.ralph) return;

  const configPath = path.join(projectPath, CLAUDE_DIR_NAME, 'ralph-config.yaml');

  // Build config object
  const config: Record<string, unknown> = {
    // Header comment
    _generated: `Auto-generated from profile: ${profile.name}`,
    _regenerate: 'cc-config profile apply',
  };

  // Add skills if defined
  if (profile.ralph.skills) {
    const skills = profile.ralph.skills;
    config.skills = {
      plan: skills.plan ?? [],
      build: skills.build ?? [],
      refactor: skills.refactor ?? [],
      test: skills.test ?? [],
      review: skills.review ?? [],
      doc: skills.doc ?? []
    };
  }

  // Add iteration config
  if (profile.ralph.max_iterations) {
    config.max_iterations = profile.ralph.max_iterations;
  }
  if (profile.ralph.max_iterations_per_item) {
    config.max_iterations_per_item = profile.ralph.max_iterations_per_item;
  }
  if (profile.ralph.exit_on_idle_commits) {
    config.exit_on_idle_commits = profile.ralph.exit_on_idle_commits;
  }

  // Add quality gates
  if (profile.ralph.quality_gates) {
    config.quality_gates = profile.ralph.quality_gates;
  }

  // Add post-loop validation
  if (profile.ralph.post_loop_validation) {
    config.post_loop_validation = profile.ralph.post_loop_validation;
  }

  // Add exit criteria
  if (profile.ralph.exit_criteria) {
    config.exit_criteria = profile.ralph.exit_criteria;
  }

  try {
    const yamlContent = stringifyYaml(config);
    await fsPromises.writeFile(configPath, yamlContent, 'utf-8');
    result.created.push('.claude/ralph-config.yaml');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to generate ralph-config.yaml: ${message}`);
  }
}

// ============================================================================
// Main Profile Application
// ============================================================================

/**
 * Apply a composable profile to a project directory.
 *
 * Performs the following operations:
 * 1. Copies skills to `.claude/skills/` (not symlinks, for portability)
 * 2. Creates `canon-manifest.json` for version tracking
 * 3. Installs workflow skills (ralph-loop, implement, etc.)
 * 4. Links commands from global to project
 * 5. Updates `CLAUDE.md` with auto-invoke rules
 * 6. Configures MCP servers if specified
 *
 * @param profile - The composable profile to apply
 * @param projectPath - Target project directory path
 * @returns Result with created, linked, skipped, errors, and warnings arrays
 *
 * @example
 * ```typescript
 * const profile = getProfile('javascript');
 * const result = await applyComposableProfile(profile, './myproject');
 *
 * if (result.errors.length === 0) {
 *   console.log('Profile applied successfully!');
 *   console.log(`Created: ${result.created.join(', ')}`);
 * } else {
 *   console.error(`Errors: ${result.errors.join(', ')}`);
 * }
 * ```
 */
export async function applyComposableProfile(
  profile: ComposableProfile,
  projectPath: string
): Promise<ApplyResult> {
  const result: ApplyResult = {
    created: [],
    linked: [],
    skipped: [],
    errors: [],
    warnings: []
  };

  const projectClaudePath = path.join(projectPath, CLAUDE_DIR_NAME);

  // Ensure project .claude directory exists
  await fsPromises.mkdir(projectClaudePath, { recursive: true });

  // Apply skills (decomposed, parallel)
  await applySkillsToProject(profile, projectPath, result);

  // Install workflow skills
  const workflowResult = installAllWorkflowSkills(projectPath, { force: false });
  if (workflowResult.installed.length > 0) {
    result.created.push(`Workflow skills: ${workflowResult.installed.join(', ')}`);
  }
  const realSkips = workflowResult.skipped.filter(s => !s.includes('already installed'));
  if (realSkips.length > 0) {
    result.skipped.push(...realSkips);
  }
  if (workflowResult.errors.length > 0) {
    result.errors.push(...workflowResult.errors);
  }

  // Apply commands (decomposed, parallel)
  await applyCommandsToProject(profile, projectPath, result);

  // Agents output suppressed - still considering how to integrate agents
  // if (profile.agents?.length) {
  //   result.created.push(`Agents enabled: ${profile.agents.join(', ')}`);
  // }

  // Update CLAUDE.md
  if (profile.claudeMd?.autoInvoke) {
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    await updateClaudeMdWithProfileAsync(claudeMdPath, profile, projectPath);
    result.created.push('Updated CLAUDE.md with profile info and auto-invoke rules');
  }

  // Generate ralph-config.yaml if ralph config exists
  await generateRalphConfig(profile, projectPath, result);

  // Copy phase configuration files (workflow-phases.yaml, keyword-detection.yaml)
  // Only copy if using ralph (indicated by ralph config or ralph-integration profile)
  const needsPhaseConfig = profile.ralph || profile.name?.includes('ralph-integration');
  if (needsPhaseConfig) {
    await copyPhaseConfigFiles(projectPath, result);
  }

  // Apply MCP configuration (decomposed)
  await applyMcpToProject(profile, projectPath, result);

  // Apply hooks to project settings.json
  await applyHooksToProject(profile, projectPath, result);

  return result;
}

/**
 * Legacy applyProfile for backwards compatibility
 */
export async function applyProfile(profile: Profile, projectPath: string): Promise<ApplyResult> {
  const composable: ComposableProfile = {
    name: profile.name,
    description: profile.description,
    skills: {
      global: profile.skills?.include ?? []
    },
    agents: profile.agents?.include,
    commands: profile.commands?.include,
    claudeMd: profile.claudeMd,
    mcpServers: profile.mcpServers
  };

  return applyComposableProfile(composable, projectPath);
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Get skill library paths configuration
 */
export function getSkillLibraryPaths(): SkillLibraryPaths {
  return { ...SKILL_LIBRARY_PATHS };
}

/**
 * Get configured directories (for debugging/diagnostics)
 */
export function getConfiguredPaths(): {
  userProfiles: string;
  builtinProfiles: string;
  mcpServers: string;
  skillLibrary: SkillLibraryPaths;
} {
  return {
    userProfiles: USER_PROFILES_DIR,
    builtinProfiles: BUILTIN_PROFILES_DIR,
    mcpServers: MCP_SERVERS_DIR,
    skillLibrary: { ...SKILL_LIBRARY_PATHS }
  };
}

// ============================================================================
// Example Profiles
// ============================================================================

export const exampleComposableProfile: ComposableProfile = {
  name: 'example',
  description: 'Example composable profile',
  composable: true,
  skills: {
    security: ['owasp'],
    canon: ['abramov', 'dodds']
  },
  agents: ['css-expert', 'code-reviewer'],
  commands: ['viz/*'],
  claudeMd: {
    autoInvoke: [
      { context: 'React components, hooks', action: 'INVOKE `/abramov`' },
      { context: 'Writing or reviewing tests', action: 'INVOKE `/dodds`' }
    ]
  }
};

