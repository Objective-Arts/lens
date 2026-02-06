import { describe, it, expect } from 'vitest';
import { markItemComplete } from './updater.js';
import { Prd, PrdItem } from '../types.js';

function makePrd(raw: string): Prd {
  return { filepath: 'test.md', items: [], raw };
}

function makeItem(lineNumber: number, text: string): PrdItem {
  return { lineNumber, text, status: 'pending' };
}

describe('markItemComplete', () => {
  it('marks a pending checkbox as complete', () => {
    const prd = makePrd('- [ ] First item\n- [ ] Second item');
    const result = markItemComplete(prd, makeItem(1, 'First item'));
    expect(result).toBe('- [x] First item\n- [ ] Second item');
  });

  it('marks second item without affecting first', () => {
    const prd = makePrd('- [ ] First item\n- [ ] Second item');
    const result = markItemComplete(prd, makeItem(2, 'Second item'));
    expect(result).toBe('- [ ] First item\n- [x] Second item');
  });

  it('handles checkbox with extra whitespace', () => {
    const prd = makePrd('- [  ] Spaced checkbox');
    const result = markItemComplete(prd, makeItem(1, 'Spaced checkbox'));
    expect(result).toBe('- [x] Spaced checkbox');
  });

  it('throws on invalid line number (too low)', () => {
    const prd = makePrd('- [ ] Item');
    expect(() => markItemComplete(prd, makeItem(0, 'Item'))).toThrow('Invalid line number: 0');
  });

  it('throws on invalid line number (too high)', () => {
    const prd = makePrd('- [ ] Item');
    expect(() => markItemComplete(prd, makeItem(5, 'Item'))).toThrow('Invalid line number: 5');
  });

  it('throws when line has no incomplete checkbox', () => {
    const prd = makePrd('- [x] Already done');
    expect(() => markItemComplete(prd, makeItem(1, 'Already done'))).toThrow('does not contain an incomplete checkbox');
  });

  it('throws on plain text line', () => {
    const prd = makePrd('Just a paragraph');
    expect(() => markItemComplete(prd, makeItem(1, 'Just a paragraph'))).toThrow('does not contain an incomplete checkbox');
  });
});
