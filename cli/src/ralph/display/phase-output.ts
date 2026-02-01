/**
 * Phase output parsing and display.
 *
 * Parses structured issue output from adversarial-review and static-analysis phases.
 * Following kernighan: handle edge cases explicitly.
 * Following hevery: pure functions, all inputs explicit.
 */

import chalk from 'chalk';

/** Severity levels for phase issues */
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';

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
  info: PhaseIssue[];  // INFO items shown separately
  remaining: number;
  verifiedClean: boolean;
}

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

/**
 * Pattern to match issue lines with file:line.
 * Format: [SEVERITY] description (file:line) or (file:path:line)
 */
const ISSUE_PATTERN_WITH_LOC = /^\s*[-•*]?\s*\[?(CRITICAL|HIGH|MODERATE|LOW|INFO)\]?\s+(.+?)\s+\((?:file:)?(.+?):(\d+)\)/i;

/**
 * Pattern to match markdown table format from Gemini with file:line.
 * Format: | [SEVERITY] | description | `file:line` |
 */
const TABLE_PATTERN_WITH_LOC = /^\|\s*\[?(CRITICAL|HIGH|MODERATE|LOW|INFO|MEDIUM)\]?\s*\|\s*(.+?)\s*\|\s*`?([^`|]+?):(\d+)`?\s*\|/i;

/**
 * Pattern to match markdown table format without strict file:line.
 * Format: | [SEVERITY] | description | location |
 */
const TABLE_PATTERN_ANY = /^\|\s*\[?(CRITICAL|HIGH|MODERATE|LOW|INFO|MEDIUM)\]?\s*\|\s*(.+?)\s*\|\s*([^|]+?)\s*\|/i;

/**
 * Pattern to match issue lines without file:line (for FIXED entries, INFO, etc).
 * Format: [SEVERITY] description or [SEVERITY] description - FIXED
 */
const ISSUE_PATTERN_NO_LOC = /^\s*[-•*]?\s*\[?(CRITICAL|HIGH|MODERATE|LOW|INFO)\]?\s+(.+?)(?:\s+-\s*FIXED)?(?:\s+\[source:|\s*$)/i;

/**
 * Pattern to match fixed issue markers.
 * Format: [SEVERITY] description (file:line) - FIXED
 */
const FIXED_PATTERN = /\s+-\s*FIXED\s*$/i;

/** Section tracking state */
interface SectionState {
  inIssuesFound: boolean;
  inIssuesFixed: boolean;
}

/** Update section state based on line content. Handles markdown bold markers. */
function updateSectionState(line: string, state: SectionState): SectionState {
  if (/\*?\*?ISSUES_FOUND:?\*?\*?/i.test(line)) return { inIssuesFound: true, inIssuesFixed: false };
  if (/\*?\*?ISSUES_FIXED:?\*?\*?/i.test(line)) return { inIssuesFound: false, inIssuesFixed: true };
  if (/\*?\*?SUMMARY:?\*?\*?/i.test(line)) return { inIssuesFound: false, inIssuesFixed: false };
  return state;
}

/** Normalize severity (MEDIUM -> MODERATE) */
function normalizeSeverity(sev: string): IssueSeverity {
  const upper = sev.toUpperCase();
  if (upper === 'MEDIUM') return 'MODERATE';
  return upper as IssueSeverity;
}

/** Parse a single issue line. Returns null if not an issue line. */
function parseIssueLine(line: string, inIssuesFixed: boolean): PhaseIssue | null {
  // Check for FIXED in table format (may appear as separate column or in description)
  const hasFixedMarker = /FIXED/i.test(line) || inIssuesFixed;

  // Try markdown table format with file:line first
  const tableMatchLoc = line.match(TABLE_PATTERN_WITH_LOC);
  if (tableMatchLoc) {
    return {
      severity: normalizeSeverity(tableMatchLoc[1]),
      description: tableMatchLoc[2].replace(FIXED_PATTERN, '').replace(/\s*\|.*$/, '').trim(),
      file: tableMatchLoc[3].trim(),
      line: parseInt(tableMatchLoc[4], 10),
      fixed: hasFixedMarker,
    };
  }

  // Try markdown table format with any location
  const tableMatchAny = line.match(TABLE_PATTERN_ANY);
  if (tableMatchAny) {
    // Extract file:line from location if possible
    const locMatch = tableMatchAny[3].match(/([^:]+):(\d+)/);
    return {
      severity: normalizeSeverity(tableMatchAny[1]),
      description: tableMatchAny[2].replace(FIXED_PATTERN, '').replace(/\s*\|.*$/, '').trim(),
      file: locMatch ? locMatch[1].replace(/`/g, '').trim() : tableMatchAny[3].trim(),
      line: locMatch ? parseInt(locMatch[2], 10) : 0,
      fixed: hasFixedMarker,
    };
  }

  // Try pattern with file:line
  const matchWithLoc = line.match(ISSUE_PATTERN_WITH_LOC);
  if (matchWithLoc) {
    const isFixed = FIXED_PATTERN.test(line) || inIssuesFixed;
    return {
      severity: normalizeSeverity(matchWithLoc[1]),
      description: matchWithLoc[2].replace(FIXED_PATTERN, '').trim(),
      file: matchWithLoc[3],
      line: parseInt(matchWithLoc[4], 10),
      fixed: isFixed,
    };
  }

  // Try pattern without file:line
  const matchNoLoc = line.match(ISSUE_PATTERN_NO_LOC);
  if (matchNoLoc) {
    const isFixed = FIXED_PATTERN.test(line) || inIssuesFixed;
    return {
      severity: normalizeSeverity(matchNoLoc[1]),
      description: matchNoLoc[2].replace(FIXED_PATTERN, '').replace(/\s+\[source:.*$/, '').trim(),
      file: 'unknown',
      line: 0,
      fixed: isFixed,
    };
  }

  return null;
}

/** Parse verified clean status from raw output. Handles markdown. */
function parseVerifiedClean(raw: string): boolean {
  const match = raw.match(/\*?\*?VERIFIED_CLEAN:?\*?\*?\s*(yes|no|true|false)/i);
  return match ? ['yes', 'true'].includes(match[1].toLowerCase()) : false;
}

/** Parse remaining count from raw output. Handles markdown. */
function parseRemainingCount(raw: string, unfixedCount: number): number {
  const match = raw.match(/\*?\*?REMAINING:?\*?\*?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : unfixedCount;
}

/** Parse raw phase output into structured PhaseOutput. */
export function parsePhaseOutput(raw: string): PhaseOutput {
  const issues: PhaseIssue[] = [];
  const fixed: PhaseIssue[] = [];
  const info: PhaseIssue[] = [];
  let state: SectionState = { inIssuesFound: false, inIssuesFixed: false };

  for (const line of raw.split('\n')) {
    const newState = updateSectionState(line, state);
    if (newState !== state) { state = newState; continue; }

    const issue = parseIssueLine(line, state.inIssuesFixed);
    if (issue) {
      if (issue.severity === 'INFO') {
        info.push(issue);
      } else if (issue.fixed) {
        fixed.push(issue);
      } else {
        issues.push(issue);
      }
    }
  }

  // Calculate remaining: issues that weren't fixed (excluding INFO)
  const remaining = issues.filter(i => !i.fixed).length;

  return {
    issues,
    fixed,
    info,
    remaining: parseRemainingCount(raw, remaining),
    verifiedClean: parseVerifiedClean(raw),
  };
}

/** Print a single issue with icon and location. */
function printIssue(issue: PhaseIssue): void {
  const icon = SEVERITY_ICONS[issue.severity];
  const color = SEVERITY_COLORS[issue.severity];
  console.log(`        ${icon} ${color(issue.description)}`);
  console.log(chalk.dim(`           ${issue.file}:${issue.line}`));
}

/** Print issues found section. */
function printIssuesList(issues: PhaseIssue[], maxIssues: number, totalCount: number, source?: string): void {
  const label = source ? `${source} Issues Found` : 'Issues Found';
  console.log(`      ${label} (${totalCount}):`);
  const displayIssues = issues.slice(0, maxIssues);
  for (const issue of displayIssues) printIssue(issue);
  if (issues.length > maxIssues) {
    console.log(chalk.dim(`        ... and ${issues.length - maxIssues} more`));
  }
  console.log('');
}

/** Print issues fixed section. */
function printFixedSection(fixed: PhaseIssue[]): void {
  console.log(`      Issues Fixed (${fixed.length}):`);
  for (const issue of fixed) {
    console.log(chalk.green(`        ✓ ${issue.description}`));
  }
  console.log('');
}

/** Build summary line parts. */
function buildSummaryParts(output: PhaseOutput, totalCount: number): string[] {
  const parts = [`${totalCount} found`, `${output.fixed.length} fixed`];
  if (output.remaining > 0) parts.push(chalk.yellow(`${output.remaining} remaining`));
  if (output.verifiedClean) parts.push(chalk.green('verified clean'));
  return parts;
}

/** Print phase results to terminal. */
export function printPhaseResults(phaseName: string, output: PhaseOutput, source?: string, maxIssues = 5): void {
  const totalIssues = output.issues.length + output.fixed.length;
  if (totalIssues === 0) {
    console.log(chalk.green(`      ✓ No ${source ? source + ' ' : ''}issues found`));
    return;
  }

  const allIssues = [...output.issues, ...output.fixed];
  if (allIssues.length > 0) printIssuesList(allIssues, maxIssues, totalIssues, source);
  if (output.fixed.length > 0) printFixedSection(output.fixed);
}

/**
 * Get a compact summary string for phase results.
 * INFO items are shown separately, not counted as issues.
 *
 * @param output - Parsed phase output
 * @returns Summary string for logs/display
 */
export function getPhaseResultSummary(output: PhaseOutput): string {
  const total = output.issues.length + output.fixed.length;
  if (total === 0 && output.info.length === 0) {
    return 'No issues found';
  }

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

  if (output.verifiedClean) {
    parts.push('verified clean');
  }

  return parts.length > 0 ? parts.join(', ') : 'No issues found';
}
