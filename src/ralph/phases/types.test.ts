/**
 * BasePhase Tests — expert guidance, enforcement checklists, APPLIED validation.
 *
 * Tests the phone session changes (888782d):
 * - buildExpertGuidance prefers SUMMARY.md content over SKILL.md
 * - buildEnforcementChecklist injects pass/fail gates from skill checklists
 * - validateAppliedPrinciples rejects missing, empty, or generic APPLIED sections
 */

import { describe, it, expect } from 'vitest';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import type { PhaseName, Skill } from '../types.js';

/** Concrete subclass to test protected BasePhase methods. */
class TestablePhase extends BasePhase {
  readonly name: PhaseName = 'plan';
  readonly icon = '🧪';
  readonly description = 'Test phase';

  async execute(_context: PhaseContext): Promise<PhaseResult> {
    return this.success('ok');
  }

  // Expose protected methods for testing
  public testBuildExpertGuidance(experts: readonly Skill[]): string {
    return this.buildExpertGuidance(experts);
  }

  public testValidateAppliedPrinciples(output: string, experts: readonly Skill[]): string | null {
    return this.validateAppliedPrinciples(output, experts);
  }
}

function makeSkill(overrides: Partial<Skill> & { name: string }): Skill {
  return {
    content: `# ${overrides.name}\nFull content.`,
    summary: '',
    checklist: [],
    source: 'profile',
    ...overrides,
  };
}

describe('BasePhase', () => {
  const phase = new TestablePhase();

  describe('buildExpertGuidance', () => {
    it('returns empty string for no experts', () => {
      const result = phase.testBuildExpertGuidance([]);

      expect(result).toBe('');
    });

    it('includes expert names in header', () => {
      const experts = [makeSkill({ name: 'clarity' }), makeSkill({ name: 'simplicity' })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('EXPERT GUIDANCE (clarity, simplicity)');
    });

    it('prefers summary over content when summary exists', () => {
      const experts = [makeSkill({
        name: 'clarity',
        content: 'This is the full SKILL.md content',
        summary: 'This is the condensed SUMMARY.md content',
      })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('condensed SUMMARY.md content');
      expect(result).not.toContain('full SKILL.md content');
    });

    it('falls back to content (stripped of frontmatter) when no summary', () => {
      const experts = [makeSkill({
        name: 'clarity',
        content: '---\nname: clarity\n---\n\n# Clarity\nBe clear.',
        summary: '',
      })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('# Clarity');
      expect(result).toContain('Be clear.');
      expect(result).not.toContain('name: clarity');
    });

    it('uses raw content when no frontmatter present', () => {
      const experts = [makeSkill({
        name: 'clarity',
        content: '# Clarity\nNo frontmatter here.',
        summary: '',
      })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('# Clarity');
      expect(result).toContain('No frontmatter here.');
    });

    it('includes section header per expert', () => {
      const experts = [
        makeSkill({ name: 'clarity', summary: 'Be clear.' }),
        makeSkill({ name: 'simplicity', summary: 'Keep it simple.' }),
      ];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('## clarity');
      expect(result).toContain('## simplicity');
      expect(result).toContain('Be clear.');
      expect(result).toContain('Keep it simple.');
    });
  });

  describe('buildEnforcementChecklist', () => {
    it('omits checklist section when no experts have checklists', () => {
      const experts = [makeSkill({ name: 'clarity', checklist: [] })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).not.toContain('ENFORCEMENT CHECKLIST');
    });

    it('includes enforcement checklist when experts have checklist items', () => {
      const experts = [makeSkill({
        name: 'clarity',
        checklist: ['Every function does one thing', 'No magic numbers'],
      })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('ENFORCEMENT CHECKLIST');
      expect(result).toContain('[clarity] Every function does one thing');
      expect(result).toContain('[clarity] No magic numbers');
    });

    it('labels checklist items with their expert name', () => {
      const experts = [
        makeSkill({ name: 'clarity', checklist: ['Be clear'] }),
        makeSkill({ name: 'simplicity', checklist: ['Keep it simple'] }),
      ];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('[clarity] Be clear');
      expect(result).toContain('[simplicity] Keep it simple');
    });

    it('combines checklist items from multiple experts', () => {
      const experts = [
        makeSkill({ name: 'clarity', checklist: ['Item A', 'Item B'] }),
        makeSkill({ name: 'correctness', checklist: ['Item C'] }),
      ];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('[clarity] Item A');
      expect(result).toContain('[clarity] Item B');
      expect(result).toContain('[correctness] Item C');
    });

    it('marks checklist as PASS/FAIL and NOT OPTIONAL', () => {
      const experts = [makeSkill({ name: 'clarity', checklist: ['Test item'] })];

      const result = phase.testBuildExpertGuidance(experts);

      expect(result).toContain('PASS/FAIL');
      expect(result).toContain('NOT OPTIONAL');
    });
  });

  describe('validateAppliedPrinciples', () => {
    it('returns null when no experts (nothing to validate)', () => {
      const result = phase.testValidateAppliedPrinciples('any output', []);

      expect(result).toBeNull();
    });

    it('returns error when APPLIED section is missing', () => {
      const output = 'FILES:\n- some/file.ts\n\nPLAN_COMPLETE';
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('Missing APPLIED section');
    });

    it('returns error when APPLIED section is empty', () => {
      const output = `FILES:
- some/file.ts

APPLIED:

PLAN_COMPLETE`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('empty');
    });

    it('returns error when an expert is not cited in APPLIED', () => {
      const output = `APPLIED:
- clarity: used early returns to flatten nesting

PLAN_COMPLETE`;
      const experts = [
        makeSkill({ name: 'clarity' }),
        makeSkill({ name: 'simplicity' }),
      ];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('simplicity');
      expect(result).toContain('missing decisions');
    });

    it('returns null when all experts are cited with specific decisions', () => {
      const output = `APPLIED:
- clarity: used early returns to flatten nesting in parseConfig
- simplicity: extracted validation into single-purpose isValidInput function

PLAN_COMPLETE`;
      const experts = [
        makeSkill({ name: 'clarity' }),
        makeSkill({ name: 'simplicity' }),
      ];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toBeNull();
    });

    it('rejects generic claims like "applied X principles"', () => {
      const output = `APPLIED:
- clarity: applied clarity principles

PLAN_COMPLETE`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('generic claims');
    });

    it('rejects "followed X guidance"', () => {
      const output = `APPLIED:
- clarity: followed clarity guidance

PLAN_COMPLETE`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('generic claims');
    });

    it('rejects "used X best practices"', () => {
      const output = `APPLIED:
- clarity: used clarity best practices

PLAN_COMPLETE`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('generic claims');
    });

    it('rejects "considered X approach"', () => {
      const output = `APPLIED:
- clarity: considered clarity approach

PLAN_COMPLETE`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toContain('generic claims');
    });

    it('accepts specific decisions even with expert name embedded', () => {
      const output = `APPLIED:
- clarity: named variables descriptively per clarity's rule against magic values
- correctness: added input validation to prevent null pointer in processItems

PLAN_COMPLETE`;
      const experts = [
        makeSkill({ name: 'clarity' }),
        makeSkill({ name: 'correctness' }),
      ];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toBeNull();
    });

    it('is case-insensitive when matching expert names', () => {
      const output = `APPLIED:
- CLARITY: used early returns instead of nested if/else

PLAN_COMPLETE`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toBeNull();
    });

    it('handles APPLIED section at end of output (no trailing section)', () => {
      const output = `FILES:
- src/foo.ts

APPLIED:
- clarity: split parseConfig into parseHeaders and parseBody (each under 15 lines)`;
      const experts = [makeSkill({ name: 'clarity' })];

      const result = phase.testValidateAppliedPrinciples(output, experts);

      expect(result).toBeNull();
    });
  });

  describe('helper methods', () => {
    it('success creates a success result', () => {
      const result = phase['success']('done', { count: 5 });

      expect(result).toEqual({
        status: 'success',
        message: 'done',
        metrics: { count: 5 },
        rawOutput: undefined,
      });
    });

    it('failed creates a failed result', () => {
      const result = phase['failed']('something broke');

      expect(result).toEqual({ status: 'failed', error: 'something broke' });
    });

    it('skipped creates a skipped result', () => {
      const result = phase['skipped']('not needed');

      expect(result).toEqual({ status: 'skipped', reason: 'not needed' });
    });
  });
});
