/**
 * Rules Loader Tests
 *
 * Following Hevery: Testing behavior, not implementation.
 * Following Dodds: Realistic scenarios, minimal mocking.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadSkillRules,
  getDefaultRules,
  clearRulesCache,
  hasCustomRules,
} from './rules-loader.js';

const TEST_DIR = '/tmp/rules-loader-test';
const CONFIG_DIR = path.join(TEST_DIR, 'config');
const RULES_FILE = path.join(CONFIG_DIR, 'skill-rules.yaml');

describe('Rules Loader', () => {
  beforeEach(() => {
    clearRulesCache();
    // Clean test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    clearRulesCache();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('getDefaultRules', () => {
    it('returns non-empty array of rules', () => {
      const rules = getDefaultRules();

      expect(rules.length).toBeGreaterThan(0);
    });

    it('each rule has required fields', () => {
      const rules = getDefaultRules();

      for (const rule of rules) {
        expect(rule.keywords).toBeInstanceOf(RegExp);
        expect(Array.isArray(rule.skills)).toBe(true);
        expect(rule.skills.length).toBeGreaterThan(0);
      }
    });

    it('includes security rules', () => {
      const rules = getDefaultRules();
      const securityRule = rules.find(r => r.skills.includes('schneier'));

      expect(securityRule).toBeDefined();
      // Test against actual keywords in default rules (word boundaries apply)
      expect(securityRule?.keywords.test('auth')).toBe(true);
      expect(securityRule?.keywords.test('password')).toBe(true);
      expect(securityRule?.keywords.test('jwt')).toBe(true);
    });
  });

  describe('loadSkillRules', () => {
    it('returns default rules when no YAML file exists', () => {
      const rules = loadSkillRules(TEST_DIR);
      const defaults = getDefaultRules();

      expect(rules.length).toBe(defaults.length);
    });

    it('parses valid YAML rules file', () => {
      const yamlContent = `
rules:
  custom:
    patterns:
      - custom-keyword
      - another-word
    skills:
      - custom-skill
    stages:
      - build
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules = loadSkillRules(TEST_DIR);

      expect(rules.length).toBe(1);
      expect(rules[0].skills).toContain('custom-skill');
      expect(rules[0].keywords.test('custom-keyword')).toBe(true);
    });

    it('handles multi-word patterns', () => {
      const yamlContent = `
rules:
  algorithms:
    patterns:
      - binary search
      - linked list
    skills:
      - knuth
    stages:
      - build
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules = loadSkillRules(TEST_DIR);

      expect(rules[0].keywords.test('binary search')).toBe(true);
      expect(rules[0].keywords.test('binary-search')).toBe(true);
      expect(rules[0].keywords.test('linked list')).toBe(true);
    });

    it('handles special regex characters in patterns', () => {
      const yamlContent = `
rules:
  complexity:
    patterns:
      - O(
      - O(n)
    skills:
      - knuth
    stages:
      - review
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules = loadSkillRules(TEST_DIR);

      expect(rules[0].keywords.test('O(n log n)')).toBe(true);
      expect(rules[0].keywords.test('O(1)')).toBe(true);
    });

    it('validates stage names', () => {
      const yamlContent = `
rules:
  test:
    patterns:
      - keyword
    skills:
      - skill
    stages:
      - build
      - invalid-stage
      - review
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules = loadSkillRules(TEST_DIR);

      expect(rules[0].stages).toContain('build');
      expect(rules[0].stages).toContain('review');
      expect(rules[0].stages).not.toContain('invalid-stage');
    });

    it('caches loaded rules', () => {
      const yamlContent = `
rules:
  cached:
    patterns: [cached]
    skills: [cached-skill]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules1 = loadSkillRules(TEST_DIR);
      const rules2 = loadSkillRules(TEST_DIR);

      // Same reference means cache was used
      expect(rules1).toBe(rules2);
    });

    it('uses defaults for invalid YAML', () => {
      fs.writeFileSync(RULES_FILE, 'not: valid: yaml: [[[');

      const rules = loadSkillRules(TEST_DIR);
      const defaults = getDefaultRules();

      expect(rules.length).toBe(defaults.length);
    });

    it('uses defaults for missing rules object', () => {
      fs.writeFileSync(RULES_FILE, 'something: else');

      const rules = loadSkillRules(TEST_DIR);
      const defaults = getDefaultRules();

      expect(rules.length).toBe(defaults.length);
    });

    it('skips rules with missing patterns', () => {
      const yamlContent = `
rules:
  valid:
    patterns: [valid]
    skills: [valid-skill]
    stages: [build]
  invalid:
    skills: [invalid-skill]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules = loadSkillRules(TEST_DIR);

      expect(rules.length).toBe(1);
      expect(rules[0].skills).toContain('valid-skill');
    });

    it('skips rules with missing skills', () => {
      const yamlContent = `
rules:
  valid:
    patterns: [valid]
    skills: [valid-skill]
    stages: [build]
  invalid:
    patterns: [invalid]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent);

      const rules = loadSkillRules(TEST_DIR);

      expect(rules.length).toBe(1);
    });
  });

  describe('clearRulesCache', () => {
    it('clears the cache so rules are reloaded', () => {
      const yamlContent1 = `
rules:
  first:
    patterns: [first]
    skills: [first-skill]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent1);
      const rules1 = loadSkillRules(TEST_DIR);

      // Modify file
      const yamlContent2 = `
rules:
  second:
    patterns: [second]
    skills: [second-skill]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent2);

      // Without clearing, should still return cached
      const rulesCached = loadSkillRules(TEST_DIR);
      expect(rulesCached).toBe(rules1);

      // After clearing, should reload
      clearRulesCache();
      const rules2 = loadSkillRules(TEST_DIR);
      expect(rules2).not.toBe(rules1);
      expect(rules2[0].skills).toContain('second-skill');
    });
  });

  describe('hasCustomRules', () => {
    it('returns false when no rules file exists', () => {
      expect(hasCustomRules(TEST_DIR)).toBe(false);
    });

    it('returns true when rules file exists', () => {
      fs.writeFileSync(RULES_FILE, 'rules: {}');

      expect(hasCustomRules(TEST_DIR)).toBe(true);
    });
  });

  describe('pattern matching behavior', () => {
    it('matches case-insensitively', () => {
      const yamlContent = `
rules:
  auth:
    patterns: [auth, JWT]
    skills: [security]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent);
      const rules = loadSkillRules(TEST_DIR);

      expect(rules[0].keywords.test('AUTH')).toBe(true);
      expect(rules[0].keywords.test('jwt')).toBe(true);
      expect(rules[0].keywords.test('Jwt')).toBe(true);
    });

    it('uses word boundaries', () => {
      const yamlContent = `
rules:
  test:
    patterns: [test]
    skills: [tester]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent);
      const rules = loadSkillRules(TEST_DIR);

      expect(rules[0].keywords.test('test')).toBe(true);
      expect(rules[0].keywords.test('testing')).toBe(false);
      expect(rules[0].keywords.test('retest')).toBe(false);
    });

    it('longer patterns match before shorter ones', () => {
      const yamlContent = `
rules:
  auth:
    patterns:
      - auth
      - authentication
    skills: [security]
    stages: [build]
`;
      fs.writeFileSync(RULES_FILE, yamlContent);
      const rules = loadSkillRules(TEST_DIR);

      const match = 'implement authentication flow'.match(rules[0].keywords);
      expect(match?.[0]).toBe('authentication');
    });
  });
});
