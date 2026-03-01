import * as fs from 'fs';
import type { SettingsParsed, ConfigScope } from '../types.js';
import { isEnoent } from '../utils/fs.js';

const MAX_SETTINGS_FILE_SIZE = 256 * 1024; // 256 KB cap for settings files

/** Minimal shape check — must be a non-null object (not array, not primitive). */
function isValidSettingsShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function parseSettings(filePath: string, scope: ConfigScope): Promise<SettingsParsed | null> {
  let content: string;

  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_SETTINGS_FILE_SIZE) {
      throw new Error(`Settings file exceeds ${MAX_SETTINGS_FILE_SIZE / 1024} KB size limit: ${filePath}`);
    }
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e: unknown) {
    if (isEnoent(e)) {
      // File does not exist — not an error, just absent
      return null;
    }
    // Unexpected I/O error — surface it with cause chain
    throw new Error(`Failed to read settings file: ${filePath}`, { cause: e });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e: unknown) {
    throw new Error(`Invalid JSON in settings file: ${filePath}`, { cause: e });
  }

  // Schema validation: must be a plain object
  if (!isValidSettingsShape(parsed)) {
    throw new Error(
      `Settings file has unexpected shape (expected an object): ${filePath}`
    );
  }

  return buildSettingsResult(parsed, filePath, scope);
}

function isPermissionsShape(value: unknown): value is SettingsParsed['permissions'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return true;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function isStringValueRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as object).every(v => typeof v === 'string');
}

function buildSettingsResult(
  settings: Record<string, unknown>, filePath: string, scope: ConfigScope
): SettingsParsed {
  const model = typeof settings['model'] === 'string' ? settings['model'] : undefined;
  const permissions = isPermissionsShape(settings['permissions']) ? settings['permissions'] : undefined;
  const mcpServers = toStringArray(settings['enabledMcpjsonServers']);
  const env = isStringValueRecord(settings['env']) ? settings['env'] : undefined;

  return {
    path: filePath,
    scope,
    model,
    permissions,
    mcpServers,
    env,
  };
}
