/**
 * Qodana Parser Tests
 *
 * Following Hevery: Testing pure functions directly.
 * Following Dodds: Test behavior (parsed SARIF), not implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  parseQodanaSarif,
  formatIssue,
  getQodanaSummary,
} from './qodana.js';
import { QodanaIssue, QodanaResult } from '../types.js';

describe('Qodana Parser', () => {
  describe('parseQodanaSarif', () => {
    it('parses empty SARIF with no runs', () => {
      const sarif = {};

      const result = parseQodanaSarif(sarif);

      expect(result.issues).toHaveLength(0);
      expect(result.critical).toBe(0);
      expect(result.high).toBe(0);
      expect(result.warnings).toBe(0);
    });

    it('parses SARIF with empty runs array', () => {
      const sarif = { runs: [] };

      const result = parseQodanaSarif(sarif);

      expect(result.issues).toHaveLength(0);
    });

    it('parses SARIF with run but no results', () => {
      const sarif = {
        runs: [{ results: [] }],
      };

      const result = parseQodanaSarif(sarif);

      expect(result.issues).toHaveLength(0);
    });

    it('parses single error result', () => {
      const sarif = createSarif([
        {
          ruleId: 'js/unused-variable',
          level: 'error',
          message: { text: 'Unused variable x' },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: 'src/index.ts' },
                region: { startLine: 10 },
              },
            },
          ],
        },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toEqual({
        ruleId: 'js/unused-variable',
        severity: 'critical',
        message: 'Unused variable x',
        file: 'src/index.ts',
        line: 10,
      });
      expect(result.critical).toBe(1);
    });

    it('maps severity levels correctly', () => {
      const sarif = createSarif([
        { ruleId: 'rule1', level: 'error' },
        { ruleId: 'rule2', level: 'warning' },
        { ruleId: 'rule3', level: 'note' },
        { ruleId: 'rule4', level: 'none' },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.issues.find(i => i.ruleId === 'rule1')?.severity).toBe('critical');
      expect(result.issues.find(i => i.ruleId === 'rule2')?.severity).toBe('high');
      expect(result.issues.find(i => i.ruleId === 'rule3')?.severity).toBe('moderate');
      expect(result.issues.find(i => i.ruleId === 'rule4')?.severity).toBe('low');
    });

    it('counts severity categories correctly', () => {
      const sarif = createSarif([
        { ruleId: 'r1', level: 'error' },
        { ruleId: 'r2', level: 'error' },
        { ruleId: 'r3', level: 'warning' },
        { ruleId: 'r4', level: 'note' },
        { ruleId: 'r5', level: 'none' },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.critical).toBe(2);
      expect(result.high).toBe(1);
      expect(result.warnings).toBe(2); // note + none
    });

    it('handles missing location', () => {
      const sarif = createSarif([
        { ruleId: 'rule1', level: 'error', locations: [] },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.issues[0].file).toBe('unknown');
      expect(result.issues[0].line).toBe(0);
    });

    it('handles missing message', () => {
      const sarif = createSarif([
        { ruleId: 'rule1', level: 'error' },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.issues[0].message).toBe('No message');
    });

    it('skips results without ruleId', () => {
      const sarif = createSarif([
        { level: 'error', message: { text: 'No rule id' } },
        { ruleId: 'valid-rule', level: 'error' },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].ruleId).toBe('valid-rule');
    });

    it('handles multiple runs', () => {
      const sarif = {
        runs: [
          { results: [{ ruleId: 'rule1', level: 'error' }] },
          { results: [{ ruleId: 'rule2', level: 'warning' }] },
        ],
      };

      const result = parseQodanaSarif(sarif);

      expect(result.issues).toHaveLength(2);
    });

    it('handles unknown severity level', () => {
      const sarif = createSarif([
        { ruleId: 'rule1', level: 'unknown' },
      ]);

      const result = parseQodanaSarif(sarif);

      // Unknown maps to 'info' via the default
      expect(result.issues[0].severity).toBe('info');
    });

    it('handles missing level', () => {
      const sarif = createSarif([
        { ruleId: 'rule1' },
      ]);

      const result = parseQodanaSarif(sarif);

      // Missing level defaults to 'none' -> 'low'
      expect(result.issues[0].severity).toBe('low');
    });

    it('parses full location details', () => {
      const sarif = createSarif([
        {
          ruleId: 'rule1',
          level: 'warning',
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: 'src/components/Button.tsx' },
                region: { startLine: 42 },
              },
            },
          ],
        },
      ]);

      const result = parseQodanaSarif(sarif);

      expect(result.issues[0].file).toBe('src/components/Button.tsx');
      expect(result.issues[0].line).toBe(42);
    });
  });

  describe('formatIssue', () => {
    it('formats issue as file:line - ruleId: message', () => {
      const issue: QodanaIssue = {
        ruleId: 'js/unused-import',
        severity: 'high',
        message: 'Unused import React',
        file: 'src/App.tsx',
        line: 5,
      };

      expect(formatIssue(issue)).toBe(
        'src/App.tsx:5 - js/unused-import: Unused import React'
      );
    });

    it('handles zero line number', () => {
      const issue: QodanaIssue = {
        ruleId: 'rule1',
        severity: 'moderate',
        message: 'Some issue',
        file: 'unknown',
        line: 0,
      };

      expect(formatIssue(issue)).toBe('unknown:0 - rule1: Some issue');
    });

    it('handles long paths', () => {
      const issue: QodanaIssue = {
        ruleId: 'rule1',
        severity: 'low',
        message: 'Issue',
        file: 'src/very/deep/nested/path/to/Component.tsx',
        line: 100,
      };

      expect(formatIssue(issue)).toContain('src/very/deep/nested/path/to/Component.tsx:100');
    });
  });

  describe('getQodanaSummary', () => {
    it('returns "No issues" for clean result', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 0,
        high: 0,
        warnings: 0,
      };

      expect(getQodanaSummary(result)).toBe('No issues');
    });

    it('includes critical count', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 3,
        high: 0,
        warnings: 0,
      };

      expect(getQodanaSummary(result)).toBe('3 critical');
    });

    it('includes high count', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 0,
        high: 5,
        warnings: 0,
      };

      expect(getQodanaSummary(result)).toBe('5 high');
    });

    it('includes warnings count', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 0,
        high: 0,
        warnings: 10,
      };

      expect(getQodanaSummary(result)).toBe('10 warnings');
    });

    it('combines all counts', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 2,
        high: 5,
        warnings: 8,
      };

      expect(getQodanaSummary(result)).toBe('2 critical, 5 high, 8 warnings');
    });

    it('omits zero counts', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 0,
        high: 3,
        warnings: 0,
      };

      expect(getQodanaSummary(result)).toBe('3 high');
    });

    it('handles only critical and warnings', () => {
      const result: QodanaResult = {
        issues: [],
        critical: 1,
        high: 0,
        warnings: 2,
      };

      expect(getQodanaSummary(result)).toBe('1 critical, 2 warnings');
    });
  });
});

// Helper to create SARIF structure
function createSarif(results: Array<{
  ruleId?: string;
  level?: string;
  message?: { text?: string };
  locations?: Array<{
    physicalLocation?: {
      artifactLocation?: { uri?: string };
      region?: { startLine?: number };
    };
  }>;
}>) {
  return {
    runs: [{ results }],
  };
}
