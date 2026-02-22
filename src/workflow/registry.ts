/**
 * Central Installation Registry
 *
 * Tracks which projects have Lens workflow skills installed,
 * enabling `lns workflow push` to update them all at once.
 *
 * Registry file: ~/.claude/lens-registry.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface InstallationEntry {
  registeredAt: string;
  lastUpdated: string;
  profileName?: string;
}

export interface InstallationRegistry {
  installations: Record<string, InstallationEntry>;
}

export function getRegistryPath(): string {
  return path.join(homedir(), '.claude', 'lens-registry.json');
}

export function loadRegistry(): InstallationRegistry {
  const registryPath = getRegistryPath();
  try {
    const data = fs.readFileSync(registryPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { installations: {} };
  }
}

export function saveRegistry(registry: InstallationRegistry): void {
  const registryPath = getRegistryPath();
  const dir = path.dirname(registryPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

export function registerInstallation(projectPath: string, profileName?: string): void {
  const absPath = path.resolve(projectPath);
  const registry = loadRegistry();
  const now = new Date().toISOString();

  const existing = registry.installations[absPath];
  registry.installations[absPath] = {
    registeredAt: existing?.registeredAt ?? now,
    lastUpdated: now,
    profileName: profileName ?? existing?.profileName
  };

  saveRegistry(registry);
}

export function unregisterInstallation(projectPath: string): void {
  const absPath = path.resolve(projectPath);
  const registry = loadRegistry();
  delete registry.installations[absPath];
  saveRegistry(registry);
}

export function listInstallations(): Array<{ projectPath: string; entry: InstallationEntry }> {
  const registry = loadRegistry();
  return Object.entries(registry.installations).map(([projectPath, entry]) => ({
    projectPath,
    entry
  }));
}

export function pruneRegistry(): string[] {
  const registry = loadRegistry();
  const pruned: string[] = [];

  for (const projectPath of Object.keys(registry.installations)) {
    const claudeDir = path.join(projectPath, '.claude');
    if (!fs.existsSync(claudeDir)) {
      delete registry.installations[projectPath];
      pruned.push(projectPath);
    }
  }

  if (pruned.length > 0) {
    saveRegistry(registry);
  }

  return pruned;
}
