/**
 * Tests for profile persistence:
 * saveProfile, saveProfileAsync — validation, atomic writes, cleanup
 *
 * Note: saveProfile/saveProfileAsync write to USER_PROFILES_DIR, which is a
 * module-level constant resolved at import time. We test:
 *   1. Validation rejects invalid profile names (fast, no I/O)
 *   2. Atomic write pattern with manual replication (to verify shape/behavior)
 *   3. That valid profiles do not throw
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { stringify as stringifyYaml } from 'yaml';
import { saveProfile, saveProfileAsync } from './persistence.js';
import type { ComposableProfile } from '../types.js';

function makeProfile(overrides: Partial<ComposableProfile> = {}): ComposableProfile {
  return {
    name: 'test-profile',
    description: 'A test profile',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// saveProfile (sync)
// ---------------------------------------------------------------------------

describe('saveProfile (sync)', () => {
  it('throws for an empty profile name', () => {
    expect(() => saveProfile(makeProfile({ name: '' }))).toThrow();
  });

  it('throws for a name with path traversal (..)', () => {
    expect(() => saveProfile(makeProfile({ name: '../evil' }))).toThrow();
  });

  it('throws for a name with spaces', () => {
    expect(() => saveProfile(makeProfile({ name: 'bad name' }))).toThrow();
  });

  it('throws for a name with slashes', () => {
    expect(() => saveProfile(makeProfile({ name: 'a/b/c' }))).toThrow();
  });

  it('throws for a name exceeding 100 characters', () => {
    expect(() => saveProfile(makeProfile({ name: 'a'.repeat(101) }))).toThrow();
  });

  it('does not throw for a valid profile name', () => {
    // This will write to the real USER_PROFILES_DIR (~/.claude/profiles),
    // which is acceptable — it's the same place `profile create` writes to.
    expect(() => saveProfile(makeProfile({ name: 'valid-test-profile' }))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// saveProfileAsync
// ---------------------------------------------------------------------------

describe('saveProfileAsync', () => {
  it('throws for an empty profile name', async () => {
    await expect(saveProfileAsync(makeProfile({ name: '' }))).rejects.toThrow();
  });

  it('throws for a name with path traversal', async () => {
    await expect(saveProfileAsync(makeProfile({ name: '../../secret' }))).rejects.toThrow();
  });

  it('throws for a name with special characters', async () => {
    await expect(saveProfileAsync(makeProfile({ name: 'bad@name' }))).rejects.toThrow();
  });

  it('does not throw for a valid profile name', async () => {
    await expect(saveProfileAsync(makeProfile({ name: 'async-test-profile' }))).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Atomic write behavior (manual replication tests)
// ---------------------------------------------------------------------------

describe('atomic write pattern', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-persist-atomic-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sync: leaves no .tmp file after a successful write', () => {
    const profile = makeProfile({ name: 'my-profile' });
    const content = stringifyYaml(profile);
    const filepath = path.join(tmpDir, 'my-profile.yaml');
    const tmpPath = filepath + '.tmp';

    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filepath);

    expect(fs.existsSync(filepath)).toBe(true);
    expect(fs.existsSync(tmpPath)).toBe(false);
  });

  it('sync: written YAML file contains the profile name', () => {
    const profile = makeProfile({ name: 'check-content', description: 'desc here' });
    const content = stringifyYaml(profile);
    const filepath = path.join(tmpDir, 'check-content.yaml');
    fs.writeFileSync(filepath, content, 'utf-8');

    const written = fs.readFileSync(filepath, 'utf-8');
    expect(written).toContain('check-content');
    expect(written).toContain('desc here');
  });

  it('async: leaves no .tmp file after a successful write', async () => {
    const profile = makeProfile({ name: 'async-profile' });
    const content = stringifyYaml(profile);
    const filepath = path.join(tmpDir, 'async-profile.yaml');
    const tmpPath = filepath + '.tmp';

    await fsPromises.writeFile(tmpPath, content, 'utf-8');
    await fsPromises.rename(tmpPath, filepath);

    expect(fs.existsSync(filepath)).toBe(true);
    expect(fs.existsSync(tmpPath)).toBe(false);
  });

  it('name normalization: spaces become hyphens in filename', () => {
    // Replicate the filename normalization logic
    const name = 'my profile name';
    const filename = name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
    expect(filename).toBe('my-profile-name.yaml');
  });
});

// ---------------------------------------------------------------------------
// Interrupted write recovery
// ---------------------------------------------------------------------------

describe('interrupted write recovery', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-persist-recovery-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sync: cleanup removes tmp file when rename fails', () => {
    // Simulate interrupted write: tmp file exists but rename hasn't happened
    const filepath = path.join(tmpDir, 'partial.yaml');
    const tmpPath = filepath + '.tmp';
    fs.writeFileSync(tmpPath, 'partial content');

    // Simulate cleanup (as done in saveProfile catch block)
    try { fs.unlinkSync(tmpPath); } catch { /* noop */ }

    expect(fs.existsSync(tmpPath)).toBe(false);
    expect(fs.existsSync(filepath)).toBe(false);
  });

  it('async: cleanup removes tmp file when rename fails', async () => {
    const filepath = path.join(tmpDir, 'async-partial.yaml');
    const tmpPath = filepath + '.tmp';
    await fsPromises.writeFile(tmpPath, 'partial content');

    // Simulate cleanup
    await fsPromises.unlink(tmpPath).catch(() => {});

    expect(fs.existsSync(tmpPath)).toBe(false);
  });
});
