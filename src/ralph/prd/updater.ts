/**
 * PRD file updater - marks items complete.
 *
 * Following kernighan: do one thing well.
 * Following hevery: pure transform function, caller handles I/O.
 */

import { Prd, PrdItem } from '../types.js';

/**
 * Mark an item as complete in the PRD content.
 * Returns the updated content string.
 *
 * Pure function - does not write to disk.
 */
export function markItemComplete(prd: Prd, item: PrdItem): string {
  const lines = prd.raw.split('\n');
  const lineIndex = item.lineNumber - 1; // Convert to 0-indexed

  if (lineIndex < 0 || lineIndex >= lines.length) {
    throw new Error(`Invalid line number: ${item.lineNumber}`);
  }

  const line = lines[lineIndex];

  // Replace [ ] with [x]
  const updated = line.replace(/\[\s*\]/, '[x]');

  if (updated === line) {
    throw new Error(`Line ${item.lineNumber} does not contain an incomplete checkbox`);
  }

  lines[lineIndex] = updated;
  return lines.join('\n');
}

/**
 * Mark an item as incomplete in the PRD content.
 * Returns the updated content string.
 *
 * Pure function - does not write to disk.
 */
function markItemIncomplete(prd: Prd, item: PrdItem): string {
  const lines = prd.raw.split('\n');
  const lineIndex = item.lineNumber - 1;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    throw new Error(`Invalid line number: ${item.lineNumber}`);
  }

  const line = lines[lineIndex];

  // Replace [x] with [ ]
  const updated = line.replace(/\[x\]/i, '[ ]');

  if (updated === line) {
    throw new Error(`Line ${item.lineNumber} does not contain a complete checkbox`);
  }

  lines[lineIndex] = updated;
  return lines.join('\n');
}
