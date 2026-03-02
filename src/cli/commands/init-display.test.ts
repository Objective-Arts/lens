/**
 * Tests for init-display: buildLensSection, printResults, marker constants
 *
 * These are pure functions (no I/O), so unit tests are fast and reliable.
 */

import { describe, it, expect } from 'vitest';
import {
  buildLensSection,
  transformAutoInvokeAction,
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

  it('includes /change and /cleanup command entries', () => {
    const stack: DetectedStack = { language: 'typescript', framework: null, profile: 'javascript' };
    const section = buildLensSection(stack);
    expect(section).toContain('/change');
    expect(section).toContain('/cleanup');
  });

  it('includes quality gate path referencing .claude/scripts/', () => {
    const stack: DetectedStack = { language: 'typescript', framework: null, profile: 'javascript' };
    const section = buildLensSection(stack);
    expect(section).toContain('tsx .claude/scripts/quality-gate.ts');
  });
});

// ---------------------------------------------------------------------------
// transformAutoInvokeAction
// ---------------------------------------------------------------------------

describe('transformAutoInvokeAction', () => {
  it('transforms canon name to Read path', () => {
    const result = transformAutoInvokeAction('INVOKE `/clarity`');
    expect(result).toBe('Read `.claude/canon/clarity/SKILL.md`');
  });

  it('leaves workflow skill name unchanged', () => {
    const result = transformAutoInvokeAction('INVOKE `/cleanup`');
    expect(result).toBe('INVOKE `/cleanup`');
  });

  it('leaves other workflow skills unchanged', () => {
    expect(transformAutoInvokeAction('INVOKE `/code-scan`')).toBe('INVOKE `/code-scan`');
    expect(transformAutoInvokeAction('INVOKE `/change`')).toBe('INVOKE `/change`');
    expect(transformAutoInvokeAction('INVOKE `/canon-audit`')).toBe('INVOKE `/canon-audit`');
  });

  it('transforms chained canon refs with then', () => {
    const result = transformAutoInvokeAction('INVOKE `/components` then `/visual` then `/usability`');
    expect(result).toBe(
      'Read `.claude/canon/components/SKILL.md` then read `.claude/canon/visual/SKILL.md` then read `.claude/canon/usability/SKILL.md`'
    );
  });

  it('preserves workflow skill in mixed chain', () => {
    const result = transformAutoInvokeAction('INVOKE `/cleanup` then `/clarity`');
    expect(result).toBe('INVOKE `/cleanup` then read `.claude/canon/clarity/SKILL.md`');
  });
});
