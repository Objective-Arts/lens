import { describe, it, expect } from 'vitest';
import { parseProfileString } from './combiner.js';

describe('parseProfileString', () => {
  it('parses single profile', () => {
    expect(parseProfileString('typescript')).toEqual(['typescript']);
  });

  it('parses combined profiles with +', () => {
    expect(parseProfileString('javascript+react')).toEqual(['javascript', 'react']);
  });

  it('trims whitespace around profile names', () => {
    expect(parseProfileString(' typescript + react ')).toEqual(['typescript', 'react']);
  });

  it('filters empty segments', () => {
    expect(parseProfileString('a++b')).toEqual(['a', 'b']);
  });

  it('handles single plus sign', () => {
    expect(parseProfileString('+')).toEqual([]);
  });

  it('handles empty string', () => {
    expect(parseProfileString('')).toEqual([]);
  });

  it('parses three combined profiles', () => {
    expect(parseProfileString('typescript+react+testing')).toEqual(['typescript', 'react', 'testing']);
  });

  it('handles profile names with hyphens', () => {
    expect(parseProfileString('typescript-cli+react-native')).toEqual(['typescript-cli', 'react-native']);
  });
});
