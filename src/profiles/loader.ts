/**
 * Profile loading and resolution.
 *
 * Load profiles from directories, resolve extends chains.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import type { ComposableProfile, ProfileHooksConfig } from '../types.js';
import { validateProfileSchema } from './validation.js';
import { USER_PROFILES_DIR, BUILTIN_PROFILES_DIR, DEBUG } from './paths.js';

/** Config files that are not profiles */
const CONFIG_FILES = new Set(['keyword-detection.yaml', 'workflow-phases.yaml']);

/** Maximum profile file size to read (1 MB) */
const MAX_PROFILE_SIZE = 1024 * 1024;

function mergeArrays<T>(target: T[], source: T[]): T[] {
  return [...new Set([...target, ...source])];
}

function mergeHookEventType(
  parent: ProfileHooksConfig,
  child: ProfileHooksConfig,
  eventType: keyof ProfileHooksConfig,
  merged: ProfileHooksConfig
): void {
  const parentHooks = parent[eventType] ?? [];
  const childHooks = child[eventType] ?? [];
  if (parentHooks.length > 0 || childHooks.length > 0) {
    merged[eventType] = [...parentHooks, ...childHooks];
  }
}

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
    mergeHookEventType(parent, child, eventType, merged);
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function orEmpty<T>(arr: T[] | undefined): T[] {
  return arr ?? [];
}

function mergeSkills(
  parent: ComposableProfile,
  child: ComposableProfile
): ComposableProfile['skills'] {
  const profileSkills = parent.skills ?? {};
  const combinedSkills = child.skills ?? {};
  return {
    security: mergeArrays(orEmpty(profileSkills.security), orEmpty(combinedSkills.security)),
    tech: mergeArrays(orEmpty(profileSkills.tech), orEmpty(combinedSkills.tech)),
    canon: mergeArrays(orEmpty(profileSkills.canon), orEmpty(combinedSkills.canon)),
    global: mergeArrays(orEmpty(profileSkills.global), orEmpty(combinedSkills.global))
  };
}

function mergeClaudeMd(
  parent: ComposableProfile,
  child: ComposableProfile
): ComposableProfile['claudeMd'] {
  const profileClaudeMd = parent.claudeMd ?? {};
  const combinedClaudeMd = child.claudeMd ?? {};
  return {
    standards: mergeArrays(orEmpty(profileClaudeMd.standards), orEmpty(combinedClaudeMd.standards)),
    antiPatterns: mergeArrays(orEmpty(profileClaudeMd.antiPatterns), orEmpty(combinedClaudeMd.antiPatterns)),
    autoInvoke: mergeArrays(orEmpty(profileClaudeMd.autoInvoke), orEmpty(combinedClaudeMd.autoInvoke))
  };
}

function mergeMcpServers(
  parent: ComposableProfile,
  child: ComposableProfile
): ComposableProfile['mcpServers'] {
  return {
    enable: mergeArrays(parent.mcpServers?.enable ?? [], child.mcpServers?.enable ?? []),
    disable: mergeArrays(parent.mcpServers?.disable ?? [], child.mcpServers?.disable ?? [])
  };
}

function mergeProfiles(parent: ComposableProfile, child: ComposableProfile): ComposableProfile {
  return {
    name: child.name,
    description: child.description ?? parent.description,
    projectType: child.projectType ?? parent.projectType,
    composable: child.composable ?? parent.composable,
    skills: mergeSkills(parent, child),
    agents: mergeArrays(parent.agents ?? [], child.agents ?? []),
    commands: mergeArrays(parent.commands ?? [], child.commands ?? []),
    claudeMd: mergeClaudeMd(parent, child),
    mcpServers: mergeMcpServers(parent, child),
    hooks: mergeHooks(parent.hooks, child.hooks)
  };
}

function resolveProfileExtends(
  profile: ComposableProfile,
  allProfiles: ComposableProfile[],
  visited: Set<string>
): ComposableProfile {
  if (!profile.extends) return profile;

  if (visited.has(profile.extends)) {
    console.warn(`Circular extends detected: ${profile.name} -> ${profile.extends}`);
    return profile;
  }
  visited.add(profile.extends);

  const parent = allProfiles.find(p => p.name === profile.extends);
  if (!parent) {
    console.warn(`Extended profile not found: ${profile.extends} (from ${profile.name})`);
    return profile;
  }

  const resolvedParent = resolveProfileExtends(parent, allProfiles, visited);
  return mergeProfiles(resolvedParent, profile);
}

function parseProfileFile(filePath: string, file: string): ComposableProfile | null {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_PROFILE_SIZE) {
      console.error(`Profile file exceeds size limit, skipping: ${file}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseYaml(content, { schema: 'core' });
    const validation = validateProfileSchema(parsed, file);
    if (!validation.valid) {
      console.error(`Profile validation failed for ${file}:`);
      validation.errors.forEach(e => console.error(`  - ${e}`));
      return null;
    }
    return parsed as ComposableProfile;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse profile ${file} in ${path.dirname(filePath)}: ${message}`);
    return null;
  }
}

function loadProfilesFromDir(dir: string): ComposableProfile[] {
  if (!fs.existsSync(dir)) {
    if (DEBUG) console.debug(`Profile directory not found: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .filter(f => !CONFIG_FILES.has(f));

  const profiles: ComposableProfile[] = [];
  for (const file of files) {
    const result = parseProfileFile(path.join(dir, file), file);
    if (result) profiles.push(result);
  }
  return profiles;
}

async function loadProfileFile(file: string, dir: string): Promise<ComposableProfile | null> {
  const filePath = path.join(dir, file);
  try {
    const stat = await fsPromises.stat(filePath);
    if (stat.size > MAX_PROFILE_SIZE) {
      console.error(`Profile file exceeds size limit, skipping: ${file}`);
      return null;
    }
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const parsed = parseYaml(content, { schema: 'core' });
    const validation = validateProfileSchema(parsed, file);
    if (!validation.valid) {
      console.error(`Profile validation failed for ${file}:`);
      validation.errors.forEach(e => console.error(`  - ${e}`));
      return null;
    }
    return parsed as ComposableProfile;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse profile ${file} in ${dir}: ${message}`);
    return null;
  }
}

async function loadProfilesFromDirAsync(dir: string): Promise<ComposableProfile[]> {
  try {
    await fsPromises.access(dir);
  } catch {
    if (DEBUG) console.debug(`Profile directory not accessible: ${dir}`);
    return [];
  }

  try {
    const files = await fsPromises.readdir(dir);
    const yamlFiles = files
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .filter(f => !CONFIG_FILES.has(f));

    const results = await Promise.all(yamlFiles.map(f => loadProfileFile(f, dir)));
    return results.filter((p): p is ComposableProfile => p !== null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error reading profiles directory ${dir}: ${message}`);
    return [];
  }
}

export function listProfiles(): ComposableProfile[] {
  const builtinProfiles = loadProfilesFromDir(BUILTIN_PROFILES_DIR);
  const userProfiles = loadProfilesFromDir(USER_PROFILES_DIR);

  const profileMap = new Map<string, ComposableProfile>();
  for (const profile of builtinProfiles) profileMap.set(profile.name, profile);
  for (const profile of userProfiles) profileMap.set(profile.name, profile);

  return Array.from(profileMap.values());
}

export async function listProfilesAsync(): Promise<ComposableProfile[]> {
  const [builtinProfiles, userProfiles] = await Promise.all([
    loadProfilesFromDirAsync(BUILTIN_PROFILES_DIR),
    loadProfilesFromDirAsync(USER_PROFILES_DIR)
  ]);

  const profileMap = new Map<string, ComposableProfile>();
  for (const profile of builtinProfiles) profileMap.set(profile.name, profile);
  for (const profile of userProfiles) profileMap.set(profile.name, profile);

  return Array.from(profileMap.values());
}

export function getProfile(name: string): ComposableProfile | null {
  const profiles = listProfiles();
  const profile = profiles.find(p => p.name === name) ?? null;
  if (!profile) return null;
  return resolveProfileExtends(profile, profiles, new Set());
}

export async function getProfileAsync(name: string): Promise<ComposableProfile | null> {
  const profiles = await listProfilesAsync();
  const profile = profiles.find(p => p.name === name) ?? null;
  if (!profile) return null;
  return resolveProfileExtends(profile, profiles, new Set());
}

// Re-export merge utilities for combiner
export { mergeArrays, mergeHooks };
