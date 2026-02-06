import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { isValidName, validateProjectPath, getNameValidationError, getPathValidationError } from './validation.js';

describe('isValidName', () => {
  it('accepts alphanumeric names', () => {
    expect(isValidName('my-skill')).toBe(true);
    expect(isValidName('skill_v2')).toBe(true);
    expect(isValidName('ABC123')).toBe(true);
  });

  it('rejects empty and falsy values', () => {
    expect(isValidName('')).toBe(false);
  });

  it('rejects names with path traversal', () => {
    expect(isValidName('../etc/passwd')).toBe(false);
    expect(isValidName('../../secret')).toBe(false);
  });

  it('rejects names with special characters', () => {
    expect(isValidName('name with spaces')).toBe(false);
    expect(isValidName('name/slash')).toBe(false);
    expect(isValidName('name.dot')).toBe(false);
    expect(isValidName('name@at')).toBe(false);
  });

  it('rejects names exceeding max length', () => {
    const longName = 'a'.repeat(101);
    expect(isValidName(longName)).toBe(false);
    expect(isValidName('a'.repeat(100))).toBe(true);
  });
});

describe('validateProjectPath', () => {
  it('returns absolute path for valid input', () => {
    const result = validateProjectPath('/tmp/project');
    expect(result).toBe('/tmp/project');
  });

  it('resolves relative paths', () => {
    const result = validateProjectPath('relative/path');
    expect(result).toBe(path.resolve('relative/path'));
  });

  it('returns null for empty input', () => {
    expect(validateProjectPath('')).toBeNull();
  });

  it('rejects null bytes unconditionally', () => {
    expect(validateProjectPath('/tmp/project\0/evil')).toBeNull();
    expect(validateProjectPath('safe\0path', '/tmp')).toBeNull();
  });

  it('allows paths within allowedRoot', () => {
    const result = validateProjectPath('/home/user/project', '/home/user');
    expect(result).toBe('/home/user/project');
  });

  it('rejects paths outside allowedRoot', () => {
    expect(validateProjectPath('/etc/passwd', '/home/user')).toBeNull();
  });

  it('prevents path prefix collision', () => {
    // /home/username should NOT be considered within /home/user
    expect(validateProjectPath('/home/username', '/home/user')).toBeNull();
  });

  it('allows exact match of allowedRoot', () => {
    expect(validateProjectPath('/home/user', '/home/user')).toBe('/home/user');
  });
});

describe('getNameValidationError', () => {
  it('returns required message for empty name', () => {
    expect(getNameValidationError('')).toBe('name is required');
  });

  it('uses custom field name', () => {
    expect(getNameValidationError('', 'profileName')).toBe('profileName is required');
  });

  it('returns length message for long names', () => {
    expect(getNameValidationError('a'.repeat(101))).toContain('100 characters');
  });

  it('returns pattern message for invalid chars', () => {
    expect(getNameValidationError('bad name!')).toContain('letters, numbers');
  });
});

describe('getPathValidationError', () => {
  it('returns required message for empty path', () => {
    expect(getPathValidationError('')).toBe('Project path is required');
  });

  it('returns invalid chars message for null bytes', () => {
    expect(getPathValidationError('/path\0evil')).toBe('Project path contains invalid characters');
  });

  it('returns generic message for other invalid paths', () => {
    expect(getPathValidationError('something')).toBe('Invalid project path');
  });
});
