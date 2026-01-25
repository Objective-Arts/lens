/**
 * Tests for token estimation utilities
 */

import { describe, it, expect } from 'vitest';
import { estimateTokens, formatTokens, tokenPercentage } from './tokens.js';

describe('estimateTokens', () => {
  it('returns 0 for empty content', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('returns 0 for null/undefined content', () => {
    expect(estimateTokens(null as unknown as string)).toBe(0);
    expect(estimateTokens(undefined as unknown as string)).toBe(0);
  });

  it('estimates tokens for simple text', () => {
    // "Hello world" = 11 chars, ~3 tokens at 4 chars/token
    const tokens = estimateTokens('Hello world');
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });

  it('handles whitespace normalization', () => {
    const singleSpace = estimateTokens('Hello world');
    const multiSpace = estimateTokens('Hello    world');
    const withNewlines = estimateTokens('Hello\n\n\nworld');

    // All should normalize to similar token counts
    expect(singleSpace).toBe(multiSpace);
    expect(singleSpace).toBe(withNewlines);
  });

  it('estimates reasonable tokens for longer content', () => {
    const content = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
    const tokens = estimateTokens(content);

    // Should be roughly content.length / 4
    expect(tokens).toBeGreaterThan(100);
    expect(tokens).toBeLessThan(200);
  });
});

describe('formatTokens', () => {
  it('formats small numbers without suffix', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(500)).toBe('500');
    expect(formatTokens(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(1500)).toBe('1.5k');
    expect(formatTokens(10000)).toBe('10.0k');
    expect(formatTokens(123456)).toBe('123.5k');
  });
});

describe('tokenPercentage', () => {
  it('returns 0% for zero total', () => {
    expect(tokenPercentage(100, 0)).toBe('0%');
  });

  it('calculates correct percentages', () => {
    expect(tokenPercentage(50, 100)).toBe('50.0%');
    expect(tokenPercentage(25, 100)).toBe('25.0%');
    expect(tokenPercentage(1, 3)).toBe('33.3%');
  });

  it('handles 100%', () => {
    expect(tokenPercentage(100, 100)).toBe('100.0%');
  });
});
