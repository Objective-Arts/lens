/**
 * Tests for init-display: buildLensSection, printResults, marker constants
 *
 * These are pure functions (no I/O), so unit tests are fast and reliable.
 */

import { describe, it, expect } from 'vitest';
import {
  buildLensSection,
  LENS_MARKER_START,
  LENS_MARKER_END,
  type DetectedStack
} from './init-display.js';

// ---------------------------------------------------------------------------
// Marker constants
// ---------------------------------------------------------------------------

describe('LENS markers', () => {
  it('start marker contains LENS:START', () => {
    expect(LENS_MARKER_START).toContain('LENS:START');
  });

  it('end marker contains LENS:END', () => {
    expect(LENS_MARKER_END).toContain('LENS:END');
  });

  it('markers are different strings', () => {
    expect(LENS_MARKER_START).not.toBe(LENS_MARKER_END);
  });
});

// ---------------------------------------------------------------------------
// buildLensSection
// ---------------------------------------------------------------------------

describe('buildLensSection', () => {
  it('wraps output in LENS markers', () => {
    const stack: DetectedStack = { language: 'typescript', framework: null, profile: 'javascript' };
    const section = buildLensSection(stack);
    expect(section).toContain(LENS_MARKER_START);
    expect(section).toContain(LENS_MARKER_END);
    expect(section.indexOf(LENS_MARKER_START)).toBeLessThan(section.indexOf(LENS_MARKER_END));
  });

  it('includes the profile name', () => {
    const stack: DetectedStack = { language: 'typescript', framework: 'nextjs', profile: 'nextjs' };
    const section = buildLensSection(stack);
    expect(section).toContain('nextjs');
  });

  it('includes language without framework when framework is null', () => {
    const stack: DetectedStack = { language: 'python', framework: null, profile: 'python' };
    const section = buildLensSection(stack);
    expect(section).toContain('python');
    expect(section).not.toContain('python / ');
  });

  it('includes language / framework when framework is set', () => {
    const stack: DetectedStack = { language: 'typescript', framework: 'react', profile: 'react' };
    const section = buildLensSection(stack);
    expect(section).toContain('typescript / react');
  });

  it('includes /change and /fix command entries', () => {
    const stack: DetectedStack = { language: 'typescript', framework: null, profile: 'javascript' };
    const section = buildLensSection(stack);
    expect(section).toContain('/change');
    expect(section).toContain('/fix');
  });

  it('includes quality gate path referencing .claude/scripts/', () => {
    const stack: DetectedStack = { language: 'typescript', framework: null, profile: 'javascript' };
    const section = buildLensSection(stack);
    expect(section).toContain('tsx .claude/scripts/quality-gate.ts');
  });
});
