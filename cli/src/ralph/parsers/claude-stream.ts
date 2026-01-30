/**
 * Claude JSON stream parser.
 *
 * Claude outputs newline-delimited JSON objects.
 * This parses that stream format and extracts results.
 *
 * Following kernighan: handle the messy reality of streamed output.
 * Following hevery: single source of truth for markers.
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

/** Claude stream message types */
type MessageType = 'system' | 'user' | 'assistant' | 'result';

interface StreamMessage {
  type?: MessageType;
  text?: string;
  result?: string;
  tool_use?: {
    name: string;
    input: Record<string, unknown>;
  };
}

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

/**
 * Extract result from JSON stream content.
 * Pure function for testing.
 */
export function extractResultFromContent(content: string): string {
  // Try to find explicit "result" field first
  const resultMatch = content.match(/"result"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
  if (resultMatch && resultMatch[1]) {
    return unescapeJson(resultMatch[1]);
  }

  // Fall back to searching text blocks for markers
  for (const marker of SUCCESS_MARKERS) {
    const pattern = new RegExp(`"text"\\s*:\\s*"([^"]*${marker}[^"]*)"`, 'i');
    const match = content.match(pattern);
    if (match && match[1]) {
      return unescapeJson(match[1]);
    }
  }

  // Last resort: get the last text block
  const textMatches = content.match(/"text"\s*:\s*"([^"]+)"/g);
  if (textMatches && textMatches.length > 0) {
    const last = textMatches[textMatches.length - 1];
    const valueMatch = last.match(/"text"\s*:\s*"([^"]+)"/);
    if (valueMatch) {
      return unescapeJson(valueMatch[1]);
    }
  }

  return '';
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
