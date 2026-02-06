import { describe, it, expect } from 'vitest';
import { isCorrectableFailure, buildCorrectivePrompt, MAX_RETRIES } from './retry.js';

describe('isCorrectableFailure', () => {
  it('returns true for "issues not fixed"', () => {
    expect(isCorrectableFailure('3 issues not fixed')).toBe(true);
  });

  it('returns true for function length violations', () => {
    expect(isCorrectableFailure('Function processData is 45 lines. Max allowed is 30')).toBe(true);
  });

  it('returns true for vague names', () => {
    expect(isCorrectableFailure('Code contains vague names')).toBe(true);
  });

  it('returns true for test failures', () => {
    expect(isCorrectableFailure('3 tests failed')).toBe(true);
    expect(isCorrectableFailure('tests were not run')).toBe(true);
    expect(isCorrectableFailure('no tests were written')).toBe(true);
  });

  it('returns true for qodana/gemini not called', () => {
    expect(isCorrectableFailure('Qodana was not called')).toBe(true);
    expect(isCorrectableFailure('Gemini not called')).toBe(true);
  });

  it('returns true for ISSUES_REMAINING with count', () => {
    expect(isCorrectableFailure('ISSUES_REMAINING: 3')).toBe(true);
  });

  it('returns false for non-correctable errors', () => {
    expect(isCorrectableFailure('Failed to spawn Claude')).toBe(false);
    expect(isCorrectableFailure('Network timeout')).toBe(false);
    expect(isCorrectableFailure('Permission denied')).toBe(false);
  });

  it('returns false for ISSUES_REMAINING 0', () => {
    expect(isCorrectableFailure('ISSUES_REMAINING: 0')).toBe(false);
  });
});

describe('buildCorrectivePrompt', () => {
  it('includes attempt count', () => {
    const prompt = buildCorrectivePrompt('test error', 0);
    expect(prompt).toContain(`Attempt 1/${MAX_RETRIES}`);
  });

  it('includes sanitized error', () => {
    const prompt = buildCorrectivePrompt('something failed', 2);
    expect(prompt).toContain('something failed');
  });

  it('strips markdown from error', () => {
    const prompt = buildCorrectivePrompt('**bold** and `code`', 0);
    expect(prompt).not.toContain('**');
    expect(prompt).not.toContain('`');
  });

  it('strips code blocks from error', () => {
    const prompt = buildCorrectivePrompt('error with ```code block``` included', 0);
    expect(prompt).toContain('[code removed]');
    expect(prompt).not.toContain('code block');
  });

  it('truncates long errors to 500 chars', () => {
    const longError = 'x'.repeat(1000);
    const prompt = buildCorrectivePrompt(longError, 0);
    // The sanitized error should be truncated
    expect(prompt.length).toBeLessThan(1100);
  });

  it('includes phase-specific guidance for test phase', () => {
    const prompt = buildCorrectivePrompt('No tests written', 0, 'test');
    expect(prompt).toContain('WHAT TO DO');
    expect(prompt).toContain('TEST_COUNT');
  });

  it('includes phase-specific guidance for static-analysis', () => {
    const prompt = buildCorrectivePrompt('CRITICAL issues remain', 0, 'static-analysis');
    expect(prompt).toContain('WHAT TO DO');
    expect(prompt).toContain('Edit tool');
  });

  it('provides generic guidance for unknown phase', () => {
    const prompt = buildCorrectivePrompt('some error', 0, 'plan');
    expect(prompt).toContain('Review the error above');
  });
});
