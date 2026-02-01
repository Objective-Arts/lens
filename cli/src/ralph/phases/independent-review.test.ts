/**
 * Independent Review Parser Tests
 *
 * Tests for issue parsing to catch regressions like the "Error" false-match bug.
 */

import { describe, it, expect } from 'vitest';
import { IndependentReviewPhase } from './independent-review.js';

// Access private method for testing
const phase = new IndependentReviewPhase();
const parseIssues = (output: string) => (phase as any).parseIssuesFromOutput(output);

describe('IndependentReviewPhase.parseIssuesFromOutput', () => {
  describe('standard formats', () => {
    it('parses [SEVERITY] format', () => {
      const output = `
[HIGH] Missing input validation (src/api.ts:42)
[MODERATE] Unused variable (src/utils.ts:10)
[LOW] Consider adding comment
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(3);
      expect(issues[0].severity).toBe('HIGH');
      expect(issues[0].description).toBe('Missing input validation');
      expect(issues[0].file).toBe('src/api.ts');
      expect(issues[0].line).toBe(42);
    });

    it('parses **SEVERITY** markdown format', () => {
      const output = `
**HIGH**: SQL injection vulnerability (db/query.ts:15)
**MODERATE**: Missing error handling
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(2);
      expect(issues[0].severity).toBe('HIGH');
      expect(issues[0].description).toBe('SQL injection vulnerability');
    });

    it('parses numbered list format', () => {
      const output = `
1. [HIGH] First issue (file.ts:1)
2. [MODERATE] Second issue (file.ts:2)
3. [LOW] Third issue
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(3);
      expect(issues[0].description).toBe('First issue');
      expect(issues[1].description).toBe('Second issue');
    });

    it('parses bullet list format', () => {
      const output = `
- [HIGH] Bullet issue one (src/a.ts:1)
- [MODERATE] Bullet issue two
* [LOW] Star bullet issue
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(3);
    });
  });

  describe('does NOT false-match common words', () => {
    it('does not match "Error" in description as severity', () => {
      const output = `
[MODERATE] Error not re-thrown in runMigrations - CI/CD cannot detect partial failures (src/db/migrate.ts:22-29)
[HIGH] Error handling missing for edge cases (src/api.ts:50)
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(2);
      // Full description should be preserved, not truncated at "Error"
      expect(issues[0].description).toContain('Error not re-thrown');
      expect(issues[0].description).toContain('CI/CD cannot detect');
      expect(issues[1].description).toContain('Error handling missing');
    });

    it('does not match "Warning" in description as severity', () => {
      const output = `
[MODERATE] Warning message not shown to user (src/ui.ts:100)
[LOW] Warning logs missing context
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(2);
      expect(issues[0].description).toContain('Warning message not shown');
      expect(issues[1].description).toContain('Warning logs missing');
    });

    it('does not match mid-line severity words', () => {
      const output = `
[HIGH] The error handling is insufficient - should catch all exceptions (src/handler.ts:25)
[MODERATE] No warning shown when critical operation fails
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(2);
      expect(issues[0].description).toBe('The error handling is insufficient - should catch all exceptions');
      expect(issues[1].description).toBe('No warning shown when critical operation fails');
    });
  });

  describe('severity normalization', () => {
    it('normalizes MEDIUM to MODERATE', () => {
      const output = '[MEDIUM] Some issue';
      const issues = parseIssues(output);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('MODERATE');
    });

    it('handles lowercase severity', () => {
      const output = '[high] Case insensitive issue';
      const issues = parseIssues(output);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('HIGH');
    });
  });

  describe('file and line extraction', () => {
    it('extracts file and line number', () => {
      const output = '[HIGH] Issue description (src/file.ts:123)';
      const issues = parseIssues(output);
      expect(issues[0].file).toBe('src/file.ts');
      expect(issues[0].line).toBe(123);
    });

    it('extracts file without line number', () => {
      const output = '[HIGH] Issue description (src/file.ts)';
      const issues = parseIssues(output);
      expect(issues[0].file).toBe('src/file.ts');
      expect(issues[0].line).toBeUndefined();
    });

    it('handles missing file reference', () => {
      const output = '[HIGH] Issue without file reference';
      const issues = parseIssues(output);
      expect(issues[0].file).toBeUndefined();
      expect(issues[0].line).toBeUndefined();
    });

    it('handles line ranges (captures as-is)', () => {
      // Line ranges like :10-20 don't match the :number pattern
      // They get captured in the description instead - acceptable tradeoff
      const output = '[HIGH] Multi-line issue (src/file.ts:10-20)';
      const issues = parseIssues(output);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('HIGH');
      // The range format doesn't parse cleanly, but issue is captured
      expect(issues[0].description).toContain('Multi-line issue');
    });
  });

  describe('deduplication', () => {
    it('deduplicates identical issues', () => {
      const output = `
[HIGH] Duplicate issue (file.ts:1)
[HIGH] Duplicate issue (file.ts:1)
[HIGH] Duplicate issue (file.ts:1)
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(1);
    });

    it('keeps similar but different issues', () => {
      const output = `
[HIGH] Issue in file A (a.ts:1)
[HIGH] Issue in file B (b.ts:1)
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty output', () => {
      const issues = parseIssues('');
      expect(issues).toHaveLength(0);
    });

    it('handles output with no issues', () => {
      const output = `
No issues found.
The code looks good.
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(0);
    });

    it('handles mixed content', () => {
      const output = `
## Review Results

Here are the issues found:

[HIGH] Security vulnerability (auth.ts:50)

Some explanatory text here.

[LOW] Minor style issue

More text.
`;
      const issues = parseIssues(output);
      expect(issues).toHaveLength(2);
    });
  });
});
