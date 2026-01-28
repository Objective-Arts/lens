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
        const skills = detectDynamicSkills('Implement user auth flow', 'build');

        expect(skills).toContain('schneier');
        expect(skills).toContain('owasp');
      });

      it('detects security skills for password items', () => {
        const skills = detectDynamicSkills('Add password reset flow', 'build');

        expect(skills).toContain('security-mindset');
      });

      it('detects security skills for token handling', () => {
        const skills = detectDynamicSkills('Implement JWT token validation', 'build');

        expect(skills).toContain('schneier');
      });

      it('detects security skills for encrypt keyword', () => {
        // Uses word boundary - "encrypt" must be standalone
        const skills = detectDynamicSkills('Add encrypt function for data', 'build');

        expect(skills).toContain('owasp');
      });

      it('skips security skills for non-applicable stages', () => {
        const skills = detectDynamicSkills('Implement user authentication', 'doc');

        expect(skills).not.toContain('schneier');
        expect(skills).not.toContain('owasp');
      });
    });

    describe('database keywords', () => {
      it('detects database skills for SQL items', () => {
        const skills = detectDynamicSkills('Create SQL migration for users table', 'build');

        expect(skills).toContain('bloch');
        expect(skills).toContain('schneier');
      });

      it('detects database skills for ORM items', () => {
        const skills = detectDynamicSkills('Add Prisma schema for orders', 'build');

        expect(skills).toContain('bloch');
      });

      it('detects database skills for mongo items', () => {
        const skills = detectDynamicSkills('Setup mongoose models', 'build');

        expect(skills).toContain('bloch');
      });
    });

    describe('UI/UX keywords', () => {
      it('detects UI skills for component items', () => {
        const skills = detectDynamicSkills('Create modal dialog component', 'build');

        expect(skills).toContain('frost');
        expect(skills).toContain('norman');
        expect(skills).toContain('rams');
      });

      it('detects UI skills for form items', () => {
        const skills = detectDynamicSkills('Implement user registration form', 'build');

        expect(skills).toContain('ive');
      });

      it('detects UI skills for responsive items', () => {
        const skills = detectDynamicSkills('Make layout responsive for mobile', 'build');

        expect(skills).toContain('frost');
      });

      it('skips UI skills for non-build stages', () => {
        const skills = detectDynamicSkills('Create modal dialog component', 'test');

        expect(skills).not.toContain('frost');
        expect(skills).not.toContain('norman');
      });
    });

    describe('API keywords', () => {
      it('detects API skills for endpoint items', () => {
        const skills = detectDynamicSkills('Create REST API for users', 'build');

        expect(skills).toContain('bloch');
      });

      it('detects API skills for GraphQL items', () => {
        const skills = detectDynamicSkills('Implement GraphQL resolvers', 'plan');

        expect(skills).toContain('bloch');
      });

      it('detects API skills for middleware items', () => {
        const skills = detectDynamicSkills('Add rate limiting middleware', 'build');

        expect(skills).toContain('bloch');
      });
    });

    describe('testing keywords', () => {
      it('detects testing skills for test items', () => {
        const skills = detectDynamicSkills('Write unit tests for auth service', 'test');

        expect(skills).toContain('meszaros');
        expect(skills).toContain('fowler-test');
        expect(skills).toContain('hevery');
        expect(skills).toContain('dodds');
      });

      it('detects testing skills for mock items', () => {
        const skills = detectDynamicSkills('Create mock fixtures for API', 'test');

        expect(skills).toContain('meszaros');
      });

      it('skips testing skills for build stage', () => {
        const skills = detectDynamicSkills('Write unit tests for auth service', 'build');

        expect(skills).not.toContain('meszaros');
        expect(skills).not.toContain('dodds');
      });
    });

    describe('performance keywords', () => {
      it('detects performance skills for optimize keyword', () => {
        const skills = detectDynamicSkills('Optimize database queries', 'build');

        expect(skills).toContain('carmack');
        expect(skills).toContain('knuth');
      });

      it('detects performance skills for cache keyword', () => {
        // "cache" must be a standalone word due to word boundaries
        const skills = detectDynamicSkills('Add cache layer for API responses', 'build');

        expect(skills).toContain('carmack');
      });
    });

    describe('CLI keywords', () => {
      it('detects CLI skills for command-line items', () => {
        const skills = detectDynamicSkills('Add CLI argument parsing', 'build');

        expect(skills).toContain('mcilroy');
        expect(skills).toContain('pike');
        expect(skills).toContain('kernighan');
      });

      it('detects CLI skills for terminal items', () => {
        const skills = detectDynamicSkills('Add terminal output colors', 'plan');

        expect(skills).toContain('pike');
      });
    });

    describe('documentation keywords', () => {
      it('detects doc skills for document keyword', () => {
        // "document" must be a standalone word
        const skills = detectDynamicSkills('Add API document files', 'doc');

        expect(skills).toContain('strunk-white');
        expect(skills).toContain('zinsser');
      });

      it('detects doc skills for readme keyword', () => {
        const skills = detectDynamicSkills('Update readme with usage', 'doc');

        expect(skills).toContain('strunk-white');
      });

      it('skips doc skills for build stage', () => {
        const skills = detectDynamicSkills('Add API document files', 'build');

        expect(skills).not.toContain('strunk-white');
        expect(skills).not.toContain('zinsser');
      });
    });

    describe('data visualization keywords', () => {
      it('detects viz skills for chart items', () => {
        const skills = detectDynamicSkills('Create sales chart component', 'build');

        expect(skills).toContain('tufte');
        expect(skills).toContain('few');
        expect(skills).toContain('knaflic');
      });

      it('detects viz skills for D3 items', () => {
        const skills = detectDynamicSkills('Implement D3 bar chart', 'build');

        expect(skills).toContain('tufte');
      });

      it('detects viz skills for dashboard items', () => {
        const skills = detectDynamicSkills('Build analytics dashboard', 'build');

        expect(skills).toContain('few');
      });
    });

    describe('React keywords', () => {
      it('detects React skills for component items', () => {
        const skills = detectDynamicSkills('Create React component for user profile', 'build');

        expect(skills).toContain('abramov');
        expect(skills).toContain('dodds');
      });

      it('detects React skills for hook items', () => {
        const skills = detectDynamicSkills('Implement custom useAuth hook', 'build');

        expect(skills).toContain('abramov');
      });

      it('detects React skills for state management', () => {
        const skills = detectDynamicSkills('Add Redux state for cart', 'build');

        expect(skills).toContain('abramov');
      });
    });

    describe('edge cases', () => {
      it('returns empty array for unmatched text', () => {
        const skills = detectDynamicSkills('Do something generic', 'build');

        expect(skills).toEqual([]);
      });

      it('returns empty array for empty text', () => {
        const skills = detectDynamicSkills('', 'build');

        expect(skills).toEqual([]);
      });

      it('handles multiple keyword categories', () => {
        // Use exact keyword matches due to word boundaries
        const skills = detectDynamicSkills(
          'Create React component with auth and API endpoint',
          'build'
        );

        // Should detect React, Security, and API skills
        expect(skills).toContain('abramov'); // React
        expect(skills).toContain('schneier'); // Security (from 'auth')
        expect(skills).toContain('bloch'); // API
      });

      it('deduplicates skills across rules', () => {
        // 'bloch' appears in both database and API rules
        const skills = detectDynamicSkills(
          'Create API endpoint with database query',
          'build'
        );

        const blochCount = skills.filter(s => s === 'bloch').length;
        expect(blochCount).toBe(1);
      });

      it('is case insensitive', () => {
        const skillsLower = detectDynamicSkills('implement jwt auth', 'build');
        const skillsUpper = detectDynamicSkills('IMPLEMENT JWT AUTH', 'build');

        expect(skillsLower).toEqual(skillsUpper);
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

      expect(result).toContain('existing-skill');
      expect(result).toContain('schneier'); // Detected from 'auth'
    });

    it('returns only profile skills when no keywords match', () => {
      const result = getSkillsForStage(
        ['profile-skill'],
        'Generic task description',
        'build'
      );

      expect(result).toEqual(['profile-skill']);
    });

    it('returns only detected skills when no profile skills', () => {
      // Use 'auth' as standalone word
      const result = getSkillsForStage(
        [],
        'Implement user auth flow',
        'build'
      );

      expect(result).toContain('schneier');
      expect(result.length).toBeGreaterThan(0);
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
      expect(buildResult).not.toContain('dodds');
      expect(testResult).toContain('dodds');
    });
  });
});
