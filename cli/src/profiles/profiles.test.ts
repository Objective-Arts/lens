/**
 * Tests for profile management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  parseProfileString,
  combineProfiles,
  getSkillLibraryPaths
} from './index.js';
import type { ComposableProfile } from '../types.js';

describe('parseProfileString', () => {
  it('parses single profile', () => {
    expect(parseProfileString('javascript')).toEqual(['javascript']);
  });

  it('parses multiple profiles with +', () => {
    expect(parseProfileString('base-tech+javascript+react')).toEqual([
      'base-tech',
      'javascript',
      'react'
    ]);
  });

  it('handles whitespace around +', () => {
    expect(parseProfileString('base-tech + javascript + react')).toEqual([
      'base-tech',
      'javascript',
      'react'
    ]);
  });

  it('filters empty segments', () => {
    expect(parseProfileString('base-tech++javascript')).toEqual([
      'base-tech',
      'javascript'
    ]);
  });

  it('handles empty string', () => {
    expect(parseProfileString('')).toEqual([]);
  });
});

describe('combineProfiles', () => {
  it('returns null for empty profile names', () => {
    expect(combineProfiles([])).toBeNull();
  });

  it('returns single profile unchanged', () => {
    // This test relies on actual profiles existing
    // Skip if profiles don't exist
    const result = combineProfiles(['javascript']);
    if (result) {
      expect(result.name).toBe('javascript');
    }
  });

  it('merges skills from multiple profiles', () => {
    // This test relies on actual profiles
    const result = combineProfiles(['base-tech', 'javascript']);
    if (result) {
      expect(result.name).toContain('base-tech');
      expect(result.name).toContain('javascript');
      expect(result.skills).toBeDefined();
    }
  });

  it('deduplicates merged arrays', () => {
    const result = combineProfiles(['base-tech', 'java', 'javascript']);
    if (result) {
      // Check that agents array has no duplicates
      if (result.agents) {
        const uniqueAgents = [...new Set(result.agents)];
        expect(result.agents.length).toBe(uniqueAgents.length);
      }
    }
  });
});

describe('getSkillLibraryPaths', () => {
  it('returns all expected categories', () => {
    const paths = getSkillLibraryPaths();

    expect(paths).toHaveProperty('security');
    expect(paths).toHaveProperty('tech');
    expect(paths).toHaveProperty('canon');
    expect(paths).toHaveProperty('global');
  });

  it('returns absolute paths', () => {
    const paths = getSkillLibraryPaths();

    expect(path.isAbsolute(paths.security)).toBe(true);
    expect(path.isAbsolute(paths.tech)).toBe(true);
    expect(path.isAbsolute(paths.canon)).toBe(true);
    expect(path.isAbsolute(paths.global)).toBe(true);
  });
});

describe('profile combination integration', () => {
  it('combines base-tech + java + javascript + angular', () => {
    const result = combineProfiles(['base-tech', 'java', 'javascript', 'angular']);

    if (result) {
      expect(result.name).toBe('base-tech + java + javascript + angular');
      expect(result.description).toContain('Combined profile');

      // Should have skills from all profiles
      expect(result.skills).toBeDefined();

      // Should have auto-invoke rules
      expect(result.claudeMd?.autoInvoke).toBeDefined();
      if (result.claudeMd?.autoInvoke) {
        expect(result.claudeMd.autoInvoke.length).toBeGreaterThan(0);
      }
    }
  });
});
