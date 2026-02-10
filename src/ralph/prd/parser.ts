/**
 * PRD file parser.
 *
 * Following clarity: small functions, clear names.
 * Following testability: pure functions, no side effects, easily testable.
 */

import { Prd, PrdItem, ItemStatus } from '../types.js';

/** Regex pattern for PRD checkboxes */
const CHECKBOX_PATTERN = /^(\s*)[-*]\s*\[([ x])\]\s*(.*)$/i;

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

export function countIncomplete(prd: Prd): number {
  return prd.items.filter(item => item.status === 'pending').length;
}

export function countComplete(prd: Prd): number {
  return prd.items.filter(item => item.status === 'complete').length;
}

export function getNextIncomplete(prd: Prd): PrdItem | null {
  return prd.items.find(item => item.status === 'pending') ?? null;
}

export function getIncompleteItems(prd: Prd): PrdItem[] {
  return prd.items.filter(item => item.status === 'pending');
}

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
