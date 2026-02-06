/**
 * Issue parsing patterns - centralized regex definitions.
 *
 * Following clarity: each pattern has ONE purpose, clearly documented.
 * All patterns handle markdown formatting (##, **bold**).
 */

/** Markdown prefix pattern - handles ##, ###, ** formatting */
const MD_PREFIX = '(?:#{1,3}\\s*)?\\*?\\*?';
const MD_SUFFIX = ':?\\*?\\*?';

/** Severity levels recognized by parsers */
const SEVERITY_PATTERN = '(CRITICAL|HIGH|MODERATE|MEDIUM|LOW|INFO)';

/** Bullet prefix - dash, bullet, asterisk, or numbered list */
const BULLET = '(?:[-•*]|\\d+\\.)?';

/**
 * Section header patterns for state machine.
 * Each returns new state when matched.
 */
export const SECTION_PATTERNS = {
  issuesFound: new RegExp(`${MD_PREFIX}ISSUES_FOUND${MD_SUFFIX}`, 'i'),
  issuesFixed: new RegExp(`${MD_PREFIX}ISSUES_FIXED${MD_SUFFIX}`, 'i'),
  summary: new RegExp(`${MD_PREFIX}SUMMARY${MD_SUFFIX}`, 'i'),
  skip: new RegExp(`${MD_PREFIX}(?:NOT\\s*FIXED|Application-Level|SKIPPED|INFO_NOTED|INFO\\s*NOTED|CANNOT_FIX|CANNOT\\s*FIX)${MD_SUFFIX}`, 'i'),
} as const;

/**
 * Issue line patterns - tried in order until one matches.
 * Each pattern captures: [1]=severity, [2]=description, [3]=file?, [4]=line?
 */
export const ISSUE_PATTERNS = {
  /** Markdown table with file:line: | [SEVERITY] | desc | `file:line` | */
  tableWithLoc: /^\|\s*\[?(CRITICAL|HIGH|MODERATE|LOW|INFO|MEDIUM)\]?\s*\|\s*(.+?)\s*\|\s*`?([^`|]+?):(\d+)`?\s*\|/i,

  /** Markdown table without line: | [SEVERITY] | desc | location | */
  tableAnyLoc: /^\|\s*\[?(CRITICAL|HIGH|MODERATE|LOW|INFO|MEDIUM)\]?\s*\|\s*(.+?)\s*\|\s*([^|]+?)\s*\|/i,

  /** Standard format with file:line: [SEVERITY] desc (file:line) */
  withLocation: new RegExp(
    `^\\s*${BULLET}\\s*\\[?${SEVERITY_PATTERN}\\]?\\s+(.+?)\\s+\\((?:file:)?(.+?):(\\d+)\\)`,
    'i'
  ),

  /** Format without location: [SEVERITY] desc */
  withoutLocation: new RegExp(
    `^\\s*${BULLET}\\s*\\[?${SEVERITY_PATTERN}\\]?\\s+(.+?)(?:\\s+-\\s*FIXED)?(?:\\s+\\[source:|\\s*$)`,
    'i'
  ),
} as const;

/** Pattern to detect FIXED marker in line */
export const FIXED_MARKER = /\s+-\s*FIXED\s*$/i;

/** Pattern to detect FIXED anywhere in line */
export const HAS_FIXED = /FIXED/i;

/** Summary field patterns */
export const SUMMARY_PATTERNS = {
  verifiedClean: /\*?\*?VERIFIED_CLEAN:?\*?\*?\s*(yes|no|true|false)/i,
  unfixed: /\*?\*?UNFIXED:?\*?\*?\s*(\d+)/i,
  remaining: /\*?\*?REMAINING:?\*?\*?\s*(\d+)/i,
} as const;

/** Extract file:line from location string */
export const FILE_LINE_EXTRACT = /([^:]+):(\d+)/;
