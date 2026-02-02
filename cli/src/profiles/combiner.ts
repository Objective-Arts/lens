/**
 * Profile combination and parsing.
 *
 * Combine multiple profiles into a merged profile.
 */

import type { ComposableProfile, SkillCategory } from '../types.js';
import { getProfile } from './loader.js';
import { mergeArrays, mergeHooks, mergeRalphSkills } from './loader.js';
import { SKILL_CATEGORIES } from './validation.js';

/**
 * Parse a profile string that may contain `+` for composition.
 */
export function parseProfileString(profileString: string): string[] {
  return profileString.split('+').map(s => s.trim()).filter(Boolean);
}

/** Create empty combined profile structure */
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

/** Merge skills by category */
function mergeSkillsInto(combined: ComposableProfile, skills: ComposableProfile['skills']): void {
  if (!skills || !combined.skills) return;
  for (const category of SKILL_CATEGORIES) {
    const src = skills[category as SkillCategory] ?? [];
    const dst = combined.skills[category as SkillCategory] ?? [];
    combined.skills[category as SkillCategory] = mergeArrays(dst, src);
  }
}

/** Merge claudeMd sections */
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

/** Merge MCP servers */
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

/**
 * Combine multiple profiles into one.
 */
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
