/**
 * Issue parsing logic - pure functions for parsing phase output.
 *
 * Following kernighan: small functions, single responsibility.
 * Following feathers: seams for testing each parser independently.
 */

import {
  SECTION_PATTERNS,
  ISSUE_PATTERNS,
  FIXED_MARKER,
  HAS_FIXED,
  SUMMARY_PATTERNS,
  FILE_LINE_EXTRACT,
} from './issue-patterns.js';

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
  info: PhaseIssue[];
  remaining: number;
  verifiedClean: boolean;
}

/** Section tracking state */
interface SectionState {
  inIssuesFound: boolean;
  inIssuesFixed: boolean;
  inSkipSection: boolean;
}

/** Normalize severity (MEDIUM -> MODERATE) */
function normalizeSeverity(sev: string): IssueSeverity {
  const upper = sev.toUpperCase();
  return upper === 'MEDIUM' ? 'MODERATE' : upper as IssueSeverity;
}

/** Clean description text - remove FIXED markers and trailing junk */
function cleanDescription(desc: string): string {
  return desc
    .replace(FIXED_MARKER, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s+\[source:.*$/, '')
    .trim();
}

/** Create issue from match groups */
function createIssue(
  severity: string,
  description: string,
  file: string,
  line: number,
  isFixed: boolean
): PhaseIssue {
  return {
    severity: normalizeSeverity(severity),
    description: cleanDescription(description),
    file,
    line,
    fixed: isFixed,
  };
}

/** Try parsing as markdown table with file:line */
function tryParseTableWithLoc(line: string, hasFixed: boolean): PhaseIssue | null {
  const match = line.match(ISSUE_PATTERNS.tableWithLoc);
  if (!match) return null;
  return createIssue(match[1], match[2], match[3].trim(), parseInt(match[4], 10), hasFixed);
}

/** Try parsing as markdown table with any location */
function tryParseTableAnyLoc(line: string, hasFixed: boolean): PhaseIssue | null {
  const match = line.match(ISSUE_PATTERNS.tableAnyLoc);
  if (!match) return null;
  const locMatch = match[3].match(FILE_LINE_EXTRACT);
  const file = locMatch ? locMatch[1].replace(/`/g, '').trim() : match[3].trim();
  const lineNum = locMatch ? parseInt(locMatch[2], 10) : 0;
  return createIssue(match[1], match[2], file, lineNum, hasFixed);
}

/** Try parsing as standard format with file:line */
function tryParseWithLocation(line: string, inIssuesFixed: boolean): PhaseIssue | null {
  const match = line.match(ISSUE_PATTERNS.withLocation);
  if (!match) return null;
  const isFixed = FIXED_MARKER.test(line) || inIssuesFixed;
  return createIssue(match[1], match[2], match[3], parseInt(match[4], 10), isFixed);
}

/** Try parsing as format without location */
function tryParseWithoutLocation(line: string, inIssuesFixed: boolean): PhaseIssue | null {
  const match = line.match(ISSUE_PATTERNS.withoutLocation);
  if (!match) return null;
  const isFixed = FIXED_MARKER.test(line) || inIssuesFixed;
  return createIssue(match[1], match[2], 'unknown', 0, isFixed);
}

/** Parse a single issue line using strategy chain. Returns null if not an issue. */
export function parseIssueLine(line: string, inIssuesFixed: boolean): PhaseIssue | null {
  const hasFixed = HAS_FIXED.test(line) || inIssuesFixed;

  // Try each parser in order (most specific first)
  return tryParseTableWithLoc(line, hasFixed)
    ?? tryParseTableAnyLoc(line, hasFixed)
    ?? tryParseWithLocation(line, inIssuesFixed)
    ?? tryParseWithoutLocation(line, inIssuesFixed);
}

/** Update section state based on line content */
export function updateSectionState(line: string, state: SectionState): SectionState {
  if (SECTION_PATTERNS.issuesFound.test(line)) {
    return { inIssuesFound: true, inIssuesFixed: false, inSkipSection: false };
  }
  if (SECTION_PATTERNS.issuesFixed.test(line)) {
    return { inIssuesFound: false, inIssuesFixed: true, inSkipSection: false };
  }
  if (SECTION_PATTERNS.summary.test(line)) {
    return { inIssuesFound: false, inIssuesFixed: false, inSkipSection: false };
  }
  if (SECTION_PATTERNS.skip.test(line)) {
    return { inIssuesFound: false, inIssuesFixed: false, inSkipSection: true };
  }
  return state;
}

/** Parse verified clean status from raw output */
export function parseVerifiedClean(raw: string): boolean {
  const match = raw.match(SUMMARY_PATTERNS.verifiedClean);
  return match ? ['yes', 'true'].includes(match[1].toLowerCase()) : false;
}

/** Parse remaining/unfixed count from raw output */
export function parseRemainingCount(raw: string, fallback: number): number {
  const unfixedMatch = raw.match(SUMMARY_PATTERNS.unfixed);
  if (unfixedMatch) return parseInt(unfixedMatch[1], 10);

  const remainingMatch = raw.match(SUMMARY_PATTERNS.remaining);
  return remainingMatch ? parseInt(remainingMatch[1], 10) : fallback;
}

/** Categorize issue into appropriate bucket */
function categorizeIssue(
  issue: PhaseIssue,
  issues: PhaseIssue[],
  fixed: PhaseIssue[],
  info: PhaseIssue[]
): void {
  if (issue.severity === 'INFO') {
    info.push(issue);
  } else if (issue.fixed) {
    fixed.push(issue);
  } else {
    issues.push(issue);
  }
}

/** Parse raw phase output into structured PhaseOutput */
export function parsePhaseOutput(raw: string): PhaseOutput {
  const issues: PhaseIssue[] = [];
  const fixed: PhaseIssue[] = [];
  const info: PhaseIssue[] = [];
  let state: SectionState = { inIssuesFound: false, inIssuesFixed: false, inSkipSection: false };

  for (const line of raw.split('\n')) {
    const newState = updateSectionState(line, state);
    if (newState !== state) { state = newState; continue; }
    if (state.inSkipSection) continue;

    const issue = parseIssueLine(line, state.inIssuesFixed);
    if (issue) categorizeIssue(issue, issues, fixed, info);
  }

  const unfixedCount = issues.filter(i => !i.fixed).length;

  return {
    issues,
    fixed,
    info,
    remaining: parseRemainingCount(raw, unfixedCount),
    verifiedClean: parseVerifiedClean(raw),
  };
}
