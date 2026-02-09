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
  applyComposableProfile,
  PHASE_CONFIG_SOURCE_DIR
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

describe('applyComposableProfile - config deployment', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'profile-apply-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('places config files in .claude/config/, not project root', async () => {
    // Create a profile that triggers phase config copy
    const profile: ComposableProfile = {
      name: 'test-ralph',
      ralph: {
        max_iterations: 10
      }
    };

    const _result = await applyComposableProfile(profile, tempDir);

    // Config should be in .claude/config/, not ./config/
    const correctPath = path.join(tempDir, '.claude', 'config');
    const wrongPath = path.join(tempDir, 'config');

    // Should NOT create config/ at project root
    expect(fs.existsSync(wrongPath)).toBe(false);

    // If source files exist, should create .claude/config/
    if (fs.existsSync(PHASE_CONFIG_SOURCE_DIR)) {
      expect(fs.existsSync(correctPath)).toBe(true);
      // Check for expected files
      const expectedFiles = ['workflow-phases.yaml', 'keyword-detection.yaml'];
      for (const file of expectedFiles) {
        const srcExists = fs.existsSync(path.join(PHASE_CONFIG_SOURCE_DIR, file));
        if (srcExists) {
          expect(fs.existsSync(path.join(correctPath, file))).toBe(true);
        }
      }
    }
  });

  it('reports config files with .claude/config/ path in result', async () => {
    const profile: ComposableProfile = {
      name: 'test-ralph',
      ralph: {
        max_iterations: 10
      }
    };

    const result = await applyComposableProfile(profile, tempDir);

    // Any created config files should show .claude/config/ path
    const configCreated = result.created.filter(c => c.includes('config/'));
    for (const item of configCreated) {
      expect(item).toContain('.claude/config/');
      expect(item).not.toMatch(/^config\//); // Should not be just "config/"
    }
  });

  it('skips config copy when already exists in .claude/config/', async () => {
    // Pre-create the config dir and a file
    const configDir = path.join(tempDir, '.claude', 'config');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'workflow-phases.yaml'), 'existing: true');

    const profile: ComposableProfile = {
      name: 'test-ralph',
      ralph: { max_iterations: 10 }
    };

    const result = await applyComposableProfile(profile, tempDir);

    // Should skip existing file
    const skipped = result.skipped.filter(s => s.includes('workflow-phases.yaml'));
    if (fs.existsSync(PHASE_CONFIG_SOURCE_DIR)) {
      expect(skipped.length).toBeGreaterThan(0);
      expect(skipped[0]).toContain('.claude/config/');
    }

    // Content should be unchanged (not overwritten)
    const content = fs.readFileSync(path.join(configDir, 'workflow-phases.yaml'), 'utf-8');
    expect(content).toBe('existing: true');
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
  it('combines software-base + csharp + javascript + ralph-integration', () => {
    const result = combineProfiles(['software-base', 'csharp', 'javascript', 'ralph-integration']);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.name).toBe('software-base + csharp + javascript + ralph-integration');
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
