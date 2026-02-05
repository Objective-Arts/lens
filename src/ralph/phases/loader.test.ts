/**
 * Phase Loader Tests
 *
 * Following meszaros: clear arrange-act-assert.
 * Following dodds: realistic scenarios, test behavior not implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadPhaseConfig,
  getPhaseExperts,
  getRalphSequence,
  loadKeywordRules,
  detectExperts,
  clearPhaseLoaderCaches,
  hasCustomPhaseConfig,
  hasCustomKeywordRules,
} from './loader.js';

const TEST_DIR = '/tmp/phase-loader-test';
const CONFIG_DIR = path.join(TEST_DIR, 'config');
const PHASES_FILE = path.join(CONFIG_DIR, 'workflow-phases.yaml');
const KEYWORDS_FILE = path.join(CONFIG_DIR, 'keyword-detection.yaml');

describe('Phase Loader', () => {
  beforeEach(() => {
    clearPhaseLoaderCaches();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    clearPhaseLoaderCaches();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('loadPhaseConfig', () => {
    it('returns default config when no YAML file exists', () => {
      const config = loadPhaseConfig(TEST_DIR);

      expect(config.phases).toBeDefined();
      expect(config.phases.plan).toBeDefined();
      expect(config.phases['structure-first']).toBeDefined();
      expect(config['ralph-sequence']).toHaveLength(8);
    });

    it('parses valid workflow-phases.yaml', () => {
      const yamlContent = `
phases:
  plan:
    description: Test plan
    experts:
      - kernighan
      - pike
  structure-first:
    description: Test structure
    experts:
      - linus
ralph-sequence:
  - plan
  - structure-first
`;
      fs.writeFileSync(PHASES_FILE, yamlContent);

      const config = loadPhaseConfig(TEST_DIR);

      expect(config.phases.plan.experts).toContain('kernighan');
      expect(config.phases.plan.experts).toContain('pike');
      expect(config.phases['structure-first'].experts).toContain('linus');
    });

    it('uses defaults for invalid YAML', () => {
      fs.writeFileSync(PHASES_FILE, 'not: valid: yaml: [[[');

      const config = loadPhaseConfig(TEST_DIR);

      // Should fall back to defaults
      expect(config.phases.plan).toBeDefined();
      expect(config['ralph-sequence']).toHaveLength(8);
    });

    it('caches loaded config', () => {
      const yamlContent = `
phases:
  plan:
    description: Test
    experts: [test-expert]
ralph-sequence: [plan]
`;
      fs.writeFileSync(PHASES_FILE, yamlContent);

      const config1 = loadPhaseConfig(TEST_DIR);
      const config2 = loadPhaseConfig(TEST_DIR);

      expect(config1).toBe(config2);
    });
  });

  describe('getPhaseExperts', () => {
    it('returns experts for a phase', () => {
      const experts = getPhaseExperts(TEST_DIR, 'plan');

      // Uses generic names now (not tribute names)
      expect(experts).toContain('clarity');
      expect(experts).toContain('simplicity');
    });

    it('returns empty array for unknown phase', () => {
      const experts = getPhaseExperts(TEST_DIR, 'unknown' as any);

      expect(experts).toEqual([]);
    });
  });

  describe('getRalphSequence', () => {
    it('returns 8-phase sequence', () => {
      const sequence = getRalphSequence(TEST_DIR);

      expect(sequence).toHaveLength(8);
      expect(sequence[0]).toBe('plan');
      expect(sequence[1]).toBe('structure-first');
      expect(sequence[7]).toBe('doc-code');
    });
  });

  describe('loadKeywordRules', () => {
    it('returns default rules when no YAML file exists', () => {
      const rules = loadKeywordRules(TEST_DIR);

      expect(rules.length).toBeGreaterThan(0);
    });

    it('parses valid keyword-detection.yaml', () => {
      const yamlContent = `
rules:
  security:
    patterns:
      - auth
      - password
    experts:
      - security-mindset
      - owasp
`;
      fs.writeFileSync(KEYWORDS_FILE, yamlContent);

      const rules = loadKeywordRules(TEST_DIR);

      expect(rules.length).toBe(1);
      expect(rules[0].category).toBe('security');
      expect(rules[0].experts).toContain('security-mindset');
      expect(rules[0].pattern.test('auth')).toBe(true);
    });

    it('handles multi-word patterns', () => {
      const yamlContent = `
rules:
  algo:
    patterns:
      - binary search
      - linked list
    experts:
      - knuth
`;
      fs.writeFileSync(KEYWORDS_FILE, yamlContent);

      const rules = loadKeywordRules(TEST_DIR);

      expect(rules[0].pattern.test('binary search')).toBe(true);
      expect(rules[0].pattern.test('binary-search')).toBe(true);
      expect(rules[0].pattern.test('linked list')).toBe(true);
    });

    it('skips rules with missing patterns', () => {
      const yamlContent = `
rules:
  valid:
    patterns: [valid]
    experts: [expert]
  invalid:
    experts: [expert]
`;
      fs.writeFileSync(KEYWORDS_FILE, yamlContent);

      const rules = loadKeywordRules(TEST_DIR);

      expect(rules.length).toBe(1);
      expect(rules[0].category).toBe('valid');
    });
  });

  describe('detectExperts', () => {
    it('combines phase experts with keyword-detected experts', () => {
      const result = detectExperts(TEST_DIR, 'plan', 'Add JWT authentication');

      // Should include phase experts (uses generic names now)
      expect(result.experts).toContain('clarity');

      // Should include keyword-detected experts (jwt/auth → security)
      expect(result.experts).toContain('security-mindset');
    });

    it('includes profile experts when provided', () => {
      const result = detectExperts(TEST_DIR, 'plan', 'simple task', ['custom-expert']);

      expect(result.experts).toContain('custom-expert');
      expect(result.sources['custom-expert']).toBe('profile');
    });

    it('tracks matched keywords', () => {
      const result = detectExperts(TEST_DIR, 'implement', 'optimize performance');

      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('deduplicates experts from multiple sources', () => {
      // clarity appears in plan phase - should only appear once
      const result = detectExperts(TEST_DIR, 'plan', 'some task');

      const clarityCount = result.experts.filter(e => e === 'clarity').length;
      expect(clarityCount).toBe(1);
    });

    it('tracks source of each expert', () => {
      const result = detectExperts(TEST_DIR, 'independent-review', 'check auth security');

      // security-mindset is triggered by 'auth' keyword
      expect(result.sources['security-mindset']).toBeDefined();
    });
  });

  describe('hasCustomPhaseConfig', () => {
    it('returns false when no file exists', () => {
      expect(hasCustomPhaseConfig(TEST_DIR)).toBe(false);
    });

    it('returns true when file exists', () => {
      fs.writeFileSync(PHASES_FILE, 'phases: {}');

      expect(hasCustomPhaseConfig(TEST_DIR)).toBe(true);
    });
  });

  describe('hasCustomKeywordRules', () => {
    it('returns false when no file exists', () => {
      expect(hasCustomKeywordRules(TEST_DIR)).toBe(false);
    });

    it('returns true when file exists', () => {
      fs.writeFileSync(KEYWORDS_FILE, 'rules: {}');

      expect(hasCustomKeywordRules(TEST_DIR)).toBe(true);
    });
  });

  describe('clearPhaseLoaderCaches', () => {
    it('clears cache so config is reloaded', () => {
      const yamlContent1 = `
phases:
  plan:
    description: First
    experts: [first-expert]
ralph-sequence: [plan]
`;
      fs.writeFileSync(PHASES_FILE, yamlContent1);
      const config1 = loadPhaseConfig(TEST_DIR);

      // Modify file
      const yamlContent2 = `
phases:
  plan:
    description: Second
    experts: [second-expert]
ralph-sequence: [plan]
`;
      fs.writeFileSync(PHASES_FILE, yamlContent2);

      // Without clearing, should return cached
      const configCached = loadPhaseConfig(TEST_DIR);
      expect(configCached).toBe(config1);

      // After clearing, should reload
      clearPhaseLoaderCaches();
      const config2 = loadPhaseConfig(TEST_DIR);
      expect(config2).not.toBe(config1);
      expect(config2.phases.plan.experts).toContain('second-expert');
    });
  });
});
