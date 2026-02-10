/**
 * Canon manifest file operations
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CanonManifest, CanonSource, InstalledSkillInfo } from './types.js';

const MANIFEST_FILENAME = 'canon-manifest.json';

function getManifestPath(projectPath: string): string {
  return path.join(projectPath, '.claude', MANIFEST_FILENAME);
}

/**
 * Read the canon manifest from a project
 * Returns null if manifest doesn't exist
 */
export function readManifest(projectPath: string): CanonManifest | null {
  const manifestPath = getManifestPath(projectPath);
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as CanonManifest;
  } catch {
    return null;
  }
}

export function writeManifest(projectPath: string, manifest: CanonManifest): void {
  const manifestPath = getManifestPath(projectPath);
  const claudeDir = path.dirname(manifestPath);

  // Ensure .claude directory exists
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

export function createManifest(source: CanonSource): CanonManifest {
  return {
    source,
    installedAt: new Date().toISOString(),
    skills: {}
  };
}

export function updateSkillInManifest(
  manifest: CanonManifest,
  skillName: string,
  info: InstalledSkillInfo
): void {
  manifest.skills[skillName] = info;
}



