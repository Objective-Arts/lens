/**
 * Phase output display - formatting and printing phase results.
 *
 * Following kernighan: display logic separate from parsing.
 * Following feathers: parsing extracted to issue-parser.ts for testability.
 */

import chalk from 'chalk';

// Re-export types and parsing functions for backward compatibility
export {
  IssueSeverity,
  PhaseIssue,
  PhaseOutput,
  parsePhaseOutput,
} from './issue-parser.js';

import type { IssueSeverity, PhaseIssue, PhaseOutput } from './issue-parser.js';

/** Severity icons for display */
const SEVERITY_ICONS: Record<IssueSeverity, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MODERATE: '🟡',
  LOW: '⚪',
  INFO: '💬',
};

/** Severity colors for display */
const SEVERITY_COLORS: Record<IssueSeverity, (s: string) => string> = {
  CRITICAL: chalk.red,
  HIGH: chalk.yellow,
  MODERATE: chalk.dim,
  LOW: chalk.dim,
  INFO: chalk.dim,
};

/** Print a single issue with icon and location */
function printIssue(issue: PhaseIssue): void {
  const icon = SEVERITY_ICONS[issue.severity];
  const color = SEVERITY_COLORS[issue.severity];
  console.log(`        ${icon} ${color(issue.description)}`);
  console.log(chalk.dim(`           ${issue.file}:${issue.line}`));
}

/** Print issues list with header and truncation */
function printIssuesList(
  issues: PhaseIssue[],
  maxIssues: number,
  totalCount: number,
  source?: string
): void {
  const label = source ? `${source} Issues Found` : 'Issues Found';
  console.log(`      ${label} (${totalCount}):`);

  const displayIssues = issues.slice(0, maxIssues);
  for (const issue of displayIssues) {
    printIssue(issue);
  }

  if (issues.length > maxIssues) {
    console.log(chalk.dim(`        ... and ${issues.length - maxIssues} more`));
  }
  console.log('');
}

/** Print fixed issues section */
function printFixedSection(fixed: PhaseIssue[]): void {
  console.log(`      Issues Fixed (${fixed.length}):`);
  for (const issue of fixed) {
    console.log(chalk.green(`        ✓ ${issue.description}`));
  }
  console.log('');
}

/** Print phase results to terminal */
export function printPhaseResults(
  phaseName: string,
  output: PhaseOutput,
  source?: string,
  maxIssues = 5
): void {
  const totalIssues = output.issues.length + output.fixed.length;

  if (totalIssues === 0) {
    console.log(chalk.green(`      ✓ No ${source ? source + ' ' : ''}issues found`));
    return;
  }

  if (output.issues.length > 0) {
    printIssuesList(output.issues, maxIssues, output.issues.length, source);
  }
  if (output.fixed.length > 0) {
    printFixedSection(output.fixed);
  }
}

/** Build summary parts from output */
function buildSummaryParts(output: PhaseOutput, total: number): string[] {
  const parts: string[] = [];

  if (total > 0) {
    parts.push(`${total} issues`);
    parts.push(`${output.fixed.length} fixed`);
    if (output.remaining > 0) {
      parts.push(`${output.remaining} remaining`);
    }
  }

  if (output.info.length > 0) {
    parts.push(`${output.info.length} info`);
  }

  // Only show "verified clean" if no remaining issues
  if (output.verifiedClean && output.remaining === 0 && output.issues.length === 0) {
    parts.push('verified clean');
  }

  return parts;
}

/** Get a compact summary string for phase results */
export function getPhaseResultSummary(output: PhaseOutput): string {
  // Use fixed.length only when no unfixed issues (avoids double-counting)
  const total = output.issues.length > 0
    ? output.issues.length + output.fixed.length
    : output.fixed.length;

  if (total === 0 && output.info.length === 0) {
    return 'No issues found';
  }

  const parts = buildSummaryParts(output, total);
  return parts.length > 0 ? parts.join(', ') : 'No issues found';
}
