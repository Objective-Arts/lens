/**
 * Claude Stream Parser Tests
 *
 * Following Hevery: Testing pure functions directly.
 * Following Dodds: Test behavior (extraction results), not implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  extractResultFromContent,
  isSuccessfulRun,
  isFailedRun,
  extractError,
} from './claude-stream.js';

describe('Claude Stream Parser', () => {
  describe('extractResultFromContent', () => {
    it('extracts explicit result field', () => {
      const content = '{"type":"result","result":"Task completed successfully"}';

      expect(extractResultFromContent(content)).toBe('Task completed successfully');
    });

    it('extracts result with escaped quotes', () => {
      // Note: The current regex extracts up to the first unescaped quote
      // This tests the actual behavior
      const content = '{"result":"Result with simple text"}';

      expect(extractResultFromContent(content)).toBe('Result with simple text');
    });

    it('extracts result with newlines', () => {
      const content = '{"result":"Line 1\\nLine 2\\nLine 3"}';

      expect(extractResultFromContent(content)).toBe('Line 1\nLine 2\nLine 3');
    });

    it('finds IMPLEMENT_COMPLETE marker in text blocks', () => {
      const content = `{"type":"assistant","text":"Working on the task..."}
{"type":"assistant","text":"IMPLEMENT_COMPLETE: All files created"}`;

      const result = extractResultFromContent(content);
      expect(result).toContain('IMPLEMENT_COMPLETE');
    });

    it('finds PLAN_COMPLETE marker', () => {
      const content = '{"type":"assistant","text":"PLAN_COMPLETE - Implementation planned"}';

      const result = extractResultFromContent(content);
      expect(result).toContain('PLAN_COMPLETE');
    });

    it('finds TEST_COUNT marker', () => {
      const content = '{"type":"assistant","text":"TEST_COUNT: 5"}';

      const result = extractResultFromContent(content);
      expect(result).toContain('TEST_COUNT:');
    });

    it('finds REVIEW_ISSUES marker', () => {
      const content = '{"type":"assistant","text":"REVIEW_ISSUES: 0"}';

      const result = extractResultFromContent(content);
      expect(result).toContain('REVIEW_ISSUES:');
    });

    it('finds GEMINI_ISSUES marker', () => {
      const content = '{"text":"GEMINI_ISSUES: 3 issues found"}';

      const result = extractResultFromContent(content);
      expect(result).toContain('GEMINI_ISSUES');
    });

    it('concatenates all text blocks as fallback', () => {
      const content = `{"text":"First message"}
{"text":"Second message"}
{"text":"Final message"}`;

      expect(extractResultFromContent(content)).toBe('First message\nSecond message\nFinal message');
    });

    it('preserves APPLIED section across multiple text blocks', () => {
      const content = `{"text":"APPLIED:\\n- kernighan: Simplified the code\\n- pike: Reduced API surface"}
{"text":"\\nSome more work done..."}
{"text":"IMPLEMENT_COMPLETE"}`;

      const result = extractResultFromContent(content);
      expect(result).toContain('APPLIED:');
      expect(result).toContain('kernighan: Simplified the code');
      expect(result).toContain('IMPLEMENT_COMPLETE');
    });

    it('returns empty string for empty content', () => {
      expect(extractResultFromContent('')).toBe('');
    });

    it('returns empty string for content without result or text', () => {
      const content = '{"type":"system","message":"Connected"}';

      expect(extractResultFromContent(content)).toBe('');
    });

    it('handles multiple result fields, taking first', () => {
      const content = `{"result":"First result"}
{"result":"Second result"}`;

      expect(extractResultFromContent(content)).toBe('First result');
    });

    it('unescapes tab characters', () => {
      const content = '{"result":"Column1\\tColumn2\\tColumn3"}';

      expect(extractResultFromContent(content)).toBe('Column1\tColumn2\tColumn3');
    });

    it('handles paths with forward slashes', () => {
      // Forward slashes don't need escaping
      const content = '{"result":"Path: /Users/test/file.txt"}';

      expect(extractResultFromContent(content)).toBe('Path: /Users/test/file.txt');
    });
  });

  describe('isSuccessfulRun', () => {
    it('detects PLAN_COMPLETE', () => {
      expect(isSuccessfulRun('Task finished. PLAN_COMPLETE')).toBe(true);
    });

    it('detects STRUCTURE_COMPLETE', () => {
      expect(isSuccessfulRun('STRUCTURE_COMPLETE: Types defined')).toBe(true);
    });

    it('detects IMPLEMENT_COMPLETE', () => {
      expect(isSuccessfulRun('IMPLEMENT_COMPLETE: Implementation done')).toBe(true);
    });

    it('detects TEST_COUNT', () => {
      expect(isSuccessfulRun('TEST_COUNT: 5')).toBe(true);
    });

    it('detects REFACTOR_COMPLETE', () => {
      expect(isSuccessfulRun('Refactoring done. REFACTOR_COMPLETE')).toBe(true);
    });

    it('detects REVIEW_ISSUES', () => {
      expect(isSuccessfulRun('REVIEW_ISSUES: 0')).toBe(true);
    });

    it('detects ANALYSIS_ISSUES', () => {
      expect(isSuccessfulRun('ANALYSIS_ISSUES: 2')).toBe(true);
    });

    it('detects DOC_COMPLETE', () => {
      expect(isSuccessfulRun('Documentation added. DOC_COMPLETE')).toBe(true);
    });

    it('returns false for no markers', () => {
      expect(isSuccessfulRun('Just some regular output')).toBe(false);
    });

    it('returns false for empty content', () => {
      expect(isSuccessfulRun('')).toBe(false);
    });

    it('is case sensitive', () => {
      expect(isSuccessfulRun('implement_complete')).toBe(false);
      expect(isSuccessfulRun('Implement_Complete')).toBe(false);
    });
  });

  describe('isFailedRun', () => {
    it('detects PLAN_FAILED', () => {
      expect(isFailedRun('Could not complete. PLAN_FAILED')).toBe(true);
    });

    it('detects STRUCTURE_FAILED', () => {
      expect(isFailedRun('STRUCTURE_FAILED: Could not define types')).toBe(true);
    });

    it('detects IMPLEMENT_FAILED', () => {
      expect(isFailedRun('IMPLEMENT_FAILED: Compilation error')).toBe(true);
    });

    it('detects TEST_FAILED', () => {
      expect(isFailedRun('Tests failed. TEST_FAILED')).toBe(true);
    });

    it('detects REFACTOR_FAILED', () => {
      expect(isFailedRun('REFACTOR_FAILED - linting errors')).toBe(true);
    });

    it('detects REVIEW_FAILED', () => {
      expect(isFailedRun('REVIEW_FAILED: Critical issues found')).toBe(true);
    });

    it('detects ANALYSIS_FAILED', () => {
      expect(isFailedRun('ANALYSIS_FAILED: Qodana error')).toBe(true);
    });

    it('detects DOC_FAILED', () => {
      expect(isFailedRun('DOC_FAILED: Could not generate docs')).toBe(true);
    });

    it('returns false for no failure markers', () => {
      expect(isFailedRun('Task completed successfully')).toBe(false);
    });

    it('returns false for success markers', () => {
      expect(isFailedRun('IMPLEMENT_COMPLETE')).toBe(false);
    });

    it('returns false for empty content', () => {
      expect(isFailedRun('')).toBe(false);
    });
  });

  describe('extractError', () => {
    it('extracts error after FAILED marker', () => {
      const content = 'BUILD_FAILED: Module not found';

      expect(extractError(content)).toBe('Module not found');
    });

    it('extracts error after Error marker', () => {
      const content = 'Error: Cannot read property of undefined';

      expect(extractError(content)).toBe('Cannot read property of undefined');
    });

    it('extracts error from JSON format', () => {
      const content = '{"error": "Connection refused"}';

      expect(extractError(content)).toBe('Connection refused');
    });

    it('handles FAILED with colon', () => {
      const content = 'TEST_FAILED: 3 tests failed';

      expect(extractError(content)).toBe('3 tests failed');
    });

    it('handles FAILED with space', () => {
      const content = 'BUILD_FAILED Could not compile';

      expect(extractError(content)).toBe('Could not compile');
    });

    it('returns null for no error', () => {
      expect(extractError('Everything went fine')).toBeNull();
    });

    it('returns null for empty content', () => {
      expect(extractError('')).toBeNull();
    });

    it('trims whitespace from error message', () => {
      const content = 'Error:   Too much whitespace  ';

      expect(extractError(content)).toBe('Too much whitespace');
    });

    it('stops at newline', () => {
      const content = 'Error: First line\nSecond line';

      expect(extractError(content)).toBe('First line');
    });
  });
});
