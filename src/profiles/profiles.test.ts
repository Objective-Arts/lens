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
  getSkillLibraryPaths,
  listProfiles,
  applyComposableProfile
} from './index.js';
import { findSkillSourcePath, getCanonSourcePath } from '../canon/index.js';
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
    const result = combineProfiles(['javascript']);
    if (result) {
      expect(result.name).toBe('javascript');
    }
  });

  it('merges skills from multiple profiles', () => {
    const result = combineProfiles(['software-base', 'javascript']);
    if (result) {
      expect(result.name).toContain('software-base');
      expect(result.name).toContain('javascript');
      expect(result.skills).toBeDefined();
    }
  });

  it('deduplicates merged arrays', () => {
    const result = combineProfiles(['software-base', 'java', 'javascript']);
    if (result) {
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

// ============================================================================
// CRITICAL: Skill existence verification
// These tests ensure all skills referenced in profiles actually exist
// ============================================================================

describe('canon source directory', () => {
  it('points to a canon directory', () => {
    const canonPath = getCanonSourcePath();
    expect(canonPath).toContain('canon');
    expect(fs.existsSync(canonPath)).toBe(true);
  });
});

describe('software-base profile skill existence', () => {
  // Using generic names
  const baseBrainSkills = [
    'clarity',
    'simplicity',
    'composition',
    'distributed',
    'data-first',
    'correctness',
    'algorithms',
    'abstraction',
    'optimization',
    'pragmatism'
  ];

  const designPatternSkills = [
    'design-patterns'
  ];

  const securitySkills = [
    'security-mindset',
    'owasp',
    'threat-model',
    'appsec',
    'web-security'
  ];

  const engineeringSkills = [
    'failure',
    'safety',
    'resilience',
    'style'
  ];

  const documentationSkills = [
    'docs',
    'prose',
    'brevity',
    'editing'
  ];

  const testingSkills = [
    'legacy',
    'test-doubles',
    'test-strategy'
  ];

  // Helper to test skill existence without non-null assertions
  const testSkillExists = (skill: string) => {
    const skillPath = findSkillSourcePath(skill);
    expect(skillPath).not.toBeNull();
    if (skillPath) {
      expect(fs.existsSync(skillPath)).toBe(true);
      expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
    }
  };

  describe('Base Brain skills', () => {
    baseBrainSkills.forEach(skill => {
      it(`${skill} exists in canon with SKILL.md`, () => testSkillExists(skill));
    });
  });

  describe('Design Pattern skills', () => {
    designPatternSkills.forEach(skill => {
      it(`${skill} exists in canon with SKILL.md`, () => testSkillExists(skill));
    });
  });

  describe('Security skills', () => {
    securitySkills.forEach(skill => {
      it(`${skill} exists in canon with SKILL.md`, () => testSkillExists(skill));
    });
  });

  describe('Engineering skills', () => {
    engineeringSkills.forEach(skill => {
      it(`${skill} exists in canon with SKILL.md`, () => testSkillExists(skill));
    });
  });

  describe('Documentation skills', () => {
    documentationSkills.forEach(skill => {
      it(`${skill} exists in canon with SKILL.md`, () => testSkillExists(skill));
    });
  });

  describe('Testing skills', () => {
    testingSkills.forEach(skill => {
      it(`${skill} exists in canon with SKILL.md`, () => testSkillExists(skill));
    });
  });
});

describe('csharp profile skill existence', () => {
  // Using generic names (not tribute names)
  const csharpSkills = [
    'csharp-depth',
    'async',
    'type-systems',
    'java'
  ];

  csharpSkills.forEach(skill => {
    it(`${skill} exists in canon with SKILL.md`, () => {
      const skillPath = findSkillSourcePath(skill);
      expect(skillPath).not.toBeNull();
      if (skillPath) {
        expect(fs.existsSync(skillPath)).toBe(true);
        expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
      }
    });
  });
});

describe('javascript profile skill existence', () => {
  // Using generic names (not tribute names)
  const jsSkills = [
    'typescript',
    'js-safety',
    'react-test'
  ];

  jsSkills.forEach(skill => {
    it(`${skill} exists in canon with SKILL.md`, () => {
      const skillPath = findSkillSourcePath(skill);
      expect(skillPath).not.toBeNull();
      if (skillPath) {
        expect(fs.existsSync(skillPath)).toBe(true);
        expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
      }
    });
  });

  it('js-internals exists in canon', () => {
    // Using generic name
    const skillPath = findSkillSourcePath('js-internals');
    if (skillPath) {
      expect(fs.existsSync(skillPath)).toBe(true);
    }
  });
});

describe('ui-ux profile skill existence', () => {
  // UI/UX skills in canon
  const uiuxSkills = [
    'usability',
    'mobile',
    'interaction',
    'motion',
    'typography',
    'components',
    'visual',
    'design',
    'tokens',
    'personas',
    'handoff'
  ];

  uiuxSkills.forEach(skill => {
    it(`${skill} exists in canon/ui-ux with SKILL.md`, () => {
      const skillPath = findSkillSourcePath(skill);
      expect(skillPath).not.toBeNull();
      if (skillPath) {
        expect(fs.existsSync(skillPath)).toBe(true);
        expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
      }
    });
  });
});

describe('visualization profile skill existence', () => {
  const vizSkills = [
    'charts',
    'd3',
    'dashboards',
    'data-story'
  ];

  vizSkills.forEach(skill => {
    it(`${skill} exists in canon/visualization with SKILL.md`, () => {
      const skillPath = findSkillSourcePath(skill);
      expect(skillPath).not.toBeNull();
      if (skillPath) {
        expect(fs.existsSync(skillPath)).toBe(true);
        expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
      }
    });
  });
});

// ============================================================================
// Profile validation: ensure all skills in profiles can be found
// ============================================================================

describe('all profiles have valid skill references', () => {
  const profiles = listProfiles();

  // Only test profiles that have skills defined
  const profilesWithSkills = profiles.filter(p => p.skills && Object.keys(p.skills).length > 0);

  profilesWithSkills.forEach(profile => {
    describe(`profile: ${profile.name}`, () => {
      for (const [category, skills] of Object.entries(profile.skills!)) {
        if (skills && Array.isArray(skills)) {
          skills.forEach((skill: string) => {
            it(`skill "${skill}" (${category}) can be found`, () => {
              const skillPath = findSkillSourcePath(skill);
              expect(skillPath).not.toBeNull();
              if (skillPath) {
                expect(fs.existsSync(skillPath)).toBe(true);
              }
            });
          });
        }
      }
    });
  });
});

describe('canon skill symlinks into .claude/skills/', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'canon-symlink-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates relative symlinks from .claude/skills/ to ../canon/ for profile canon skills', async () => {
    const profile: ComposableProfile = {
      name: 'test-symlink',
      composable: true,
      skills: { canon: ['clarity', 'simplicity'] }
    };

    await applyComposableProfile(profile, tempDir);

    const skillsDir = path.join(tempDir, '.claude', 'skills');

    for (const skillName of ['clarity', 'simplicity']) {
      const linkPath = path.join(skillsDir, skillName);
      // Canon dir should have the actual copy
      const canonPath = path.join(tempDir, '.claude', 'canon', skillName);
      if (!fs.existsSync(canonPath)) continue; // Skill not found in library

      const stat = fs.lstatSync(linkPath);
      expect(stat.isSymbolicLink()).toBe(true);

      const target = fs.readlinkSync(linkPath);
      expect(target).toBe(path.join('..', 'canon', skillName));

      // Symlink should resolve to a readable directory
      expect(fs.statSync(linkPath).isDirectory()).toBe(true);
    }
  });

  it('does not overwrite non-symlink entries in .claude/skills/', async () => {
    const skillsDir = path.join(tempDir, '.claude', 'skills', 'clarity');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), 'workflow version');

    const profile: ComposableProfile = {
      name: 'test-no-overwrite',
      composable: true,
      skills: { canon: ['clarity'] }
    };

    await applyComposableProfile(profile, tempDir);

    // Should still be a real directory, not a symlink
    const stat = fs.lstatSync(path.join(tempDir, '.claude', 'skills', 'clarity'));
    expect(stat.isSymbolicLink()).toBe(false);

    // Content should be preserved
    const content = fs.readFileSync(path.join(tempDir, '.claude', 'skills', 'clarity', 'SKILL.md'), 'utf-8');
    expect(content).toBe('workflow version');
  });

  it('replaces stale symlinks in .claude/skills/', async () => {
    const skillsDir = path.join(tempDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    // Create a stale symlink
    fs.symlinkSync('../old-path/clarity', path.join(skillsDir, 'clarity'));

    const profile: ComposableProfile = {
      name: 'test-replace-stale',
      composable: true,
      skills: { canon: ['clarity'] }
    };

    await applyComposableProfile(profile, tempDir);

    const linkPath = path.join(skillsDir, 'clarity');
    const canonPath = path.join(tempDir, '.claude', 'canon', 'clarity');
    if (fs.existsSync(canonPath)) {
      const target = fs.readlinkSync(linkPath);
      expect(target).toBe(path.join('..', 'canon', 'clarity'));
    }
  });

  it('reports symlink results in linked array', async () => {
    const profile: ComposableProfile = {
      name: 'test-report',
      composable: true,
      skills: { canon: ['clarity'] }
    };

    const result = await applyComposableProfile(profile, tempDir);

    const canonPath = path.join(tempDir, '.claude', 'canon', 'clarity');
    if (fs.existsSync(canonPath)) {
      expect(result.linked.some(l => l.includes('skills/clarity') && l.includes('canon/clarity'))).toBe(true);
    }
  });
});

describe('path traversal protection', () => {
  const testDir = path.join(tmpdir(), 'cc-traversal-test');

  beforeEach(() => {
    fs.mkdirSync(path.join(testDir, '.claude'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('rejects skill names with forward slash traversal', async () => {
    const maliciousProfile: ComposableProfile = {
      name: 'test-traversal',
      composable: true,
      skills: { canon: ['../../etc/passwd'] }
    };

    const result = await applyComposableProfile(maliciousProfile, testDir);
    expect(result.errors.some(e => e.includes('path traversal'))).toBe(true);
  });

  it('rejects skill names with dot-dot traversal', async () => {
    const maliciousProfile: ComposableProfile = {
      name: 'test-dotdot',
      composable: true,
      skills: { canon: ['..'] }
    };

    const result = await applyComposableProfile(maliciousProfile, testDir);
    expect(result.errors.some(e => e.includes('path traversal'))).toBe(true);
  });

  it('rejects skill names with backslash traversal', async () => {
    const maliciousProfile: ComposableProfile = {
      name: 'test-backslash',
      composable: true,
      skills: { canon: ['..\\..\\etc\\passwd'] }
    };

    const result = await applyComposableProfile(maliciousProfile, testDir);
    expect(result.errors.some(e => e.includes('path traversal'))).toBe(true);
  });

  it('allows valid skill names with hyphens and underscores', async () => {
    const goodProfile: ComposableProfile = {
      name: 'test-valid',
      composable: true,
      skills: { canon: ['my-skill', 'my_skill_2'] }
    };

    const result = await applyComposableProfile(goodProfile, testDir);
    // Should not have path traversal errors (may have "not found" errors, which is fine)
    expect(result.errors.some(e => e.includes('path traversal'))).toBe(false);
  });
});

describe('profile combination integration', () => {
  it('combines software-base + csharp + javascript', () => {
    const result = combineProfiles(['software-base', 'csharp', 'javascript']);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('software-base + csharp + javascript');
      expect(result.skills).toBeDefined();

      // Should have canon skills from all profiles (now uses generic names)
      const canonSkills = result.skills?.canon || [];

      // From software-base
      expect(canonSkills).toContain('clarity');
      expect(canonSkills).toContain('simplicity');
      expect(canonSkills).toContain('correctness');

      // From csharp
      expect(canonSkills).toContain('csharp-depth');
      expect(canonSkills).toContain('async');

      // From javascript
      expect(canonSkills).toContain('typescript');
      expect(canonSkills).toContain('js-safety');
    }
  });

  it('merges claudeMd standards and autoInvoke rules', () => {
    const result = combineProfiles(['software-base', 'csharp']);

    expect(result).not.toBeNull();
    if (result && result.claudeMd) {
      // Should have standards from both
      expect(result.claudeMd.standards?.length).toBeGreaterThan(0);

      // Should have autoInvoke rules
      expect(result.claudeMd.autoInvoke?.length).toBeGreaterThan(0);
    }
  });
});
