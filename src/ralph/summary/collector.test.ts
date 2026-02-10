import { describe, it, expect } from 'vitest';
import {
  SummaryCollector,
  parseGeminiIssues,
  parseQodanaIssues,
  parseRefactorResults,
} from './collector.js';

describe('SummaryCollector', () => {
  function createCollector(): SummaryCollector {
    return new SummaryCollector('test-session', '/path/to/prd.md', 'software', 3);
  }

  it('builds empty summary with no items', () => {
    const collector = createCollector();
    const summary = collector.build();
    expect(summary.sessionId).toBe('test-session');
    expect(summary.prdPath).toBe('/path/to/prd.md');
    expect(summary.projectType).toBe('software');
    expect(summary.totalItems).toBe(3);
    expect(summary.completedItems).toBe(0);
    expect(summary.failedItems).toBe(0);
    expect(summary.items).toHaveLength(0);
  });

  it('tracks a successful item with stages', () => {
    const collector = createCollector();
    collector.startItem(1, 'Add auth');
    collector.addStage({ name: 'plan', status: 'done', durationMs: 100 });
    collector.addStage({ name: 'implement', status: 'done', durationMs: 200 });
    collector.completeItem('success');

    const summary = collector.build();
    expect(summary.completedItems).toBe(1);
    expect(summary.failedItems).toBe(0);
    expect(summary.items).toHaveLength(1);
    expect(summary.items[0].number).toBe(1);
    expect(summary.items[0].text).toBe('Add auth');
    expect(summary.items[0].status).toBe('success');
    expect(summary.items[0].stages).toHaveLength(2);
  });

  it('tracks a failed item', () => {
    const collector = createCollector();
    collector.startItem(1, 'Fails');
    collector.completeItem('failed');

    const summary = collector.build();
    expect(summary.completedItems).toBe(0);
    expect(summary.failedItems).toBe(1);
  });

  it('tracks multiple items', () => {
    const collector = createCollector();
    collector.startItem(1, 'First');
    collector.completeItem('success');
    collector.startItem(2, 'Second');
    collector.completeItem('failed');
    collector.startItem(3, 'Third');
    collector.completeItem('success');

    expect(collector.getCompletedCount()).toBe(2);
    const summary = collector.build();
    expect(summary.items).toHaveLength(3);
  });

  it('does not share stages between items', () => {
    const collector = createCollector();
    collector.startItem(1, 'First');
    collector.addStage({ name: 'plan', status: 'done', durationMs: 100 });
    collector.completeItem('success');

    collector.startItem(2, 'Second');
    collector.completeItem('success');

    const summary = collector.build();
    expect(summary.items[0].stages).toHaveLength(1);
    expect(summary.items[1].stages).toHaveLength(0);
  });

  it('handles completeItem with no active item', () => {
    const collector = createCollector();
    collector.completeItem('success');
    const summary = collector.build();
    expect(summary.items).toHaveLength(0);
  });

  it('includes production check when added', () => {
    const collector = createCollector();
    collector.addProductionCheck({
      status: 'success',
      message: 'All checks passed',
      metrics: { critical: 0, high: 0, medium: 2, low: 5 },
    });

    const summary = collector.build();
    expect(summary.productionCheck).toBeDefined();
    expect(summary.productionCheck!.status).toBe('success');
    expect(summary.productionCheck!.medium).toBe(2);
    expect(summary.productionCheck!.low).toBe(5);
  });

  it('includes failed production check with error message', () => {
    const collector = createCollector();
    collector.addProductionCheck({ status: 'failed', error: 'Build failed' });

    const summary = collector.build();
    expect(summary.productionCheck!.status).toBe('failed');
    expect(summary.productionCheck!.message).toBe('Build failed');
  });

  it('computes duration', () => {
    const collector = createCollector();
    const summary = collector.build();
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
    expect(summary.startTime).toBeTruthy();
    expect(summary.endTime).toBeTruthy();
  });
});

describe('parseGeminiIssues', () => {
  it('parses issue with file and line', () => {
    const output = `[HIGH] Missing input validation (src/auth.ts:42)
GEMINI_ISSUES: 1
GEMINI_CRITICAL_HIGH: 1
GEMINI_FIXED: 0
GEMINI_VERIFIED_CLEAN: no`;

    const result = parseGeminiIssues(output);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('HIGH');
    expect(result.issues[0].message).toContain('Missing input validation');
    expect(result.issues[0].file).toBe('src/auth.ts');
    expect(result.issues[0].line).toBe(42);
    expect(result.totalFound).toBe(1);
    expect(result.criticalHigh).toBe(1);
    expect(result.verifiedClean).toBe(false);
  });

  it('detects FIXED issues', () => {
    const output = `[MEDIUM] Unused import (src/utils.ts:10) - FIXED
GEMINI_FIXED: 1`;

    const result = parseGeminiIssues(output);
    expect(result.issues[0].fixed).toBe(true);
    expect(result.fixed).toBe(1);
  });

  it('returns empty for no issues', () => {
    const output = 'All good, no issues found.';
    const result = parseGeminiIssues(output);
    expect(result.issues).toHaveLength(0);
  });

  it('parses verified clean status', () => {
    const output = 'GEMINI_VERIFIED_CLEAN: yes';
    const result = parseGeminiIssues(output);
    expect(result.verifiedClean).toBe(true);
  });
});

describe('parseQodanaIssues', () => {
  it('parses issue with file and line', () => {
    const output = `HIGH: Unused variable at src/index.ts:15
QODANA_ISSUES: 1`;

    const result = parseQodanaIssues(output);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('HIGH');
    expect(result.issues[0].message).toContain('Unused variable');
    expect(result.issues[0].file).toBe('src/index.ts');
    expect(result.issues[0].line).toBe(15);
  });

  it('detects FIXED qodana issues', () => {
    const output = 'MODERATE: Dead code at src/utils.ts:30 - FIXED';
    const result = parseQodanaIssues(output);
    expect(result.issues[0].fixed).toBe(true);
  });
});

describe('parseRefactorResults', () => {
  it('parses REFACTORED improvements', () => {
    const output = `REFACTORED:
- Extracted validateInput from processRequest
- Renamed data to userProfile
REFACTOR_COUNT: 2`;

    const result = parseRefactorResults(output);
    expect(result.improvements).toHaveLength(2);
    expect(result.improvements[0]).toContain('Extracted validateInput');
    expect(result.improvements[1]).toContain('Renamed data');
  });

  it('handles bold markdown headers', () => {
    const output = `**REFACTORED:**
- Split large function into smaller helpers`;

    const result = parseRefactorResults(output);
    expect(result.improvements).toHaveLength(1);
  });

  it('skips "none needed" lines', () => {
    const output = `REFACTORED:
- None needed for this file`;

    const result = parseRefactorResults(output);
    expect(result.improvements).toHaveLength(0);
  });

  it('returns empty for no refactoring', () => {
    const output = 'No refactoring needed.';
    const result = parseRefactorResults(output);
    expect(result.improvements).toHaveLength(0);
  });

  it('handles legacy IMPROVEMENTS format', () => {
    const output = `IMPROVEMENTS:
- Consolidated duplicate logic
IMPROVEMENT_COUNT: 1`;

    const result = parseRefactorResults(output);
    expect(result.improvements).toHaveLength(1);
  });
});
