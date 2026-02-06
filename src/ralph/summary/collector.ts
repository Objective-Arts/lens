/**
 * Summary data collector.
 *
 * Following testability: mutable state contained, clear interface.
 * Following composition: single responsibility.
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

/** Production readiness check result */
export interface ProductionCheckResult {
  status: 'success' | 'failed' | 'skipped';
  message: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/** Collector for building run summary incrementally */
export class SummaryCollector {
  private readonly sessionId: string;
  private readonly startTime: Date;
  private readonly prdPath: string;
  private readonly projectType: string;
  private readonly totalItems: number;
  private items: ItemSummary[] = [];
  private currentItem: Partial<ItemSummary> | null = null;
  private currentStages: StageSummary[] = [];
  private productionCheck: ProductionCheckResult | null = null;

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

  /** Get count of completed (successful) items */
  getCompletedCount(): number {
    return this.items.filter(i => i.status === 'success').length;
  }

  /** Add production readiness check result */
  addProductionCheck(result: { status: string; message?: string; error?: string; metrics?: Record<string, number> }): void {
    this.productionCheck = {
      status: result.status as 'success' | 'failed' | 'skipped',
      message: result.status === 'failed' ? (result.error || '') : (result.message || ''),
      critical: result.metrics?.critical || 0,
      high: result.metrics?.high || 0,
      medium: result.metrics?.medium || 0,
      low: result.metrics?.low || 0,
    };
  }

  /** Build final summary */
  build(): RunSummary {
    const endTime = new Date();
    const completedItems = this.items.filter(i => i.status === 'success').length;
    const failedItems = this.items.filter(i => i.status === 'failed').length;

    const summary: RunSummary = {
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

    if (this.productionCheck) {
      summary.productionCheck = this.productionCheck;
    }

    return summary;
  }
}

/** Extract issues matching a pattern from output. */
function extractIssues(output: string, pattern: RegExp, hasLineInMatch4: boolean): Issue[] {
  const issues: Issue[] = [];
  let match;
  while ((match = pattern.exec(output)) !== null) {
    issues.push({
      severity: normalizeSeverity(match[1]),
      message: match[2].trim(),
      file: match[3],
      line: hasLineInMatch4 && match[4] ? parseInt(match[4], 10) : undefined,
      fixed: match[5] !== undefined,
    });
  }
  return issues;
}

/** Build summary from issues and parsed output markers. */
function buildIssueSummary(output: string, issues: Issue[], prefix: string): GeminiSummary | QodanaSummary {
  const totalMatch = output.match(new RegExp(`${prefix}_?ISSUES:\\s*(\\d+)`, 'i'));
  const criticalMatch = output.match(new RegExp(`${prefix}_?CRITICAL_HIGH:\\s*(\\d+)`, 'i'));
  const fixedMatch = output.match(new RegExp(`${prefix}_?FIXED:\\s*(\\d+)`, 'i'));
  const verifiedMatch = output.match(new RegExp(`${prefix}_?VERIFIED_CLEAN:\\s*(yes|no)`, 'i'));

  const criticalHigh = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
  return {
    issues,
    totalFound: totalMatch ? parseInt(totalMatch[1], 10) : issues.length,
    criticalHigh: criticalMatch ? parseInt(criticalMatch[1], 10) : criticalHigh,
    fixed: fixedMatch ? parseInt(fixedMatch[1], 10) : issues.filter(i => i.fixed).length,
    verifiedClean: verifiedMatch ? verifiedMatch[1].toLowerCase() === 'yes' : false,
  };
}

/** Parse Gemini issues from Claude output */
export function parseGeminiIssues(output: string): GeminiSummary {
  const pattern = /\[(\w+)\]\s+(.+?)(?:\s+\(([^:]+):?(\d+)?\))?(?:\s*-\s*(FIXED|fixed))?$/gm;
  const issues = extractIssues(output, pattern, true);
  return buildIssueSummary(output, issues, 'GEMINI') as GeminiSummary;
}

/** Parse Qodana issues from Claude output */
export function parseQodanaIssues(output: string): QodanaSummary {
  const pattern = /(\w+):\s+(.+?)\s+at\s+([^:]+):(\d+)(?:\s*-\s*(FIXED|fixed))?/gm;
  const issues = extractIssues(output, pattern, true);
  return buildIssueSummary(output, issues, 'QODANA') as QodanaSummary;
}

/** Parse refactor improvements from output */
export function parseRefactorResults(output: string): RefactorSummary {
  const improvements: string[] = [];

  // Check for REFACTORED: (current format, handles markdown ## and **bold**)
  const refactoredMatch = output.match(/(?:##\s*)?\*?\*?REFACTORED:?\*?\*?\s*\n([\s\S]*?)(?=\n\n|\n(?:##\s*)?\*?\*?(?:REFACTOR_COUNT|APPLIED):?\*?\*?|$)/i);
  // Legacy format fallback
  const improvementsMatch = output.match(/IMPROVEMENTS:\s*([\s\S]*?)(?:IMPROVEMENT_COUNT:|$)/);

  const match = refactoredMatch || improvementsMatch;
  if (match) {
    const lines = match[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') && !trimmed.toLowerCase().includes('none needed')) {
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
