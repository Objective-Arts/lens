/**
 * Skills Detector Tests
 *
 * Following Hevery: Testing pure functions directly, no mocks needed.
 * Following Dodds: Test behavior (which skills are detected), not implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  detectDynamicSkills,
  mergeSkills,
  getSkillsForStage,
} from './detector.js';

describe('Skills Detector', () => {
  describe('detectDynamicSkills', () => {
    describe('security keywords', () => {
      it('detects security skills for auth keyword', () => {
        // Note: regex uses word boundaries, so "auth" must be a standalone word
        const result = detectDynamicSkills('Implement user auth flow', 'build');

        expect(result.skills).toContain('schneier');
        expect(result.skills).toContain('owasp');
        expect(result.keywords).toContain('auth');
      });

      it('detects security skills for password items', () => {
        const result = detectDynamicSkills('Add password reset flow', 'build');

        expect(result.skills).toContain('security-mindset');
        expect(result.keywords).toContain('password');
      });

      it('detects security skills for token handling', () => {
        const result = detectDynamicSkills('Implement JWT token validation', 'build');

        expect(result.skills).toContain('schneier');
        // 'jwt' matches first in regex, which is the trigger keyword
        expect(result.keywords).toContain('jwt');
      });

      it('detects security skills for encrypt keyword', () => {
        // Uses word boundary - "encrypt" must be standalone
        const result = detectDynamicSkills('Add encrypt function for data', 'build');

        expect(result.skills).toContain('owasp');
        expect(result.keywords).toContain('encrypt');
      });

      it('skips security skills for non-applicable stages', () => {
        const result = detectDynamicSkills('Implement user authentication', 'doc');

        expect(result.skills).not.toContain('schneier');
        expect(result.skills).not.toContain('owasp');
      });
    });

    describe('database keywords', () => {
      it('detects database skills for SQL items', () => {
        const result = detectDynamicSkills('Create SQL migration for users table', 'build');

        expect(result.skills).toContain('bloch');
        expect(result.skills).toContain('schneier');
      });

      it('detects database skills for ORM items', () => {
        const result = detectDynamicSkills('Add Prisma schema for orders', 'build');

        expect(result.skills).toContain('bloch');
      });

      it('detects database skills for mongo items', () => {
        const result = detectDynamicSkills('Setup mongoose models', 'build');

        expect(result.skills).toContain('bloch');
      });
    });

    describe('UI/UX keywords', () => {
      it('detects UI skills for component items', () => {
        const result = detectDynamicSkills('Create modal dialog component', 'build');

        expect(result.skills).toContain('frost');
        expect(result.skills).toContain('norman');
        expect(result.skills).toContain('rams');
      });

      it('detects UI skills for form items', () => {
        const result = detectDynamicSkills('Implement user registration form', 'build');

        expect(result.skills).toContain('ive');
      });

      it('detects UI skills for responsive items', () => {
        const result = detectDynamicSkills('Make layout responsive for mobile', 'build');

        expect(result.skills).toContain('frost');
      });

      it('skips UI skills for non-build stages', () => {
        const result = detectDynamicSkills('Create modal dialog component', 'test');

        expect(result.skills).not.toContain('frost');
        expect(result.skills).not.toContain('norman');
      });
    });

    describe('API keywords', () => {
      it('detects API skills for endpoint items', () => {
        const result = detectDynamicSkills('Create REST API for users', 'build');

        expect(result.skills).toContain('bloch');
      });

      it('detects API skills for GraphQL items', () => {
        const result = detectDynamicSkills('Implement GraphQL resolvers', 'plan');

        expect(result.skills).toContain('bloch');
      });

      it('detects API skills for middleware items', () => {
        const result = detectDynamicSkills('Add rate limiting middleware', 'build');

        expect(result.skills).toContain('bloch');
      });
    });

    describe('testing keywords', () => {
      it('detects testing skills for test items', () => {
        const result = detectDynamicSkills('Write unit tests for auth service', 'test');

        expect(result.skills).toContain('meszaros');
        expect(result.skills).toContain('fowler-test');
        expect(result.skills).toContain('hevery');
        expect(result.skills).toContain('dodds');
      });

      it('detects testing skills for mock items', () => {
        const result = detectDynamicSkills('Create mock fixtures for API', 'test');

        expect(result.skills).toContain('meszaros');
      });

      it('skips testing skills for build stage', () => {
        const result = detectDynamicSkills('Write unit tests for auth service', 'build');

        expect(result.skills).not.toContain('meszaros');
        expect(result.skills).not.toContain('dodds');
      });
    });

    describe('performance keywords', () => {
      it('detects performance skills for optimize keyword', () => {
        const result = detectDynamicSkills('Optimize database queries', 'build');

        expect(result.skills).toContain('carmack');
        expect(result.skills).toContain('knuth');
      });

      it('detects performance skills for cache keyword', () => {
        // "cache" must be a standalone word due to word boundaries
        const result = detectDynamicSkills('Add cache layer for API responses', 'build');

        expect(result.skills).toContain('carmack');
      });
    });

    describe('CLI keywords', () => {
      it('detects CLI skills for command-line items', () => {
        const result = detectDynamicSkills('Add CLI argument parsing', 'build');

        expect(result.skills).toContain('mcilroy');
        expect(result.skills).toContain('pike');
        expect(result.skills).toContain('kernighan');
      });

      it('detects CLI skills for terminal items', () => {
        const result = detectDynamicSkills('Add terminal output colors', 'plan');

        expect(result.skills).toContain('pike');
      });
    });

    describe('documentation keywords', () => {
      it('detects doc skills for document keyword', () => {
        // "document" must be a standalone word
        const result = detectDynamicSkills('Add API document files', 'doc');

        expect(result.skills).toContain('strunk-white');
        expect(result.skills).toContain('zinsser');
      });

      it('detects doc skills for readme keyword', () => {
        const result = detectDynamicSkills('Update readme with usage', 'doc');

        expect(result.skills).toContain('strunk-white');
      });

      it('skips doc skills for build stage', () => {
        const result = detectDynamicSkills('Add API document files', 'build');

        expect(result.skills).not.toContain('strunk-white');
        expect(result.skills).not.toContain('zinsser');
      });
    });

    describe('data visualization keywords', () => {
      it('detects viz skills for chart items', () => {
        const result = detectDynamicSkills('Create sales chart component', 'build');

        expect(result.skills).toContain('tufte');
        expect(result.skills).toContain('few');
        expect(result.skills).toContain('knaflic');
      });

      it('detects viz skills for D3 items', () => {
        const result = detectDynamicSkills('Implement D3 bar chart', 'build');

        expect(result.skills).toContain('tufte');
      });

      it('detects viz skills for dashboard items', () => {
        const result = detectDynamicSkills('Build analytics dashboard', 'build');

        expect(result.skills).toContain('few');
      });
    });

    describe('React keywords', () => {
      it('detects React skills for component items', () => {
        const result = detectDynamicSkills('Create React component for user profile', 'build');

        expect(result.skills).toContain('abramov');
        expect(result.skills).toContain('dodds');
      });

      it('detects React skills for hook items', () => {
        const result = detectDynamicSkills('Implement custom useAuth hook', 'build');

        expect(result.skills).toContain('abramov');
      });

      it('detects React skills for state management', () => {
        const result = detectDynamicSkills('Add Redux state for cart', 'build');

        expect(result.skills).toContain('abramov');
      });
    });

    describe('edge cases', () => {
      it('returns empty arrays for unmatched text', () => {
        const result = detectDynamicSkills('Do something generic', 'build');

        expect(result.skills).toEqual([]);
        expect(result.keywords).toEqual([]);
      });

      it('returns empty arrays for empty text', () => {
        const result = detectDynamicSkills('', 'build');

        expect(result.skills).toEqual([]);
        expect(result.keywords).toEqual([]);
      });

      it('handles multiple keyword categories', () => {
        // Use exact keyword matches due to word boundaries
        const result = detectDynamicSkills(
          'Create React component with auth and API endpoint',
          'build'
        );

        // Should detect React, Security, and API skills
        expect(result.skills).toContain('abramov'); // React
        expect(result.skills).toContain('schneier'); // Security (from 'auth')
        expect(result.skills).toContain('bloch'); // API
        // Should capture matched keywords
        expect(result.keywords).toContain('auth');
        expect(result.keywords).toContain('api');
      });

      it('deduplicates skills across rules', () => {
        // 'bloch' appears in both database and API rules
        const result = detectDynamicSkills(
          'Create API endpoint with database query',
          'build'
        );

        const blochCount = result.skills.filter(s => s === 'bloch').length;
        expect(blochCount).toBe(1);
      });

      it('is case insensitive', () => {
        const resultLower = detectDynamicSkills('implement jwt auth', 'build');
        const resultUpper = detectDynamicSkills('IMPLEMENT JWT AUTH', 'build');

        expect(resultLower.skills).toEqual(resultUpper.skills);
      });
    });
  });

  describe('mergeSkills', () => {
    it('returns profile skills when no dynamic skills', () => {
      const result = mergeSkills(['skill1', 'skill2'], []);

      expect(result).toEqual(['skill1', 'skill2']);
    });

    it('returns dynamic skills when no profile skills', () => {
      const result = mergeSkills([], ['dynamic1', 'dynamic2']);

      expect(result).toEqual(['dynamic1', 'dynamic2']);
    });

    it('merges both skill sets', () => {
      const result = mergeSkills(['profile1'], ['dynamic1']);

      expect(result).toContain('profile1');
      expect(result).toContain('dynamic1');
    });

    it('deduplicates overlapping skills', () => {
      const result = mergeSkills(['shared', 'profile1'], ['shared', 'dynamic1']);

      const sharedCount = result.filter(s => s === 'shared').length;
      expect(sharedCount).toBe(1);
      expect(result).toHaveLength(3);
    });

    it('preserves order with profile skills first', () => {
      const result = mergeSkills(['z-profile', 'a-profile'], ['m-dynamic']);

      // Since Set maintains insertion order, profile skills come first
      expect(result[0]).toBe('z-profile');
      expect(result[1]).toBe('a-profile');
      expect(result[2]).toBe('m-dynamic');
    });

    it('handles empty arrays', () => {
      const result = mergeSkills([], []);

      expect(result).toEqual([]);
    });
  });

  describe('getSkillsForStage', () => {
    it('combines profile skills with detected skills', () => {
      // Use 'auth' as standalone word for detection
      const result = getSkillsForStage(
        ['existing-skill'],
        'Implement user auth flow',
        'build'
      );

      expect(result.skills).toContain('existing-skill');
      expect(result.skills).toContain('schneier'); // Detected from 'auth'
      expect(result.keywords).toContain('auth');
    });

    it('returns only profile skills when no keywords match', () => {
      const result = getSkillsForStage(
        ['profile-skill'],
        'Generic task description',
        'build'
      );

      expect(result.skills).toEqual(['profile-skill']);
      expect(result.keywords).toEqual([]);
    });

    it('returns only detected skills when no profile skills', () => {
      // Use 'auth' as standalone word
      const result = getSkillsForStage(
        [],
        'Implement user auth flow',
        'build'
      );

      expect(result.skills).toContain('schneier');
      expect(result.skills.length).toBeGreaterThan(0);
    });

    it('respects stage filtering for detected skills', () => {
      // 'test' keyword triggers testing skills only in test stage
      const buildResult = getSkillsForStage(
        [],
        'Write unit test for auth',
        'build'
      );

      const testResult = getSkillsForStage(
        [],
        'Write unit test for auth',
        'test'
      );

      // Testing skills only detected in 'test' stage
      expect(buildResult.skills).not.toContain('dodds');
      expect(testResult.skills).toContain('dodds');
    });
  });
});
