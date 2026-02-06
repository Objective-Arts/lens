/**
 * Claude JSON stream parser.
 *
 * Claude outputs newline-delimited JSON objects.
 * This parses that stream format and extracts results.
 *
 * Following clarity: handle the messy reality of streamed output.
 * Following testability: single source of truth for markers.
 */

import * as fs from 'fs';

/** Success markers - single source of truth */
const SUCCESS_MARKERS = [
  'PLAN_COMPLETE',
  'STRUCTURE_COMPLETE',
  'IMPLEMENT_COMPLETE',
  'TEST_COUNT:',
  'REFACTOR_COMPLETE',
  'REVIEW_ISSUES:',
  'ANALYSIS_ISSUES:',
  'DOC_COMPLETE',
  // Alternative markers for flexible matching
  'VERIFIED_CLEAN:',
  'GEMINI_RESULT:',
  'QODANA_RESULT:',
  'ISSUES_FOUND:',
  'No issues found',
] as const;

/** Failure markers - single source of truth */
const FAILURE_MARKERS = [
  'PLAN_FAILED',
  'STRUCTURE_FAILED',
  'IMPLEMENT_FAILED',
  'TEST_FAILED',
  'REFACTOR_FAILED',
  'REVIEW_FAILED',
  'ANALYSIS_FAILED',
  'DOC_FAILED',
] as const;

/**
 * Parse Claude's JSON stream file and extract the final result.
 *
 * @param jsonPath - Path to the .json stream file
 * @returns The extracted result text, or empty string if not found
 */
export function extractResult(jsonPath: string): string {
  if (!fs.existsSync(jsonPath)) {
    return '';
  }

  const content = fs.readFileSync(jsonPath, 'utf-8');
  return extractResultFromContent(content);
}

/** Extract all text values from JSON stream content. */
function extractAllTextBlocks(content: string): string[] {
  const blocks: string[] = [];
  const pattern = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    blocks.push(unescapeJson(match[1]));
  }
  return blocks;
}

/**
 * Extract result from JSON stream content.
 * Concatenates all assistant text blocks to preserve APPLIED sections.
 */
export function extractResultFromContent(content: string): string {
  // Try to find explicit "result" field first
  const resultMatch = content.match(/"result"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (resultMatch && resultMatch[1]) {
    return unescapeJson(resultMatch[1]);
  }

  // Collect all text blocks and concatenate
  const allBlocks = extractAllTextBlocks(content);
  if (allBlocks.length === 0) return '';

  // Check if any block contains a success marker
  const hasSuccess = SUCCESS_MARKERS.some(marker =>
    allBlocks.some(block => block.includes(marker))
  );

  // If successful, return all blocks concatenated to preserve APPLIED section
  if (hasSuccess) {
    return allBlocks.join('\n');
  }

  // Last resort: return all blocks
  return allBlocks.join('\n');
}

/**
 * Unescape JSON string escape sequences.
 */
function unescapeJson(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Check if the stream indicates success.
 */
export function isSuccessfulRun(content: string): boolean {
  return SUCCESS_MARKERS.some(marker => content.includes(marker));
}

/**
 * Check if the stream indicates failure.
 */
export function isFailedRun(content: string): boolean {
  return FAILURE_MARKERS.some(marker => content.includes(marker));
}

/**
 * Extract error message from failed run.
 */
export function extractError(content: string): string | null {
  const patterns = [
    /FAILED[:\s]+(.+?)(?:\n|$)/i,
    /Error[:\s]+(.+?)(?:\n|$)/i,
    /error"?\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}
