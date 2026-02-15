/**
 * Findings parser tests.
 */

import { describe, it, expect } from 'vitest';
import {
  parseFindings,
  parseFixes,
  parseDocIssues,
  parseDocsUpdated,
  countBySeverity,
  getFixableFindings,
} from './findings.js';

describe('parseFindings', () => {
  it('parses [SEVERITY] format', () => {
    const output = `
[CRITICAL] SQL injection vulnerability
[HIGH] Missing authentication check
[MEDIUM] No rate limiting
[LOW] Verbose error messages
`;
    const findings = parseFindings(output);

    expect(findings).toHaveLength(4);
    expect(findings[0]).toEqual({ severity: 'CRITICAL', description: 'SQL injection vulnerability' });
    expect(findings[1]).toEqual({ severity: 'HIGH', description: 'Missing authentication check' });
  });

  it('extracts file from Evidence: line', () => {
    const output = `
[HIGH] Buffer overflow
Evidence: src/parser.ts:45 - \`unsafe code\`
`;
    const findings = parseFindings(output);

    expect(findings[0].file).toBe('src/parser.ts');
    expect(findings[0].line).toBe(45);
  });

  it('extracts file from File: line', () => {
    const output = `
[MEDIUM] Missing validation
  File: src/api/routes.ts
`;
    const findings = parseFindings(output);

    expect(findings[0].file).toBe('src/api/routes.ts');
  });

  it('normalizes MODERATE to MEDIUM', () => {
    const output = '[MODERATE] Some issue';
    const findings = parseFindings(output);

    expect(findings[0].severity).toBe('MEDIUM');
  });

  it('deduplicates findings', () => {
    const output = `
[HIGH] Same issue
[HIGH] Same issue
[HIGH] Different issue
`;
    const findings = parseFindings(output);

    expect(findings).toHaveLength(2);
  });

  it('returns empty array for no findings', () => {
    const output = 'No issues found. All clear.';
    const findings = parseFindings(output);

    expect(findings).toHaveLength(0);
  });
});

describe('parseFixes', () => {
  it('parses FIXES_APPLIED section', () => {
    const output = `
FIXES_APPLIED:
[CRITICAL] SQL injection
  File: src/db.ts
  Change: Added parameterized query

[HIGH] Auth bypass
  File: src/auth.ts
  Change: Added token validation

GEMINI_REVIEW_COMPLETE
`;
    const fixes = parseFixes(output);

    expect(fixes).toHaveLength(2);
    expect(fixes[0]).toEqual({
      severity: 'CRITICAL',
      description: 'SQL injection',
      file: 'src/db.ts',
      change: 'Added parameterized query',
    });
  });

  it('returns empty array when no section', () => {
    const output = 'No fixes were applied.';
    const fixes = parseFixes(output);

    expect(fixes).toHaveLength(0);
  });
});

describe('parseDocIssues', () => {
  it('parses DOC_ISSUES section', () => {
    const output = `
DOC_ISSUES:
- README missing setup section
- API docs outdated

AUDIT_COMPLETE
`;
    const issues = parseDocIssues(output);

    expect(issues).toHaveLength(2);
    expect(issues[0]).toBe('README missing setup section');
  });
});

describe('parseDocsUpdated', () => {
  it('parses DOCS_UPDATED section', () => {
    const output = `
DOCS_UPDATED:
- README.md: Added setup section
- API.md: Updated endpoints

GEMINI_REVIEW_COMPLETE
`;
    const docs = parseDocsUpdated(output);

    expect(docs).toHaveLength(2);
    expect(docs[0]).toBe('README.md: Added setup section');
  });
});

describe('countBySeverity', () => {
  it('counts findings by severity', () => {
    const findings = [
      { severity: 'CRITICAL' as const, description: 'a' },
      { severity: 'HIGH' as const, description: 'b' },
      { severity: 'HIGH' as const, description: 'c' },
      { severity: 'MEDIUM' as const, description: 'd' },
    ];

    const counts = countBySeverity(findings);

    expect(counts.critical).toBe(1);
    expect(counts.high).toBe(2);
    expect(counts.medium).toBe(1);
    expect(counts.low).toBe(0);
  });
});

describe('getFixableFindings', () => {
  it('excludes INFO and LOW by default', () => {
    const findings = [
      { severity: 'CRITICAL' as const, description: 'a' },
      { severity: 'LOW' as const, description: 'b' },
      { severity: 'INFO' as const, description: 'c' },
    ];

    const fixable = getFixableFindings(findings);

    expect(fixable).toHaveLength(1);
    expect(fixable[0].severity).toBe('CRITICAL');
  });

  it('includes LOW when specified', () => {
    const findings = [
      { severity: 'CRITICAL' as const, description: 'a' },
      { severity: 'LOW' as const, description: 'b' },
    ];

    const fixable = getFixableFindings(findings, true);

    expect(fixable).toHaveLength(2);
  });
});
