import { describe, it, expect } from 'vitest';
import { parsePhaseOutput } from './issue-parser.js';

describe('parsePhaseOutput', () => {
  it('returns empty result for empty input', () => {
    const result = parsePhaseOutput('');
    expect(result.issues).toHaveLength(0);
    expect(result.fixed).toHaveLength(0);
    expect(result.info).toHaveLength(0);
    expect(result.remaining).toBe(0);
    expect(result.verifiedClean).toBe(false);
  });

  it('parses table format with file:line', () => {
    const raw = `ISSUES_FOUND:
| HIGH | Missing validation | \`src/auth.ts:42\` |`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('HIGH');
    expect(result.issues[0].description).toContain('Missing validation');
    expect(result.issues[0].file).toBe('src/auth.ts');
    expect(result.issues[0].line).toBe(42);
  });

  it('parses table format without line number', () => {
    const raw = `ISSUES_FOUND:
| MODERATE | Unclear naming | src/utils.ts |`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('MODERATE');
    expect(result.issues[0].file).toContain('src/utils.ts');
  });

  it('parses standard format [SEVERITY] desc (file:line)', () => {
    const raw = `ISSUES_FOUND:
[CRITICAL] SQL injection vulnerability (src/db.ts:88)`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('CRITICAL');
    expect(result.issues[0].file).toBe('src/db.ts');
    expect(result.issues[0].line).toBe(88);
  });

  it('parses format without location', () => {
    const raw = `ISSUES_FOUND:
[LOW] Consider adding documentation`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('LOW');
    expect(result.issues[0].file).toBe('unknown');
    expect(result.issues[0].line).toBe(0);
  });

  it('normalizes MEDIUM to MODERATE', () => {
    const raw = `ISSUES_FOUND:
[MEDIUM] Some issue (file.ts:1)`;

    const result = parsePhaseOutput(raw);
    expect(result.issues[0].severity).toBe('MODERATE');
  });

  it('categorizes INFO issues separately', () => {
    const raw = `ISSUES_FOUND:
[INFO] Consider using const assertion
[HIGH] Missing error handling (src/api.ts:10)`;

    const result = parsePhaseOutput(raw);
    expect(result.info).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
  });

  it('detects fixed issues in ISSUES_FIXED section', () => {
    const raw = `ISSUES_FIXED:
[HIGH] Missing validation (src/auth.ts:42)`;

    const result = parsePhaseOutput(raw);
    expect(result.fixed).toHaveLength(1);
    expect(result.fixed[0].fixed).toBe(true);
  });

  it('detects FIXED marker on issue line', () => {
    const raw = `ISSUES_FOUND:
[HIGH] Missing validation (src/auth.ts:42) - FIXED`;

    const result = parsePhaseOutput(raw);
    expect(result.fixed).toHaveLength(1);
    expect(result.fixed[0].fixed).toBe(true);
  });

  it('skips lines in skip sections (NOT FIXED, SKIPPED, etc.)', () => {
    const raw = `ISSUES_FOUND:
[HIGH] Real issue (src/a.ts:1)
SKIPPED:
[HIGH] Skipped issue (src/b.ts:2)`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].file).toBe('src/a.ts');
  });

  it('parses VERIFIED_CLEAN status', () => {
    const raw = `VERIFIED_CLEAN: yes`;
    const result = parsePhaseOutput(raw);
    expect(result.verifiedClean).toBe(true);
  });

  it('parses UNFIXED count', () => {
    const raw = `ISSUES_FOUND:
[HIGH] Issue one (src/a.ts:1)
UNFIXED: 1`;

    const result = parsePhaseOutput(raw);
    expect(result.remaining).toBe(1);
  });

  it('parses REMAINING count', () => {
    const raw = `REMAINING: 3`;
    const result = parsePhaseOutput(raw);
    expect(result.remaining).toBe(3);
  });

  it('falls back to unfixed issue count when no explicit count', () => {
    const raw = `ISSUES_FOUND:
[HIGH] Issue one (src/a.ts:1)
[MODERATE] Issue two (src/b.ts:2)`;

    const result = parsePhaseOutput(raw);
    expect(result.remaining).toBe(2);
  });

  it('handles multiple issues across sections', () => {
    const raw = `ISSUES_FOUND:
[CRITICAL] XSS vulnerability (src/render.ts:10)
[HIGH] Missing auth check (src/api.ts:25)

ISSUES_FIXED:
[MODERATE] Unused import (src/utils.ts:1) - FIXED
[LOW] Naming convention (src/types.ts:5) - FIXED

SUMMARY:
UNFIXED: 2
VERIFIED_CLEAN: no`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(2);
    expect(result.fixed).toHaveLength(2);
    expect(result.remaining).toBe(2);
    expect(result.verifiedClean).toBe(false);
  });

  it('cleans FIXED markers from descriptions', () => {
    const raw = `ISSUES_FOUND:
[HIGH] Missing validation (src/auth.ts:42) - FIXED`;

    const result = parsePhaseOutput(raw);
    expect(result.fixed[0].description).not.toContain('FIXED');
  });

  it('handles markdown formatted section headers', () => {
    const raw = `## **ISSUES_FOUND:**
[HIGH] Test issue (src/test.ts:1)
## **ISSUES_FIXED:**
[LOW] Fixed issue (src/test.ts:2)`;

    const result = parsePhaseOutput(raw);
    expect(result.issues).toHaveLength(1);
    expect(result.fixed).toHaveLength(1);
  });

  it('handles bullet-prefixed issues', () => {
    const raw = `ISSUES_FOUND:
- [HIGH] Missing validation (src/auth.ts:42)
* [MODERATE] Unclear naming (src/utils.ts:10)
1. [LOW] Consider refactoring (src/old.ts:100)`;

    const result = parsePhaseOutput(raw);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
