/**
 * Canon manifest file operations
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CanonManifest, CanonSource, InstalledSkillInfo } from './types.js';

const MANIFEST_FILENAME = 'canon-manifest.json';

/**
 * Get the manifest file path for a project
 */
export function getManifestPath(projectPath: string): string {
  return path.join(projectPath, '.claude', MANIFEST_FILENAME);
}

/**
 * Read the canon manifest from a project
 * Returns null if manifest doesn't exist
 */
export function readManifest(projectPath: string): CanonManifest | null {
  const manifestPath = getManifestPath(projectPath);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as CanonManifest;
  } catch (error) {
    console.error(`Failed to read manifest: ${error}`);
    return null;
  }
}

/**
 * Write the canon manifest to a project
 */
export function writeManifest(projectPath: string, manifest: CanonManifest): void {
  const manifestPath = getManifestPath(projectPath);
  const claudeDir = path.dirname(manifestPath);

  // Ensure .claude directory exists
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

/**
 * Create a new manifest with default values
 * @param source - Source configuration (may include optional version for future migrations)
 */
export function createManifest(
  source: CanonSource & { version?: number }
): CanonManifest {
  const { version, ...sourceConfig } = source;
  return {
    version,
    source: sourceConfig,
    installedAt: new Date().toISOString(),
    skills: {}
  };
}

/**
 * Add or update a skill in the manifest
 */
export function updateSkillInManifest(
  manifest: CanonManifest,
  skillName: string,
  info: InstalledSkillInfo
): void {
  manifest.skills[skillName] = info;
}

/**
 * Remove a skill from the manifest
 */
export function removeSkillFromManifest(manifest: CanonManifest, skillName: string): void {
  delete manifest.skills[skillName];
}

/**
 * Mark a skill as modified in the manifest
 */
export function markSkillModified(manifest: CanonManifest, skillName: string): void {
  if (manifest.skills[skillName]) {
    manifest.skills[skillName].modified = true;
  }
}

/**
 * Get the commit hash from a git repository
 */
export function getGitCommit(repoPath: string): string | undefined {
  const gitHeadPath = path.join(repoPath, '.git', 'HEAD');

  if (!fs.existsSync(gitHeadPath)) {
    return undefined;
  }

  try {
    const headContent = fs.readFileSync(gitHeadPath, 'utf-8').trim();

    // Check if it's a direct ref or a symbolic ref
    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.slice(5);
      const refFilePath = path.join(repoPath, '.git', refPath);
      if (fs.existsSync(refFilePath)) {
        return fs.readFileSync(refFilePath, 'utf-8').trim().slice(0, 7);
      }
    } else {
      return headContent.slice(0, 7);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Get the git remote URL from a repository
 */
export function getGitRemote(repoPath: string): string | undefined {
  const configPath = path.join(repoPath, '.git', 'config');

  if (!fs.existsSync(configPath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}
