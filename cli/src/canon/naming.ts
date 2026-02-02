/**
 * Skill naming utilities for tribute ↔ generic name mapping.
 *
 * When CANON_TRIBUTE_NAMES=1 is set:
 * - Tribute names (kernighan, dijkstra) resolve to generic names (clarity, correctness)
 * - Display shows tribute names for debugging
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCanonSourcePath } from './index.js';

interface SkillNaming {
  tribute: string;
  category: string;
  note?: string;
}

interface NamingConfig {
  _debugFlag: string;
  skills: Record<string, SkillNaming>;
}

let namingConfig: NamingConfig | null = null;
let tributeToGeneric: Map<string, string> | null = null;
let genericToTribute: Map<string, string> | null = null;

/**
 * Load the naming configuration from canon/naming.json
 */
function loadNamingConfig(): NamingConfig | null {
  if (namingConfig !== null) return namingConfig;

  const canonPath = getCanonSourcePath();
  const namingPath = path.join(canonPath, 'naming.json');

  if (!fs.existsSync(namingPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(namingPath, 'utf-8');
    namingConfig = JSON.parse(content) as NamingConfig;
    buildLookupMaps();
    return namingConfig;
  } catch {
    return null;
  }
}

/**
 * Build bidirectional lookup maps from the config
 */
function buildLookupMaps(): void {
  if (!namingConfig) return;

  tributeToGeneric = new Map();
  genericToTribute = new Map();

  for (const [genericName, info] of Object.entries(namingConfig.skills)) {
    tributeToGeneric.set(info.tribute, genericName);
    genericToTribute.set(genericName, info.tribute);
  }
}

/**
 * Check if tribute names mode is enabled
 */
export function isTributeNamesEnabled(): boolean {
  return process.env.CANON_TRIBUTE_NAMES === '1';
}

/**
 * Resolve a skill name to its canonical (generic) name.
 * ALWAYS resolves tribute names to generic names.
 * The CANON_TRIBUTE_NAMES flag only controls display, not resolution.
 */
export function resolveSkillName(name: string): string {
  loadNamingConfig();
  if (!tributeToGeneric) return name;

  // If it's a tribute name, map to generic
  const genericName = tributeToGeneric.get(name);
  if (genericName) return genericName;

  // Already a generic name or unknown
  return name;
}

/**
 * Get the tribute name for a generic skill name (for display when debugging)
 */
export function getTributeName(genericName: string): string | null {
  loadNamingConfig();
  if (!genericToTribute) return null;
  return genericToTribute.get(genericName) ?? null;
}

/**
 * Format a skill name for display.
 * If tribute names are enabled, shows "generic (tribute)" format.
 */
export function formatSkillName(genericName: string): string {
  if (!isTributeNamesEnabled()) return genericName;

  const tribute = getTributeName(genericName);
  if (tribute) {
    return `${genericName} (${tribute})`;
  }
  return genericName;
}

/**
 * Get all tribute name aliases for a skill (for tab completion, etc.)
 */
export function getSkillAliases(genericName: string): string[] {
  if (!isTributeNamesEnabled()) return [];

  const tribute = getTributeName(genericName);
  return tribute ? [tribute] : [];
}

/**
 * List all available skill names (generic + tribute aliases if enabled)
 */
export function getAllSkillNames(): { generic: string; tribute?: string }[] {
  loadNamingConfig();
  if (!namingConfig) return [];

  return Object.entries(namingConfig.skills).map(([generic, info]) => ({
    generic,
    tribute: isTributeNamesEnabled() ? info.tribute : undefined
  }));
}
