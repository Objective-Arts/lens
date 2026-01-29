/**
 * Summary data collector.
 *
 * Following Hevery: mutable state contained, clear interface.
 * Following McIlroy: single responsibility.
 */

import {
  RunSummary,
  ItemSummary,
  StageSummary,
  GeminiSummary,
  QodanaSummary,
  TestSummary,
  RefactorSummary,
  Issue,
  IssueSeverity,
} from './types.js';

/** Collector for building run summary incrementally */
export class SummaryCollector {
  private sessionId: string;
  private startTime: Date;
  private prdPath: string;
  private projectType: string;
  private totalItems: number;
  private items: ItemSummary[] = [];
  private currentItem: Partial<ItemSummary> | null = null;
  private currentStages: StageSummary[] = [];

  constructor(sessionId: string, prdPath: string, projectType: string, totalItems: number) {
    this.sessionId = sessionId;
    this.startTime = new Date();
    this.prdPath = prdPath;
    this.projectType = projectType;
    this.totalItems = totalItems;
  }

  /** Start tracking a new PRD item */
  startItem(number: number, text: string): void {
    this.currentItem = { number, text };
    this.currentStages = [];
  }

  /** Record a completed stage */
  addStage(stage: StageSummary): void {
    this.currentStages.push(stage);
  }

  /** Complete the current item */
  completeItem(status: 'success' | 'failed'): void {
    if (this.currentItem) {
      this.items.push({
        number: this.currentItem.number!,
        text: this.currentItem.text!,
        status,
        stages: [...this.currentStages],
      });
      this.currentItem = null;
      this.currentStages = [];
    }
  }

  /** Build final summary */
  build(): RunSummary {
    const endTime = new Date();
    const completedItems = this.items.filter(i => i.status === 'success').length;
    const failedItems = this.items.filter(i => i.status === 'failed').length;

    return {
      sessionId: this.sessionId,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs: endTime.getTime() - this.startTime.getTime(),
      prdPath: this.prdPath,
      projectType: this.projectType,
      totalItems: this.totalItems,
      completedItems,
      failedItems,
      items: this.items,
    };
  }
}

/** Parse Gemini issues from Claude output */
export function parseGeminiIssues(output: string): GeminiSummary {
  const issues: Issue[] = [];

  // Match issue lines: [SEVERITY] message (file:line)
  const issuePattern = /\[(\w+)\]\s+(.+?)(?:\s+\(([^:]+):?(\d+)?\))?(?:\s*-\s*(FIXED|fixed))?$/gm;
  let match;

  while ((match = issuePattern.exec(output)) !== null) {
    const severity = normalizeSeverity(match[1]);
    issues.push({
      severity,
      message: match[2].trim(),
      file: match[3],
      line: match[4] ? parseInt(match[4], 10) : undefined,
      fixed: match[5] !== undefined,
    });
  }

  // Parse summary counts
  const totalMatch = output.match(/GEMINI_ISSUES:\s*(\d+)/i);
  const criticalHighMatch = output.match(/CRITICAL_HIGH:\s*(\d+)/i);
  const fixedMatch = output.match(/ISSUES_FIXED:\s*(\d+)/i);
  const verifiedMatch = output.match(/VERIFIED_CLEAN:\s*(yes|no)/i);

  return {
    issues,
    totalFound: totalMatch ? parseInt(totalMatch[1], 10) : issues.length,
    criticalHigh: criticalHighMatch ? parseInt(criticalHighMatch[1], 10) :
      issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length,
    fixed: fixedMatch ? parseInt(fixedMatch[1], 10) : issues.filter(i => i.fixed).length,
    verifiedClean: verifiedMatch ? verifiedMatch[1].toLowerCase() === 'yes' : false,
  };
}

/** Parse Qodana issues from Claude output */
export function parseQodanaIssues(output: string): QodanaSummary {
  const issues: Issue[] = [];

  // Match Qodana-style issues
  const issuePattern = /(\w+):\s+(.+?)\s+at\s+([^:]+):(\d+)(?:\s*-\s*(FIXED|fixed))?/gm;
  let match;

  while ((match = issuePattern.exec(output)) !== null) {
    issues.push({
      severity: normalizeSeverity(match[1]),
      message: match[2].trim(),
      file: match[3],
      line: parseInt(match[4], 10),
      fixed: match[5] !== undefined,
    });
  }

  // Parse summary counts
  const totalMatch = output.match(/QODANA_ISSUES:\s*(\d+)/i);
  const criticalHighMatch = output.match(/QODANA_CRITICAL_HIGH:\s*(\d+)/i);
  const fixedMatch = output.match(/QODANA_FIXED:\s*(\d+)/i);
  const verifiedMatch = output.match(/QODANA_VERIFIED_CLEAN:\s*(yes|no)/i);

  return {
    issues,
    totalFound: totalMatch ? parseInt(totalMatch[1], 10) : issues.length,
    criticalHigh: criticalHighMatch ? parseInt(criticalHighMatch[1], 10) :
      issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length,
    fixed: fixedMatch ? parseInt(fixedMatch[1], 10) : issues.filter(i => i.fixed).length,
    verifiedClean: verifiedMatch ? verifiedMatch[1].toLowerCase() === 'yes' : false,
  };
}

/** Parse test results from output */
export function parseTestResults(output: string): TestSummary {
  const passedMatch = output.match(/PASSED:\s*(\d+)/i);
  const failedMatch = output.match(/FAILED:\s*(\d+)/i);
  const writtenMatch = output.match(/WRITTEN:\s*(\d+)/i);

  return {
    passed: passedMatch ? parseInt(passedMatch[1], 10) : 0,
    failed: failedMatch ? parseInt(failedMatch[1], 10) : 0,
    written: writtenMatch ? parseInt(writtenMatch[1], 10) : 0,
  };
}

/** Parse refactor improvements from output */
export function parseRefactorResults(output: string): RefactorSummary {
  const improvements: string[] = [];

  const improvementsMatch = output.match(/IMPROVEMENTS:\s*([\s\S]*?)(?:IMPROVEMENT_COUNT:|$)/);
  if (improvementsMatch) {
    const lines = improvementsMatch[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        improvements.push(trimmed.slice(2).trim());
      }
    }
  }

  return { improvements };
}

/** Normalize severity string to IssueSeverity */
function normalizeSeverity(severity: string): IssueSeverity {
  const upper = severity.toUpperCase();
  if (upper === 'CRITICAL' || upper === 'CRIT') return 'CRITICAL';
  if (upper === 'HIGH' || upper === 'ERROR') return 'HIGH';
  if (upper === 'MEDIUM' || upper === 'MODERATE' || upper === 'WARNING' || upper === 'WARN') return 'MEDIUM';
  if (upper === 'LOW' || upper === 'MINOR') return 'LOW';
  return 'INFO';
}
