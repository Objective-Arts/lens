/**
 * Profile persistence.
 *
 * Save profiles to disk with validation and atomic writes.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { stringify as stringifyYaml } from 'yaml';
import type { ComposableProfile } from '../types.js';
import { USER_PROFILES_DIR } from './paths.js';
import { isValidName, getNameValidationError } from '../utils/validation.js';

export function saveProfile(profile: ComposableProfile): void {
  if (!isValidName(profile.name)) {
    throw new Error(getNameValidationError(profile.name, 'profile name'));
  }

  fs.mkdirSync(USER_PROFILES_DIR, { recursive: true });

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(USER_PROFILES_DIR, filename);
  const content = stringifyYaml(profile);
  const tmpPath = filepath + '.tmp';

  try {
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filepath);
  } catch (cause) {
    try { fs.unlinkSync(tmpPath); } catch { /* cleanup best-effort */ }
    throw new Error('Failed to save profile', { cause });
  }
}

export async function saveProfileAsync(profile: ComposableProfile): Promise<void> {
  if (!isValidName(profile.name)) {
    throw new Error(getNameValidationError(profile.name, 'profile name'));
  }

  await fsPromises.mkdir(USER_PROFILES_DIR, { recursive: true });

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(USER_PROFILES_DIR, filename);
  const content = stringifyYaml(profile);
  const tmpPath = filepath + '.tmp';

  try {
    await fsPromises.writeFile(tmpPath, content, 'utf-8');
    await fsPromises.rename(tmpPath, filepath);
  } catch (cause) {
    await fsPromises.unlink(tmpPath).catch(() => {});
    throw new Error('Failed to save profile', { cause });
  }
}
