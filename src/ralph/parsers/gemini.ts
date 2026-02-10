/**
 * Gemini review output parser.
 *
 * Following clarity: handle edge cases explicitly.
 * Following testability: pure function, all inputs explicit.
 */

import { GeminiResult } from '../types.js';

/**
 * Patterns for extracting Gemini metrics.
 * Handles both plain text and markdown bold formats.
 */
const PATTERNS = {
  totalIssues: /\*?\*?GEMINI_ISSUES:?\*?\*?\s*(\d+)/i,
  criticalHigh: /\*?\*?CRITICAL_HIGH:?\*?\*?\s*(\d+)/i,
  issuesFixed: /\*?\*?ISSUES_FIXED:?\*?\*?\s*(\d+)/i,
  verifiedClean: /\*?\*?VERIFIED_CLEAN:?\*?\*?\s*(yes|no|true|false)/i,
  reviewComplete: /REVIEW_COMPLETE/i,
};

/**
 * Parse Gemini review output into structured result.
 *
 * @param raw - Raw output from Gemini review (may include markdown)
 * @returns Parsed result with metrics
 */
export function parseGeminiOutput(raw: string): GeminiResult {
  const totalMatch = raw.match(PATTERNS.totalIssues);
  const criticalMatch = raw.match(PATTERNS.criticalHigh);
  const fixedMatch = raw.match(PATTERNS.issuesFixed);
  const cleanMatch = raw.match(PATTERNS.verifiedClean);

  return {
    totalIssues: totalMatch ? parseInt(totalMatch[1], 10) : 0,
    criticalHigh: criticalMatch ? parseInt(criticalMatch[1], 10) : 0,
    issuesFixed: fixedMatch ? parseInt(fixedMatch[1], 10) : 0,
    verifiedClean: cleanMatch
      ? ['yes', 'true'].includes(cleanMatch[1].toLowerCase())
      : false,
    raw,
  };
}

export function isValidGeminiOutput(raw: string): boolean {
  return PATTERNS.reviewComplete.test(raw) || PATTERNS.totalIssues.test(raw);
}

/**
 * Extract summary line for display.
 */
export function getGeminiSummary(result: GeminiResult): string {
  if (result.totalIssues === 0) {
    return 'No issues found';
  }

  const parts: string[] = [];
  parts.push(`${result.totalIssues} issues`);

  if (result.criticalHigh > 0) {
    parts.push(`${result.criticalHigh} critical/high`);
  }

  if (result.issuesFixed > 0) {
    parts.push(`${result.issuesFixed} fixed`);
  }

  // Only show "verified clean" if all issues are fixed
  if (result.verifiedClean && result.issuesFixed >= result.totalIssues) {
    parts.push('verified clean');
  }

  return parts.join(', ');
}
