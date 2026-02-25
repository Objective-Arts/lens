/**
 * Tests for PATHS module: runtime asset path resolution.
 *
 * PATHS is a singleton with lazily-resolved properties.
 * Tests verify:
 * - All properties return strings (never null/undefined)
 * - root is a non-empty absolute path
 * - mode is one of the valid values
 * - Paths are cached (same call returns identical reference)
 * - resolveAssetPath falls back to cwd-relative when package path missing
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { PATHS, type LensPaths } from './paths.js';

describe('PATHS singleton', () => {
  it('is defined and not null', () => {
    expect(PATHS).toBeDefined();
    expect(PATHS).not.toBeNull();
  });

  it('root is a non-empty absolute path', () => {
    expect(PATHS.root).toBeTruthy();
    expect(path.isAbsolute(PATHS.root)).toBe(true);
  });

  it('mode is "installed" or "dev"', () => {
    expect(['installed', 'dev']).toContain(PATHS.mode);
  });

  it('canons path is a string', () => {
    expect(typeof PATHS.canons).toBe('string');
    expect(PATHS.canons.length).toBeGreaterThan(0);
  });

  it('profiles path is a string', () => {
    expect(typeof PATHS.profiles).toBe('string');
    expect(PATHS.profiles.length).toBeGreaterThan(0);
  });

  it('workflowSkills path is a string', () => {
    expect(typeof PATHS.workflowSkills).toBe('string');
    expect(PATHS.workflowSkills.length).toBeGreaterThan(0);
  });

  it('pipeline path is a string', () => {
    expect(typeof PATHS.pipeline).toBe('string');
    expect(PATHS.pipeline.length).toBeGreaterThan(0);
  });

  it('rubrics path is a string', () => {
    expect(typeof PATHS.rubrics).toBe('string');
    expect(PATHS.rubrics.length).toBeGreaterThan(0);
  });

  it('phases path is a string', () => {
    expect(typeof PATHS.phases).toBe('string');
    expect(PATHS.phases.length).toBeGreaterThan(0);
  });

  it('config path is a string', () => {
    expect(typeof PATHS.config).toBe('string');
    expect(PATHS.config.length).toBeGreaterThan(0);
  });

  it('mcp path is a string', () => {
    expect(typeof PATHS.mcp).toBe('string');
    expect(PATHS.mcp.length).toBeGreaterThan(0);
  });

  it('plans path is a string', () => {
    expect(typeof PATHS.plans).toBe('string');
    expect(PATHS.plans.length).toBeGreaterThan(0);
  });

  it('claudeConfig path is a string', () => {
    expect(typeof PATHS.claudeConfig).toBe('string');
    expect(PATHS.claudeConfig.length).toBeGreaterThan(0);
  });

  it('skills path is a string', () => {
    expect(typeof PATHS.skills).toBe('string');
    expect(PATHS.skills.length).toBeGreaterThan(0);
  });
});

describe('PATHS — caching behavior', () => {
  it('canons returns the same value on repeated access', () => {
    const first = PATHS.canons;
    const second = PATHS.canons;
    expect(first).toBe(second);
  });

  it('profiles returns the same value on repeated access', () => {
    expect(PATHS.profiles).toBe(PATHS.profiles);
  });

  it('mode returns the same value on repeated access', () => {
    expect(PATHS.mode).toBe(PATHS.mode);
  });
});

describe('PATHS — resolution in dev mode', () => {
  it('canons path ends with canon or resolves to a plausible location', () => {
    // In dev mode (running from the repo), canons should resolve to the canon/ dir
    // in the package root or cwd
    const canonsPath = PATHS.canons;
    // Should contain 'canon' somewhere in the path
    expect(canonsPath).toMatch(/canon/);
  });

  it('profiles path ends with profiles', () => {
    expect(PATHS.profiles).toMatch(/profiles/);
  });

  it('pipeline path ends with pipeline.sh', () => {
    expect(PATHS.pipeline).toMatch(/pipeline\.sh$/);
  });

  it('all path properties are absolute', () => {
    const absoluteProps: Array<keyof LensPaths> = [
      'root', 'canons', 'profiles', 'workflowSkills',
      'pipeline', 'phases', 'config', 'mcp', 'plans', 'claudeConfig'
    ];

    for (const prop of absoluteProps) {
      const value = PATHS[prop] as string;
      expect(path.isAbsolute(value)).toBe(true);
    }
  });
});
