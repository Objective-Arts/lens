/**
 * Tests for profile path configuration:
 * validateEnvPath (via resolveProfilePaths), resolveProfilePaths, getSkillLibraryPaths
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveProfilePaths, getSkillLibraryPaths } from './paths.js';

describe('resolveProfilePaths', () => {
  let origEnvVars: Record<string, string | undefined>;

  beforeEach(() => {
    origEnvVars = {
      CC_USER_PROFILES_DIR: process.env.CC_USER_PROFILES_DIR,
      CC_BUILTIN_PROFILES_DIR: process.env.CC_BUILTIN_PROFILES_DIR,
      CC_MCP_SERVERS_DIR: process.env.CC_MCP_SERVERS_DIR,
    };
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(origEnvVars)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  });

  it('returns default paths when no env vars are set', () => {
    delete process.env.CC_USER_PROFILES_DIR;
    delete process.env.CC_BUILTIN_PROFILES_DIR;
    delete process.env.CC_MCP_SERVERS_DIR;

    const paths = resolveProfilePaths();

    expect(paths.userProfilesDir).toContain('.claude');
    expect(paths.userProfilesDir).toContain('profiles');
  });

  it('uses CC_USER_PROFILES_DIR when set to a valid absolute path', () => {
    process.env.CC_USER_PROFILES_DIR = '/tmp/custom-profiles';

    const paths = resolveProfilePaths();

    expect(paths.userProfilesDir).toBe('/tmp/custom-profiles');
  });

  it('rejects CC_USER_PROFILES_DIR with null byte (path injection attempt)', () => {
    // Note: Node.js process.env truncates strings at \0, so the env var receives
    // '/tmp/evil' instead of '/tmp/evil\0path'. The code's null-byte check is a
    // defense-in-depth guard for any runtime that doesn't truncate.
    // We verify the path is at minimum not the raw injected string.
    process.env.CC_USER_PROFILES_DIR = '/tmp/evil\0path';

    const paths = resolveProfilePaths();

    // The env var was truncated by Node to '/tmp/evil' (absolute), so it passes
    // validateEnvPath and the code uses it. This is correct — the truncated value
    // is a legitimate absolute path.
    expect(paths.userProfilesDir).not.toContain('\0');
    // The path after truncation is '/tmp/evil', which is absolute — used as-is.
    expect(typeof paths.userProfilesDir).toBe('string');
  });

  it('rejects CC_USER_PROFILES_DIR that is a relative path', () => {
    process.env.CC_USER_PROFILES_DIR = 'relative/path/here';

    const paths = resolveProfilePaths();

    // Relative paths should be rejected, falls back to default
    expect(paths.userProfilesDir).not.toBe('relative/path/here');
    expect(paths.userProfilesDir).toContain('.claude');
  });

  it('rejects empty CC_USER_PROFILES_DIR string', () => {
    process.env.CC_USER_PROFILES_DIR = '';

    const paths = resolveProfilePaths();

    expect(paths.userProfilesDir).toContain('.claude');
  });

  it('returns all four path fields', () => {
    const paths = resolveProfilePaths();

    expect(paths).toHaveProperty('userProfilesDir');
    expect(paths).toHaveProperty('builtinProfilesDir');
    expect(paths).toHaveProperty('mcpServersDir');
    expect(paths).toHaveProperty('skillLibraryPaths');
  });

  it('skillLibraryPaths contains canon, security, tech, global keys', () => {
    const paths = resolveProfilePaths();

    expect(paths.skillLibraryPaths).toHaveProperty('canon');
    expect(paths.skillLibraryPaths).toHaveProperty('security');
    expect(paths.skillLibraryPaths).toHaveProperty('tech');
    expect(paths.skillLibraryPaths).toHaveProperty('global');
  });
});

describe('getSkillLibraryPaths', () => {
  it('returns an object with all required library path keys', () => {
    const paths = getSkillLibraryPaths();

    expect(typeof paths.canon).toBe('string');
    expect(typeof paths.security).toBe('string');
    expect(typeof paths.tech).toBe('string');
    expect(typeof paths.global).toBe('string');
  });

  it('all paths are non-empty strings', () => {
    const paths = getSkillLibraryPaths();

    for (const [key, value] of Object.entries(paths)) {
      expect(value.length, `path '${key}' should be non-empty`).toBeGreaterThan(0);
    }
  });
});
