/**
 * Tests for phase-output parsing and display.
 *
 * Following dodds: test behavior, not implementation.
 * Following meszaros: clear test names, AAA pattern.
 */

import { describe, it, expect } from 'vitest';
import { parsePhaseOutput, getPhaseResultSummary, PhaseOutput } from './phase-output.js';

describe('parsePhaseOutput', () => {
  it('parses empty output as no issues', () => {
    const result = parsePhaseOutput('');
    
    expect(result.issues).toHaveLength(0);
    expect(result.fixed).toHaveLength(0);
    expect(result.remaining).toBe(0);
    expect(result.verifiedClean).toBe(false);
  });

  it('parses issues found section', () => {
    const raw = `
ISSUES_FOUND:
[CRITICAL] SQL injection vulnerability (src/api/users.ts:45)
[HIGH] Missing input validation (src/handlers/upload.ts:23)
[MODERATE] Unused variable (src/utils/helpers.ts:12)

SUMMARY:
REVIEW_ISSUES: 3
`;
    
    const result = parsePhaseOutput(raw);
    
    expect(result.issues).toHaveLength(3);
    expect(result.issues[0]).toEqual({
      severity: 'CRITICAL',
      description: 'SQL injection vulnerability',
      file: 'src/api/users.ts',
      line: 45,
      fixed: false,
    });
    expect(result.issues[1].severity).toBe('HIGH');
    expect(result.issues[2].severity).toBe('MODERATE');
  });

  it('parses issues fixed section', () => {
    const raw = `
ISSUES_FOUND:
[CRITICAL] SQL injection vulnerability (src/api/users.ts:45)
[HIGH] Missing input validation (src/handlers/upload.ts:23)

ISSUES_FIXED:
[CRITICAL] SQL injection vulnerability (src/api/users.ts:45) - FIXED
[HIGH] Missing input validation (src/handlers/upload.ts:23) - FIXED

SUMMARY:
REVIEW_ISSUES: 2
ISSUES_FIXED: 2
REMAINING: 0
VERIFIED_CLEAN: yes
`;
    
    const result = parsePhaseOutput(raw);
    
    expect(result.fixed).toHaveLength(2);
    expect(result.fixed[0].fixed).toBe(true);
    expect(result.fixed[0].description).toBe('SQL injection vulnerability');
    expect(result.remaining).toBe(0);
    expect(result.verifiedClean).toBe(true);
  });

  it('handles inline FIXED markers', () => {
    const raw = `
[CRITICAL] SQL injection vulnerability (src/api/users.ts:45) - FIXED
[HIGH] Missing validation (src/handlers/upload.ts:23)
`;
    
    const result = parsePhaseOutput(raw);
    
    expect(result.fixed).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.fixed[0].description).toBe('SQL injection vulnerability');
  });

  it('parses remaining count from SUMMARY', () => {
    const raw = `
ISSUES_FOUND:
[CRITICAL] Issue 1 (file.ts:1)
[HIGH] Issue 2 (file.ts:2)
[MODERATE] Issue 3 (file.ts:3)

ISSUES_FIXED:
[CRITICAL] Issue 1 (file.ts:1) - FIXED

SUMMARY:
REVIEW_ISSUES: 3
ISSUES_FIXED: 1
REMAINING: 2
VERIFIED_CLEAN: no
`;
    
    const result = parsePhaseOutput(raw);
    
    expect(result.remaining).toBe(2);
    expect(result.verifiedClean).toBe(false);
  });

  it('handles case-insensitive severity levels', () => {
    const raw = `
[critical] Lowercase critical (file.ts:1)
[Critical] Mixed case (file.ts:2)
[CRITICAL] Uppercase (file.ts:3)
`;
    
    const result = parsePhaseOutput(raw);
    
    expect(result.issues).toHaveLength(3);
    expect(result.issues.every(i => i.severity === 'CRITICAL')).toBe(true);
  });

  it('handles severity without brackets', () => {
    const raw = `
CRITICAL SQL injection (src/api.ts:45)
HIGH Missing validation (src/handler.ts:23)
`;
    
    const result = parsePhaseOutput(raw);
    
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].severity).toBe('CRITICAL');
    expect(result.issues[1].severity).toBe('HIGH');
  });
});

describe('getPhaseResultSummary', () => {
  it('returns "No issues found" for empty results', () => {
    const output: PhaseOutput = {
      issues: [],
      fixed: [],
      info: [],
      remaining: 0,
      verifiedClean: false,
    };

    expect(getPhaseResultSummary(output)).toBe('No issues found');
  });

  it('includes issue count and fixed count', () => {
    const output: PhaseOutput = {
      issues: [
        { severity: 'HIGH', description: 'test', file: 'f.ts', line: 1, fixed: false },
      ],
      fixed: [
        { severity: 'CRITICAL', description: 'fixed', file: 'f.ts', line: 2, fixed: true },
      ],
      info: [],
      remaining: 1,
      verifiedClean: false,
    };

    const summary = getPhaseResultSummary(output);

    expect(summary).toContain('2 issues');
    expect(summary).toContain('1 fixed');
    expect(summary).toContain('1 remaining');
  });

  it('includes verified clean when true', () => {
    const output: PhaseOutput = {
      issues: [],
      fixed: [
        { severity: 'LOW', description: 'test', file: 'f.ts', line: 1, fixed: true },
      ],
      info: [],
      remaining: 0,
      verifiedClean: true,
    };

    const summary = getPhaseResultSummary(output);

    expect(summary).toContain('verified clean');
  });
});
