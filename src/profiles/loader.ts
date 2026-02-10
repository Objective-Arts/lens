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

function mergeArrays<T>(target: T[], source: T[]): T[] {
  return [...new Set([...target, ...source])];
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
    const parentHooks = parent[eventType] ?? [];
    const childHooks = child[eventType] ?? [];
    if (parentHooks.length > 0 || childHooks.length > 0) {
      merged[eventType] = [...parentHooks, ...childHooks];
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

/** Merge ralph.skills configurations */
function mergeRalphSkills(
  parent: ComposableProfile['ralph'],
  child: ComposableProfile['ralph']
): ComposableProfile['ralph'] {
  const parentSkills = parent?.skills ?? {};
  const childSkills = child?.skills ?? {};

  const mergedSkills = {
    plan: mergeArrays(parentSkills.plan ?? [], childSkills.plan ?? []),
    build: mergeArrays(parentSkills.build ?? [], childSkills.build ?? []),
    refactor: mergeArrays(parentSkills.refactor ?? [], childSkills.refactor ?? []),
    test: mergeArrays(parentSkills.test ?? [], childSkills.test ?? []),
    review: mergeArrays(parentSkills.review ?? [], childSkills.review ?? []),
    doc: mergeArrays(parentSkills.doc ?? [], childSkills.doc ?? [])
  };

  return { ...parent, ...child, skills: mergedSkills };
}

function mergeProfiles(parent: ComposableProfile, child: ComposableProfile): ComposableProfile {
  return {
    name: child.name,
    description: child.description ?? parent.description,
    projectType: child.projectType ?? parent.projectType,
    composable: child.composable ?? parent.composable,
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

function resolveProfileExtends(
  profile: ComposableProfile,
  allProfiles: ComposableProfile[],
  visited: Set<string>
): ComposableProfile {
  if (!profile.extends) return profile;

  if (visited.has(profile.name)) {
    console.warn(`Circular extends detected: ${profile.name}`);
    return profile;
  }
  visited.add(profile.name);

  const parent = allProfiles.find(p => p.name === profile.extends);
  if (!parent) {
    console.warn(`Extended profile not found: ${profile.extends} (from ${profile.name})`);
    return profile;
  }

  const resolvedParent = resolveProfileExtends(parent, allProfiles, visited);
  return mergeProfiles(resolvedParent, profile);
}

function loadProfilesFromDir(dir: string): ComposableProfile[] {
  if (!fs.existsSync(dir)) {
    if (DEBUG) console.debug(`Profile directory not found: ${dir}`);
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

      const validation = validateProfileSchema(parsed, file);
      if (!validation.valid) {
        console.error(`Profile validation failed for ${file}:`);
        validation.errors.forEach(e => console.error(`  - ${e}`));
        continue;
      }

      profiles.push(parsed as ComposableProfile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse profile ${file} in ${dir}: ${message}`);
    }
  }

  return profiles;
}

async function loadProfilesFromDirAsync(dir: string): Promise<ComposableProfile[]> {
  try {
    await fsPromises.access(dir);
  } catch {
    if (DEBUG) console.debug(`Profile directory not accessible: ${dir}`);
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

        const validation = validateProfileSchema(parsed, file);
        if (!validation.valid) {
          console.error(`Profile validation failed for ${file}:`);
          validation.errors.forEach(e => console.error(`  - ${e}`));
          continue;
        }

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
export { mergeArrays, mergeHooks, mergeRalphSkills };
