/**
 * Parser for APPLIED section in Claude's output.
 *
 * Following clarity: single responsibility - parsing only.
 */

/** Pattern to match APPLIED section with markdown formatting */
const APPLIED_SECTION_PATTERN = /\n(?:##\s*)?\*?\*?APPLIED:?\*?\*?\s*\n([\s\S]*?)(?=\n(?:##\s*)?\*?\*?[A-Z_]+(?:_COMPLETE)?:?\*?\*?|\n\*?\*?[A-Z_]+_COMPLETE\*?\*?\s*(?:\n|$))/i;

/** Fallback pattern - capture until end of string */
const APPLIED_FALLBACK_PATTERN = /\n(?:##\s*)?\*?\*?APPLIED:?\*?\*?\s*\n([\s\S]*)$/i;

/** Pattern to match bullet format */
const BULLET_PATTERN = /^[-•*]\s/;
const NUMBERED_PATTERN = /^\d+\.\s/;

/** Pattern to match expert name format */
const EXPERT_NAME_PATTERN = /^\[?[a-z][a-z0-9-]*\]?:/i;

/** Extract APPLIED section content from raw output */
function extractAppliedBlock(rawOutput: string): string | null {
  const match = rawOutput.match(APPLIED_SECTION_PATTERN);
  if (match) return match[1].trim();

  const fallback = rawOutput.match(APPLIED_FALLBACK_PATTERN);
  return fallback ? fallback[1].trim() : null;
}

/** Check if line is a valid bullet point */
function isBulletLine(line: string): boolean {
  return BULLET_PATTERN.test(line) || NUMBERED_PATTERN.test(line);
}

/** Clean bullet and markdown from line */
function cleanBulletLine(line: string): string {
  return line
    .replace(/^[-•*]\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\*\*/g, '')
    .trim();
}

/** Check if content is a valid APPLIED entry */
function isValidAppliedEntry(content: string): boolean {
  if (!content || !content.includes(':')) return false;
  if (content.startsWith('`') || content.startsWith('(')) return false;
  return EXPERT_NAME_PATTERN.test(content);
}

/** Clean expert name format (remove brackets) */
function cleanExpertEntry(content: string): string {
  return content.replace(/^\[([^\]]+)\]:/, '$1:');
}

/**
 * Parse APPLIED section from Claude's output.
 * Returns list of "expert-name: decision" strings.
 */
export function parseAppliedSection(rawOutput: string): string[] {
  const block = extractAppliedBlock(rawOutput);
  if (!block) return [];

  const lines: string[] = [];

  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!isBulletLine(trimmed)) continue;

    const content = cleanBulletLine(trimmed);
    if (!isValidAppliedEntry(content)) continue;

    lines.push(cleanExpertEntry(content));
  }

  return lines;
}
