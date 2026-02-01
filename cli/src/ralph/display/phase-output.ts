/**
 * Phase output parsing and display.
 *
 * Parses structured issue output from adversarial-review and static-analysis phases.
 * Following kernighan: handle edge cases explicitly.
 * Following hevery: pure functions, all inputs explicit.
 */

import chalk from 'chalk';

/** Severity levels for phase issues */
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

/** A single issue found during phase execution */
export interface PhaseIssue {
  severity: IssueSeverity;
  description: string;
  file: string;
  line: number;
  fixed: boolean;
}

/** Parsed phase output with issues and summary */
export interface PhaseOutput {
  issues: PhaseIssue[];
  fixed: PhaseIssue[];
  remaining: number;
  verifiedClean: boolean;
}

/** Severity icons for display */
const SEVERITY_ICONS: Record<IssueSeverity, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MODERATE: '🟡',
  LOW: '⚪',
};

/** Severity colors for display */
const SEVERITY_COLORS: Record<IssueSeverity, (s: string) => string> = {
  CRITICAL: chalk.red,
  HIGH: chalk.yellow,
  MODERATE: chalk.dim,
  LOW: chalk.dim,
};

/**
 * Pattern to match issue lines.
 * Format: [SEVERITY] description (file:line)
 * Examples:
 *   [CRITICAL] SQL injection vulnerability (src/api/users.ts:45)
 *   [HIGH] Missing input validation (src/handlers/upload.ts:23)
 */
const ISSUE_PATTERN = /^\s*\[?(CRITICAL|HIGH|MODERATE|LOW)\]?\s+(.+?)\s+\(([^:]+):(\d+)\)/i;

/**
 * Pattern to match fixed issue markers.
 * Format: [SEVERITY] description (file:line) - FIXED
 */
const FIXED_PATTERN = /\s+-\s*FIXED\s*$/i;

/**
 * Parse raw phase output into structured PhaseOutput.
 *
 * @param raw - Raw output from phase execution
 * @returns Parsed output with issues categorized
 */
export function parsePhaseOutput(raw: string): PhaseOutput {
  const issues: PhaseIssue[] = [];
  const fixed: PhaseIssue[] = [];

  const lines = raw.split('\n');
  let inIssuesFound = false;
  let inIssuesFixed = false;

  for (const line of lines) {
    // Track sections
    if (/ISSUES_FOUND:/i.test(line)) {
      inIssuesFound = true;
      inIssuesFixed = false;
      continue;
    }
    if (/ISSUES_FIXED:/i.test(line)) {
      inIssuesFound = false;
      inIssuesFixed = true;
      continue;
    }
    if (/SUMMARY:/i.test(line)) {
      inIssuesFound = false;
      inIssuesFixed = false;
      continue;
    }

    // Parse issue lines
    const match = line.match(ISSUE_PATTERN);
    if (match) {
      const isFixed = FIXED_PATTERN.test(line) || inIssuesFixed;
      const issue: PhaseIssue = {
        severity: match[1].toUpperCase() as IssueSeverity,
        description: match[2].replace(FIXED_PATTERN, '').trim(),
        file: match[3],
        line: parseInt(match[4], 10),
        fixed: isFixed,
      };

      if (isFixed) {
        fixed.push(issue);
      } else {
        issues.push(issue);
      }
    }
  }

  // Parse verified clean status
  const cleanMatch = raw.match(/VERIFIED_CLEAN:\s*(yes|no|true|false)/i);
  const verifiedClean = cleanMatch
    ? ['yes', 'true'].includes(cleanMatch[1].toLowerCase())
    : false;

  // Parse remaining count or calculate it
  const remainingMatch = raw.match(/REMAINING:\s*(\d+)/i);
  const remaining = remainingMatch
    ? parseInt(remainingMatch[1], 10)
    : issues.filter(i => !i.fixed).length;

  return {
    issues,
    fixed,
    remaining,
    verifiedClean,
  };
}

/**
 * Print phase results to terminal.
 *
 * Following rams: less but better, minimal decoration.
 * Following norman: feedback and mental models, show system state clearly.
 *
 * @param phaseName - Name of the phase (for header)
 * @param output - Parsed phase output
 * @param maxIssues - Maximum issues to display (default 5)
 */
export function printPhaseResults(
  phaseName: string,
  output: PhaseOutput,
  maxIssues: number = 5
): void {
  const totalIssues = output.issues.length + output.fixed.length;

  if (totalIssues === 0) {
    console.log(chalk.green('      ✓ No issues found'));
    return;
  }

  // Issues found section
  if (output.issues.length > 0 || output.fixed.length > 0) {
    console.log(`      Issues Found (${totalIssues}):`);
    const allIssues = [...output.issues, ...output.fixed];
    const displayIssues = allIssues.slice(0, maxIssues);

    for (const issue of displayIssues) {
      const icon = SEVERITY_ICONS[issue.severity];
      const color = SEVERITY_COLORS[issue.severity];
      console.log(`        ${icon} ${color(issue.description)}`);
      console.log(chalk.dim(`           ${issue.file}:${issue.line}`));
    }

    if (allIssues.length > maxIssues) {
      console.log(chalk.dim(`        ... and ${allIssues.length - maxIssues} more`));
    }
    console.log('');
  }

  // Issues fixed section
  if (output.fixed.length > 0) {
    console.log(`      Issues Fixed (${output.fixed.length}):`);
    for (const issue of output.fixed) {
      console.log(chalk.green(`        ✓ ${issue.description}`));
    }
    console.log('');
  }

  // Summary line
  const summaryParts: string[] = [];
  summaryParts.push(`${totalIssues} found`);
  summaryParts.push(`${output.fixed.length} fixed`);
  if (output.remaining > 0) {
    summaryParts.push(chalk.yellow(`${output.remaining} remaining`));
  }
  if (output.verifiedClean) {
    summaryParts.push(chalk.green('verified clean'));
  }

  console.log(chalk.dim(`      Summary: ${summaryParts.join(', ')}`));
}

/**
 * Get a compact summary string for phase results.
 *
 * @param output - Parsed phase output
 * @returns Summary string for logs/display
 */
export function getPhaseResultSummary(output: PhaseOutput): string {
  const total = output.issues.length + output.fixed.length;
  if (total === 0) {
    return 'No issues found';
  }

  const parts: string[] = [];
  parts.push(`${total} issues`);
  parts.push(`${output.fixed.length} fixed`);

  if (output.remaining > 0) {
    parts.push(`${output.remaining} remaining`);
  }

  if (output.verifiedClean) {
    parts.push('verified clean');
  }

  return parts.join(', ');
}
