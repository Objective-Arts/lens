/**
 * Skill naming utilities for tribute ↔ generic name mapping.
 *
 * When CANON_TRIBUTE_NAMES=1 is set:
 * - Tribute names (e.g. legacy tribute IDs) resolve to generic names (clarity, correctness)
 * - Display shows tribute names for debugging
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'os';

/** Project root (works from both src/ and dist/) */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NAMING_PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_CANON_PATH = path.join(homedir(), 'local-tech-projects', 'lens', 'canon');

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

function loadNamingConfig(): NamingConfig | null {
  if (namingConfig !== null) return namingConfig;

  const canonPath = process.env.CANON_SKILLS_PATH || DEFAULT_CANON_PATH;
  const candidates = [
    path.join(canonPath, 'naming.json'),
    path.join(NAMING_PROJECT_ROOT, 'canon', 'naming.json')
  ];

  for (const namingPath of candidates) {
    try {
      namingConfig = JSON.parse(fs.readFileSync(namingPath, 'utf-8')) as NamingConfig;
      buildLookupMaps();
      return namingConfig;
    } catch {
      // Try next candidate
    }
  }

  return null;
}

function buildLookupMaps(): void {
  if (!namingConfig) return;

  tributeToGeneric = new Map();
  genericToTribute = new Map();

  for (const [genericName, info] of Object.entries(namingConfig.skills)) {
    tributeToGeneric.set(info.tribute, genericName);
    genericToTribute.set(genericName, info.tribute);
  }
}

function isTributeNamesEnabled(): boolean {
  return process.env.CANON_TRIBUTE_NAMES === '1';
}

/** ALWAYS resolves tribute->generic. The CANON_TRIBUTE_NAMES flag only controls display. */
export function resolveSkillName(name: string): string {
  loadNamingConfig();
  if (!tributeToGeneric) return name;

  // If it's a tribute name, map to generic
  const genericName = tributeToGeneric.get(name);
  if (genericName) return genericName;

  // Already a generic name or unknown
  return name;
}

export function getTributeName(genericName: string): string | null {
  loadNamingConfig();
  if (!genericToTribute) return null;
  return genericToTribute.get(genericName) ?? null;
}

/** If tribute names enabled, shows "generic (tribute)" format. */
export function formatSkillName(genericName: string): string {
  if (!isTributeNamesEnabled()) return genericName;

  const tribute = getTributeName(genericName);
  if (tribute) {
    return `${genericName} (${tribute})`;
  }
  return genericName;
}

