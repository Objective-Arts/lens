/**
 * Gemini Parser Tests
 *
 * Following testability: Testing pure functions directly.
 * Following react-test: Test behavior (parsed results), not implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  parseGeminiOutput,
  isValidGeminiOutput,
  getGeminiSummary,
} from './gemini.js';

describe('Gemini Parser', () => {
  describe('parseGeminiOutput', () => {
    it('parses all metrics from plain text', () => {
      const raw = `Review complete.
GEMINI_ISSUES: 5
CRITICAL_HIGH: 2
ISSUES_FIXED: 3
SECURITY_REVIEW_COMPLETE: yes`;

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(5);
      expect(result.criticalHigh).toBe(2);
      expect(result.issuesFixed).toBe(3);
      expect(result.verifiedClean).toBe(true);
      expect(result.raw).toBe(raw);
    });

    it('parses metrics with markdown bold format', () => {
      const raw = `**GEMINI_ISSUES:** 10
**CRITICAL_HIGH:** 1
**ISSUES_FIXED:** 8
**SECURITY_REVIEW_COMPLETE:** true`;

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(10);
      expect(result.criticalHigh).toBe(1);
      expect(result.issuesFixed).toBe(8);
      expect(result.verifiedClean).toBe(true);
    });

    it('handles missing metrics with defaults', () => {
      const raw = 'GEMINI_ISSUES: 3';

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(3);
      expect(result.criticalHigh).toBe(0);
      expect(result.issuesFixed).toBe(0);
      expect(result.verifiedClean).toBe(false);
    });

    it('handles empty input', () => {
      const result = parseGeminiOutput('');

      expect(result.totalIssues).toBe(0);
      expect(result.criticalHigh).toBe(0);
      expect(result.issuesFixed).toBe(0);
      expect(result.verifiedClean).toBe(false);
    });

    it('parses SECURITY_REVIEW_COMPLETE: no as false', () => {
      const raw = 'SECURITY_REVIEW_COMPLETE: no';

      const result = parseGeminiOutput(raw);

      expect(result.verifiedClean).toBe(false);
    });

    it('parses SECURITY_REVIEW_COMPLETE: false as false', () => {
      const raw = 'SECURITY_REVIEW_COMPLETE: false';

      const result = parseGeminiOutput(raw);

      expect(result.verifiedClean).toBe(false);
    });

    it('is case insensitive for keywords', () => {
      const raw = `gemini_issues: 7
critical_high: 2
security_review_complete: YES`;

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(7);
      expect(result.criticalHigh).toBe(2);
      expect(result.verifiedClean).toBe(true);
    });

    it('handles metrics mixed with other text', () => {
      const raw = `Code Review Summary
===================
Found some issues during the review.

GEMINI_ISSUES: 4

The main problems were:
- Missing error handling
- No input validation

CRITICAL_HIGH: 1

Recommendations provided below.`;

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(4);
      expect(result.criticalHigh).toBe(1);
    });

    it('preserves raw content unchanged', () => {
      const raw = 'Original content\nGEMINI_ISSUES: 1';

      const result = parseGeminiOutput(raw);

      expect(result.raw).toBe(raw);
    });

    it('handles zero values', () => {
      const raw = `GEMINI_ISSUES: 0
CRITICAL_HIGH: 0
ISSUES_FIXED: 0`;

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(0);
      expect(result.criticalHigh).toBe(0);
      expect(result.issuesFixed).toBe(0);
    });

    it('handles large numbers', () => {
      const raw = 'GEMINI_ISSUES: 999';

      const result = parseGeminiOutput(raw);

      expect(result.totalIssues).toBe(999);
    });
  });

  describe('isValidGeminiOutput', () => {
    it('returns true for REVIEW_COMPLETE marker', () => {
      expect(isValidGeminiOutput('REVIEW_COMPLETE')).toBe(true);
    });

    it('returns true for GEMINI_ISSUES marker', () => {
      expect(isValidGeminiOutput('GEMINI_ISSUES: 5')).toBe(true);
    });

    it('returns true when both markers present', () => {
      const raw = 'GEMINI_ISSUES: 3\nREVIEW_COMPLETE';

      expect(isValidGeminiOutput(raw)).toBe(true);
    });

    it('returns false for empty content', () => {
      expect(isValidGeminiOutput('')).toBe(false);
    });

    it('returns false for unrelated content', () => {
      expect(isValidGeminiOutput('Just some random text')).toBe(false);
    });

    it('returns false for partial marker', () => {
      expect(isValidGeminiOutput('GEMINI')).toBe(false);
      expect(isValidGeminiOutput('REVIEW')).toBe(false);
    });
  });

  describe('getGeminiSummary', () => {
    it('returns "No issues found" for zero issues', () => {
      const result = {
        totalIssues: 0,
        criticalHigh: 0,
        issuesFixed: 0,
        verifiedClean: false,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe('No issues found');
    });

    it('includes total issues count', () => {
      const result = {
        totalIssues: 5,
        criticalHigh: 0,
        issuesFixed: 0,
        verifiedClean: false,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe('5 issues');
    });

    it('includes critical/high count', () => {
      const result = {
        totalIssues: 5,
        criticalHigh: 2,
        issuesFixed: 0,
        verifiedClean: false,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe('5 issues, 2 critical/high');
    });

    it('includes fixed count', () => {
      const result = {
        totalIssues: 5,
        criticalHigh: 0,
        issuesFixed: 3,
        verifiedClean: false,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe('5 issues, 3 fixed');
    });

    it('includes verified clean status', () => {
      const result = {
        totalIssues: 5,
        criticalHigh: 0,
        issuesFixed: 5,
        verifiedClean: true,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe('5 issues, 5 fixed, verified clean');
    });

    it('combines all parts', () => {
      const result = {
        totalIssues: 10,
        criticalHigh: 2,
        issuesFixed: 10, // All issues fixed
        verifiedClean: true,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe(
        '10 issues, 2 critical/high, 10 fixed, verified clean'
      );
    });

    it('does not show verified clean when issues remain unfixed', () => {
      const result = {
        totalIssues: 10,
        criticalHigh: 2,
        issuesFixed: 8, // Only 8 of 10 fixed
        verifiedClean: true, // Flag is true but should not display
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe(
        '10 issues, 2 critical/high, 8 fixed'
      );
    });

    it('omits zero counts except total', () => {
      const result = {
        totalIssues: 3,
        criticalHigh: 0,
        issuesFixed: 0,
        verifiedClean: false,
        raw: '',
      };

      expect(getGeminiSummary(result)).toBe('3 issues');
    });
  });
});
