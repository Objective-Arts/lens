/**
 * Profile persistence.
 *
 * Save profiles to disk.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { stringify as stringifyYaml } from 'yaml';
import type { ComposableProfile } from '../types.js';
import { USER_PROFILES_DIR } from './paths.js';

export function saveProfile(profile: ComposableProfile): void {
  if (!fs.existsSync(USER_PROFILES_DIR)) {
    fs.mkdirSync(USER_PROFILES_DIR, { recursive: true });
  }

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(USER_PROFILES_DIR, filename);
  const content = stringifyYaml(profile);

  fs.writeFileSync(filepath, content, 'utf-8');
}

export async function saveProfileAsync(profile: ComposableProfile): Promise<void> {
  await fsPromises.mkdir(USER_PROFILES_DIR, { recursive: true });

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(USER_PROFILES_DIR, filename);
  const content = stringifyYaml(profile);

  await fsPromises.writeFile(filepath, content, 'utf-8');
}
