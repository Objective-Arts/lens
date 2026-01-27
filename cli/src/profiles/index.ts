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
import type { Profile, ComposableProfile, SkillLibraryPaths, SkillCategory, MCPServerCategory } from '../types.js';
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
  'react', 'security', 'engineering'
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

/**
 * Validate a parsed YAML object against the ComposableProfile schema
 * Uses type guards instead of unsafe casts (Cherny)
 */
function validateProfileSchema(data: unknown, filename: string): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(data)) {
    return { valid: false, errors: [`${filename}: Profile must be an object`] };
  }

  // Required: name must be a non-empty string
  if (typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push(`${filename}: 'name' is required and must be a non-empty string`);
  }

  // Optional: description must be a string if present
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push(`${filename}: 'description' must be a string`);
  }

  // Optional: projectType must be 'software' or 'business' if present
  if (data.projectType !== undefined &&
      data.projectType !== 'software' &&
      data.projectType !== 'business') {
    errors.push(`${filename}: 'projectType' must be 'software' or 'business'`);
  }

  // Optional: skills must be an object with valid categories
  if (data.skills !== undefined) {
    if (!isRecord(data.skills)) {
      errors.push(`${filename}: 'skills' must be an object`);
    } else {
      for (const category of SKILL_CATEGORIES) {
        const categoryValue = data.skills[category];
        if (categoryValue !== undefined && !isStringArray(categoryValue)) {
          errors.push(`${filename}: 'skills.${category}' must be an array of strings`);
        }
      }
    }
  }

  // Optional: agents must be an array of strings
  if (data.agents !== undefined && !isStringArray(data.agents)) {
    errors.push(`${filename}: 'agents' must be an array of strings`);
  }

  // Optional: commands must be an array of strings
  if (data.commands !== undefined && !isStringArray(data.commands)) {
    errors.push(`${filename}: 'commands' must be an array of strings`);
  }

  // Optional: claudeMd validation
  if (data.claudeMd !== undefined) {
    if (!isRecord(data.claudeMd)) {
      errors.push(`${filename}: 'claudeMd' must be an object`);
    } else {
      const claudeMd = data.claudeMd;

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
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Profile Loading (Async)
// ============================================================================

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
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

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
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

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
    ralph: { ...parent.ralph, ...child.ralph }
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
export function combineProfiles(profileNames: string[]): ComposableProfile | null {
  const profiles = profileNames
    .map(name => getProfile(name))
    .filter((p): p is ComposableProfile => p !== null);

  if (profiles.length === 0) {
    return null;
  }

  if (profiles.length === 1) {
    return profiles[0];
  }

  // Initialize combined with explicit structure (no non-null assertions needed)
  const combined: ComposableProfile = {
    name: profileNames.join(' + '),
    description: `Combined profile: ${profileNames.join(' + ')}`,
    composable: true,
    skills: {
      security: [],
      tech: [],
      canon: [],
      global: []
    },
    agents: [],
    commands: [],
    claudeMd: {
      standards: [],
      antiPatterns: [],
      autoInvoke: []
    }
  };

  for (const profile of profiles) {
    const { skills, agents, commands, claudeMd, mcpServers, ralph } = profile;

    // Merge skills by category (safe access - combined.skills is initialized above)
    if (skills && combined.skills) {
      for (const category of SKILL_CATEGORIES) {
        const categorySkills = skills[category as SkillCategory] ?? [];
        const currentSkills = combined.skills[category as SkillCategory] ?? [];
        combined.skills[category as SkillCategory] = mergeArrays(currentSkills, categorySkills);
      }
    }

    // Merge agents (safe access - combined.agents is initialized above)
    if (agents && combined.agents) {
      combined.agents = mergeArrays(combined.agents, agents);
    }

    // Merge commands (safe access - combined.commands is initialized above)
    if (commands && combined.commands) {
      combined.commands = mergeArrays(combined.commands, commands);
    }

    // Merge claudeMd sections (safe access - combined.claudeMd is initialized above)
    if (claudeMd && combined.claudeMd) {
      const { standards, antiPatterns, autoInvoke } = claudeMd;

      if (standards && combined.claudeMd.standards) {
        combined.claudeMd.standards = mergeArrays(combined.claudeMd.standards, standards);
      }

      if (antiPatterns && combined.claudeMd.antiPatterns) {
        combined.claudeMd.antiPatterns = mergeArrays(combined.claudeMd.antiPatterns, antiPatterns);
      }

      if (autoInvoke && combined.claudeMd.autoInvoke) {
        combined.claudeMd.autoInvoke = [...combined.claudeMd.autoInvoke, ...autoInvoke];
      }
    }

    // Merge MCP servers
    if (mcpServers) {
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

    // Merge ralph config (last one wins for nested objects)
    if (ralph) {
      combined.ralph = { ...combined.ralph, ...ralph };
    }
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

  const workflowSkills = [
    { name: 'ralph-loop', cmd: '/ralph-loop [prd-file] [--max N] [--resume] [--external]', desc: 'Autonomous PRD implementation loop' },
    { name: 'implement', cmd: '/implement [task]', desc: 'Implement a feature with quality gates' },
    { name: 'review-hard', cmd: '/review-hard [--scope file|function]', desc: 'Rigorous code review with canon lens' },
    { name: 'test', cmd: '/test [--coverage] [--watch]', desc: 'Run tests with Testing Trophy strategy' },
    { name: 'plan', cmd: '/plan [task]', desc: 'Create implementation plan before coding' },
    { name: 'structure-first', cmd: '/structure-first [feature]', desc: 'Design data structures before implementation' },
    { name: 'refactor-clean', cmd: '/refactor-clean [target]', desc: 'Systematic code cleanup' },
    { name: 'build-from-plan', cmd: '/build-from-plan [plan-file]', desc: 'Execute approved plan' }
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
  canonPath: string
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

  // Create .mcp.json if using external validation
  const needsExternalValidation = profile.ralph?.post_loop_validation?.enabled ||
    profile.name?.includes('ralph-integration');

  if (needsExternalValidation) {
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

  // Apply agents (note them)
  if (profile.agents?.length) {
    result.created.push(`Agents enabled: ${profile.agents.join(', ')}`);
  }

  // Update CLAUDE.md
  if (profile.claudeMd?.autoInvoke) {
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    await updateClaudeMdWithProfileAsync(claudeMdPath, profile, projectPath);
    result.created.push('Updated CLAUDE.md with profile info and auto-invoke rules');
  }

  // Apply MCP configuration (decomposed)
  await applyMcpToProject(profile, projectPath, result);

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
    security: ['security-mindset', 'owasp'],
    tech: ['ceremony'],
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

export const exampleProfile: Profile = {
  name: 'D3 Development',
  description: 'Full D3/visualization development environment',
  skills: {
    include: ['bostock', 'abramov', 'dodds', 'osmani', 'cherny'],
    exclude: []
  },
  commands: {
    include: ['viz/*', 'd3/*'],
    exclude: []
  },
  agents: {
    include: ['css-expert', 'accessibility-tester'],
    exclude: []
  },
  claudeMd: {
    autoInvoke: [
      { context: 'D3.js or data visualization', action: 'INVOKE `/bostock`' },
      { context: 'React/JSX/TSX files', action: 'INVOKE `/abramov`' },
      { context: 'Writing or reviewing tests', action: 'INVOKE `/dodds`' }
    ]
  },
  mcpServers: {
    enable: ['linear'],
    disable: []
  }
};
