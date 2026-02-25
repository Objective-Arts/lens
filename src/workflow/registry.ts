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
import { isEnoent, safeReadFileSync } from '../utils/fs.js';

export interface InstallationEntry {
  registeredAt: string;
  lastUpdated: string;
  profileName?: string;
}

export interface InstallationRegistry {
  installations: Record<string, InstallationEntry>;
}

export function getDefaultRegistryPath(): string {
  return path.join(homedir(), '.claude', 'lens-registry.json');
}

export function getRegistryPath(registryPath?: string): string {
  return registryPath ?? getDefaultRegistryPath();
}

export function loadRegistry(registryPath?: string): InstallationRegistry {
  const filePath = getRegistryPath(registryPath);
  try {
    const data = safeReadFileSync(filePath);
    return JSON.parse(data);
  } catch (cause) {
    if (isEnoent(cause)) return { installations: {} };
    const backupPath = `${filePath}.corrupt.${process.pid}.json`;
    try { fs.renameSync(filePath, backupPath); } catch { /* ignore */ }
    console.warn(`Warning: corrupt lens-registry.json — backed up to ${backupPath} and using empty registry`);
    return { installations: {} };
  }
}

export function saveRegistry(registry: InstallationRegistry, registryPath?: string): void {
  const filePath = getRegistryPath(registryPath);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(registry, null, 2));
  fs.renameSync(tmpPath, filePath);
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
