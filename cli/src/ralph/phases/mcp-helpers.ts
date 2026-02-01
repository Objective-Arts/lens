/**
 * Shared helpers for MCP-based phases (independent-review, static-analysis, security-review).
 *
 * Following kernighan: single-responsibility, no duplication.
 * Following gang-of-four: Template Method pattern via composition.
 */

import { parsePhaseOutput, getPhaseResultSummary, PhaseOutput } from '../display/phase-output.js';

/** Check if output indicates no code to analyze. */
export function hasNoCode(output: string, indicators: readonly string[]): boolean {
  const lower = output.toLowerCase();
  return indicators.some(indicator => lower.includes(indicator));
}

/** Common no-code indicators. */
export const NO_CODE_INDICATORS = ['no code', 'nothing to review', 'no files', 'no implementation', 'nonexistent code'] as const;
export const NO_ANALYSIS_INDICATORS = ['no code', 'nothing to analyze', 'no files', 'no implementation'] as const;

/** Parse MCP tool status from output. */
export function parseToolStatus(
  output: string,
  statusKey: string,
  evidencePatterns: readonly string[]
): { status: string; wasInvoked: boolean } {
  // Handle markdown formatting: **GEMINI_RESULT:** or GEMINI_RESULT:
  const regex = new RegExp(`\\*?\\*?${statusKey}:?\\*?\\*?\\s*(\\w+)`, 'i');
  const match = output.match(regex);
  const status = match ? match[1] : 'not called';

  const wasInvoked = evidencePatterns.some(pattern =>
    output.toLowerCase().includes(pattern.toLowerCase())
  );

  return { status, wasInvoked };
}

/** Evidence patterns for Gemini. */
export const GEMINI_EVIDENCE = ['gemini_review', 'mcp__gemini', 'gemini found', 'gemini reported'] as const;

/** Evidence patterns for Qodana. */
export const QODANA_EVIDENCE = ['qodana_scan', 'qodana_problems', 'mcp__qodana', 'qodana found', 'qodana reported'] as const;

/** Parse issue count from output (with markdown handling). */
export function parseIssueCount(output: string, key: string, fallback: number): number {
  const regex = new RegExp(`\\*?\\*?${key}:?\\*?\\*?\\s*(\\d+)`);
  const match = output.match(regex);
  return match ? parseInt(match[1], 10) : fallback;
}

/** Build metrics object for phase result. */
export interface PhaseMetrics {
  issues: number;
  fixed: number;
  remaining: number;
  verifiedClean: number;
  toolCalled: number;
}

export function buildPhaseMetrics(phaseOutput: PhaseOutput, toolCalled: boolean): PhaseMetrics {
  return {
    issues: phaseOutput.issues.length + phaseOutput.fixed.length,
    fixed: phaseOutput.fixed.length,
    remaining: phaseOutput.remaining,
    verifiedClean: phaseOutput.verifiedClean ? 1 : 0,
    toolCalled: toolCalled ? 1 : 0,
  };
}

/** Format success message with tool status. */
export function formatSuccessMessage(summary: string, toolName: string, toolStatus: string): string {
  return `${summary} [${toolName}: ${toolStatus}]`;
}

/** Common phase execution result. */
export interface MpcPhaseResult {
  phaseOutput: PhaseOutput;
  summary: string;
  toolStatus: string;
  wasInvoked: boolean;
  issueCount: number;
}

/** Parse common MCP phase output. */
export function parseMcpPhaseOutput(
  output: string,
  statusKey: string,
  issueKey: string,
  evidencePatterns: readonly string[]
): MpcPhaseResult {
  const phaseOutput = parsePhaseOutput(output);
  const summary = getPhaseResultSummary(phaseOutput);
  const { status: toolStatus, wasInvoked } = parseToolStatus(output, statusKey, evidencePatterns);
  const issueCount = parseIssueCount(output, issueKey, phaseOutput.issues.length + phaseOutput.fixed.length);

  return { phaseOutput, summary, toolStatus, wasInvoked, issueCount };
}
