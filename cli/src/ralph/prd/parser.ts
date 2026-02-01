/**
 * PRD file parser.
 *
 * Following kernighan: small functions, clear names.
 * Following hevery: pure functions, no side effects, easily testable.
 */

import { Prd, PrdItem, ItemStatus } from '../types.js';

/** Regex pattern for PRD checkboxes */
const CHECKBOX_PATTERN = /^(\s*)[-*]\s*\[([ x])\]\s*(.*)$/i;

/**
 * Parse a PRD file into structured items.
 */
export function parsePrd(filepath: string, content: string): Prd {
  const lines = content.split('\n');
  const items: PrdItem[] = [];

  lines.forEach((line, index) => {
    const match = line.match(CHECKBOX_PATTERN);
    if (match) {
      const [, , checkbox, text] = match;
      const status: ItemStatus = checkbox.toLowerCase() === 'x' ? 'complete' : 'pending';
      items.push({
        lineNumber: index + 1, // 1-indexed
        text: text.trim(),
        status,
      });
    }
  });

  return { filepath, items, raw: content };
}

/**
 * Count incomplete items in a PRD.
 */
export function countIncomplete(prd: Prd): number {
  return prd.items.filter(item => item.status === 'pending').length;
}

/**
 * Count complete items in a PRD.
 */
export function countComplete(prd: Prd): number {
  return prd.items.filter(item => item.status === 'complete').length;
}

/**
 * Get the next incomplete item.
 */
export function getNextIncomplete(prd: Prd): PrdItem | null {
  return prd.items.find(item => item.status === 'pending') ?? null;
}

/**
 * Get all incomplete items.
 */
export function getIncompleteItems(prd: Prd): PrdItem[] {
  return prd.items.filter(item => item.status === 'pending');
}

/**
 * Check if all items are complete.
 */
export function isAllComplete(prd: Prd): boolean {
  return prd.items.every(item => item.status === 'complete');
}

/**
 * Create a URL-friendly slug from item text.
 * Limited to 50 characters.
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
