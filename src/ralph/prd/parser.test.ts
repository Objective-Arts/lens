/**
 * PRD Parser Tests
 *
 * Following testability: Testing pure functions directly, no mocks needed.
 * Following react-test: Test behavior, not implementation details.
 */

import { describe, it, expect } from 'vitest';
import {
  parsePrd,
  countIncomplete,
  countComplete,
  getNextIncomplete,
  getIncompleteItems,
  isAllComplete,
  createSlug,
} from './parser.js';
import { Prd, PrdItem } from '../types.js';

describe('PRD Parser', () => {
  describe('parsePrd', () => {
    it('parses empty file as empty items list', () => {
      const prd = parsePrd('/test/prd.md', '');

      expect(prd.filepath).toBe('/test/prd.md');
      expect(prd.items).toHaveLength(0);
      expect(prd.raw).toBe('');
    });

    it('parses single incomplete item', () => {
      const content = '- [ ] Implement login feature';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items).toHaveLength(1);
      expect(prd.items[0]).toEqual({
        lineNumber: 1,
        text: 'Implement login feature',
        status: 'pending',
      });
    });

    it('parses single complete item', () => {
      const content = '- [x] Implement login feature';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items).toHaveLength(1);
      expect(prd.items[0]).toEqual({
        lineNumber: 1,
        text: 'Implement login feature',
        status: 'complete',
      });
    });

    it('parses uppercase X as complete', () => {
      const content = '- [X] Implement login feature';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items[0].status).toBe('complete');
    });

    it('parses asterisk list markers', () => {
      const content = '* [ ] Item with asterisk';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items).toHaveLength(1);
      expect(prd.items[0].text).toBe('Item with asterisk');
    });

    it('parses multiple items preserving order', () => {
      const content = `# PRD

- [x] First item
- [ ] Second item
- [x] Third item
- [ ] Fourth item`;

      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items).toHaveLength(4);
      expect(prd.items.map(i => i.status)).toEqual([
        'complete', 'pending', 'complete', 'pending'
      ]);
      expect(prd.items.map(i => i.lineNumber)).toEqual([3, 4, 5, 6]);
    });

    it('ignores non-checkbox lines', () => {
      const content = `# Header

This is a paragraph.

- [x] Actual item
- Regular list item
- [ ] Another item

Some other text.`;

      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items).toHaveLength(2);
      expect(prd.items[0].text).toBe('Actual item');
      expect(prd.items[1].text).toBe('Another item');
    });

    it('preserves raw content unchanged', () => {
      const content = '# PRD\n\n- [ ] Item 1\n- [x] Item 2';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.raw).toBe(content);
    });

    it('handles items with special characters', () => {
      const content = '- [ ] Add `code` and **bold** formatting';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items[0].text).toBe('Add `code` and **bold** formatting');
    });

    it('handles items with colons', () => {
      const content = '- [ ] API: Implement /users endpoint';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items[0].text).toBe('API: Implement /users endpoint');
    });

    it('handles indented checkboxes', () => {
      const content = '  - [ ] Indented item';
      const prd = parsePrd('/test/prd.md', content);

      expect(prd.items).toHaveLength(1);
      expect(prd.items[0].text).toBe('Indented item');
    });

    it('handles checkbox with extra space', () => {
      const content = '- [  ] Item with extra space';
      // Current implementation only matches single space or x
      const prd = parsePrd('/test/prd.md', content);

      // This should NOT match - extra space is invalid
      expect(prd.items).toHaveLength(0);
    });
  });

  describe('countIncomplete', () => {
    it('returns 0 for empty PRD', () => {
      const prd = createPrd([]);
      expect(countIncomplete(prd)).toBe(0);
    });

    it('counts all pending items', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'pending' },
        { lineNumber: 2, text: 'Item 2', status: 'complete' },
        { lineNumber: 3, text: 'Item 3', status: 'pending' },
      ]);

      expect(countIncomplete(prd)).toBe(2);
    });

    it('returns 0 when all complete', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'complete' },
        { lineNumber: 2, text: 'Item 2', status: 'complete' },
      ]);

      expect(countIncomplete(prd)).toBe(0);
    });
  });

  describe('countComplete', () => {
    it('returns 0 for empty PRD', () => {
      const prd = createPrd([]);
      expect(countComplete(prd)).toBe(0);
    });

    it('counts all complete items', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'pending' },
        { lineNumber: 2, text: 'Item 2', status: 'complete' },
        { lineNumber: 3, text: 'Item 3', status: 'complete' },
      ]);

      expect(countComplete(prd)).toBe(2);
    });
  });

  describe('getNextIncomplete', () => {
    it('returns null for empty PRD', () => {
      const prd = createPrd([]);
      expect(getNextIncomplete(prd)).toBeNull();
    });

    it('returns first pending item', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Complete', status: 'complete' },
        { lineNumber: 2, text: 'First Pending', status: 'pending' },
        { lineNumber: 3, text: 'Second Pending', status: 'pending' },
      ]);

      const item = getNextIncomplete(prd);
      expect(item?.text).toBe('First Pending');
      expect(item?.lineNumber).toBe(2);
    });

    it('returns null when all complete', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'complete' },
        { lineNumber: 2, text: 'Item 2', status: 'complete' },
      ]);

      expect(getNextIncomplete(prd)).toBeNull();
    });
  });

  describe('getIncompleteItems', () => {
    it('returns empty array for empty PRD', () => {
      const prd = createPrd([]);
      expect(getIncompleteItems(prd)).toHaveLength(0);
    });

    it('returns all pending items', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'pending' },
        { lineNumber: 2, text: 'Item 2', status: 'complete' },
        { lineNumber: 3, text: 'Item 3', status: 'pending' },
      ]);

      const items = getIncompleteItems(prd);
      expect(items).toHaveLength(2);
      expect(items.map(i => i.text)).toEqual(['Item 1', 'Item 3']);
    });
  });

  describe('isAllComplete', () => {
    it('returns true for empty PRD', () => {
      const prd = createPrd([]);
      expect(isAllComplete(prd)).toBe(true);
    });

    it('returns true when all items complete', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'complete' },
        { lineNumber: 2, text: 'Item 2', status: 'complete' },
      ]);

      expect(isAllComplete(prd)).toBe(true);
    });

    it('returns false when any item pending', () => {
      const prd = createPrd([
        { lineNumber: 1, text: 'Item 1', status: 'complete' },
        { lineNumber: 2, text: 'Item 2', status: 'pending' },
      ]);

      expect(isAllComplete(prd)).toBe(false);
    });
  });

  describe('createSlug', () => {
    it('converts to lowercase', () => {
      expect(createSlug('Hello World')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      expect(createSlug('implement login feature')).toBe('implement-login-feature');
    });

    it('removes special characters', () => {
      expect(createSlug('API: /users endpoint')).toBe('api-users-endpoint');
    });

    it('removes leading/trailing hyphens', () => {
      expect(createSlug('---item---')).toBe('item');
    });

    it('collapses multiple hyphens', () => {
      expect(createSlug('item   with   spaces')).toBe('item-with-spaces');
    });

    it('truncates to 50 characters', () => {
      const longText = 'this is a very long text that should be truncated to fifty characters maximum';
      const slug = createSlug(longText);

      expect(slug.length).toBeLessThanOrEqual(50);
    });

    it('handles empty string', () => {
      expect(createSlug('')).toBe('');
    });

    it('handles numbers', () => {
      expect(createSlug('Item 123')).toBe('item-123');
    });

    it('handles mixed alphanumeric', () => {
      expect(createSlug('Add API v2 endpoint')).toBe('add-api-v2-endpoint');
    });
  });
});

// Helper to create PRD objects for testing
function createPrd(items: PrdItem[]): Prd {
  return {
    filepath: '/test/prd.md',
    items,
    raw: '',
  };
}
