import { describe, it, expect } from 'vitest';
import { isRecord, isStringArray, validateProfileSchema } from './validation.js';

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: 'value' })).toBe(true);
  });

  it('returns false for arrays', () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe('isStringArray', () => {
  it('returns true for string arrays', () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(['a', 'b'])).toBe(true);
  });

  it('returns false for mixed arrays', () => {
    expect(isStringArray(['a', 1])).toBe(false);
    expect(isStringArray([null])).toBe(false);
  });

  it('returns false for non-arrays', () => {
    expect(isStringArray('string')).toBe(false);
    expect(isStringArray({})).toBe(false);
  });
});

describe('validateProfileSchema', () => {
  it('rejects non-object input', () => {
    const result = validateProfileSchema('not-object', 'test.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('must be an object');
  });

  it('requires name field', () => {
    const result = validateProfileSchema({}, 'test.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'name'"))).toBe(true);
  });

  it('rejects empty name', () => {
    const result = validateProfileSchema({ name: '  ' }, 'test.yaml');
    expect(result.valid).toBe(false);
  });

  it('passes valid minimal profile', () => {
    const result = validateProfileSchema({ name: 'test-profile' }, 'test.yaml');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates description type', () => {
    const result = validateProfileSchema({ name: 'test', description: 42 }, 'test.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('description'))).toBe(true);
  });

  it('validates projectType values', () => {
    const valid = validateProfileSchema({ name: 'test', projectType: 'software' }, 'test.yaml');
    expect(valid.valid).toBe(true);

    const invalid = validateProfileSchema({ name: 'test', projectType: 'invalid' }, 'test.yaml');
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some(e => e.includes('projectType'))).toBe(true);
  });

  it('validates agents as string array', () => {
    const valid = validateProfileSchema({ name: 'test', agents: ['explore', 'plan'] }, 'test.yaml');
    expect(valid.valid).toBe(true);

    const invalid = validateProfileSchema({ name: 'test', agents: [1, 2] }, 'test.yaml');
    expect(invalid.valid).toBe(false);
  });

  it('validates skills categories', () => {
    const valid = validateProfileSchema({
      name: 'test',
      skills: { security: ['owasp'], tech: ['typescript'] }
    }, 'test.yaml');
    expect(valid.valid).toBe(true);

    const invalid = validateProfileSchema({
      name: 'test',
      skills: { security: 'not-array' }
    }, 'test.yaml');
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some(e => e.includes('skills.security'))).toBe(true);
  });

  it('validates claudeMd.standards as string array', () => {
    const valid = validateProfileSchema({
      name: 'test',
      claudeMd: { standards: ['Clarity over cleverness'] }
    }, 'test.yaml');
    expect(valid.valid).toBe(true);

    const invalid = validateProfileSchema({
      name: 'test',
      claudeMd: { standards: 'not-array' }
    }, 'test.yaml');
    expect(invalid.valid).toBe(false);
  });

  it('validates claudeMd.autoInvoke items', () => {
    const valid = validateProfileSchema({
      name: 'test',
      claudeMd: { autoInvoke: [{ context: 'Writing code', action: 'INVOKE /clarity' }] }
    }, 'test.yaml');
    expect(valid.valid).toBe(true);

    const invalid = validateProfileSchema({
      name: 'test',
      claudeMd: { autoInvoke: [{ missing: 'fields' }] }
    }, 'test.yaml');
    expect(invalid.valid).toBe(false);
  });

  it('validates hooks event types', () => {
    const valid = validateProfileSchema({
      name: 'test',
      hooks: { PreToolUse: [{ command: 'echo test' }] }
    }, 'test.yaml');
    expect(valid.valid).toBe(true);

    const invalid = validateProfileSchema({
      name: 'test',
      hooks: { InvalidEvent: [{ command: 'echo test' }] }
    }, 'test.yaml');
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some(e => e.includes('InvalidEvent'))).toBe(true);
  });

  it('includes filename in error messages', () => {
    const result = validateProfileSchema({}, 'my-profile.yaml');
    expect(result.errors.every(e => e.includes('my-profile.yaml'))).toBe(true);
  });

  it('collects multiple errors', () => {
    const result = validateProfileSchema({
      description: 42,
      agents: 'not-array',
      skills: { security: 'not-array' },
    }, 'test.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
