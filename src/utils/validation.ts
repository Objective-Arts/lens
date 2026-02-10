/**
 * Input validation utilities for CLI security
 *
 * Prevents path injection, command injection, and other security issues
 * from user-provided input.
 */

import * as path from 'path';

/** Valid name pattern: alphanumeric, hyphens, underscores */
const VALID_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Maximum name length to prevent buffer issues */
const MAX_NAME_LENGTH = 100;

/**
 * Validate a name (serverName, skillName, profileName)
 * Prevents path injection via names like "../../../etc/passwd"
 */
export function isValidName(name: string): boolean {
  if (!name) {
    return false;
  }

  if (name.length > MAX_NAME_LENGTH) {
    return false;
  }

  return VALID_NAME_PATTERN.test(name);
}

/**
 * Validate and sanitize a project path
 * Prevents path traversal attacks
 *
 * @returns Normalized absolute path if valid, null if invalid
 */
export function validateProjectPath(projectPath: string, allowedRoot?: string): string | null {
  if (!projectPath) {
    return null;
  }

  // Reject null bytes unconditionally (path truncation attack)
  if (projectPath.includes('\0')) {
    return null;
  }

  const absolutePath = path.resolve(projectPath);

  if (allowedRoot) {
    const absoluteRoot = path.resolve(allowedRoot);
    const rootPrefix = absoluteRoot.endsWith(path.sep) ? absoluteRoot : absoluteRoot + path.sep;
    if (absolutePath !== absoluteRoot && !absolutePath.startsWith(rootPrefix)) {
      return null;
    }
  }

  return absolutePath;
}

export function getNameValidationError(name: string, fieldName: string = 'name'): string {
  if (!name) {
    return `${fieldName} is required`;
  }

  if (name.length > MAX_NAME_LENGTH) {
    return `${fieldName} must be ${MAX_NAME_LENGTH} characters or less`;
  }

  return `${fieldName} must contain only letters, numbers, hyphens, and underscores`;
}

export function getPathValidationError(projectPath: string): string {
  if (!projectPath) {
    return 'Project path is required';
  }

  if (projectPath.includes('\0')) {
    return 'Project path contains invalid characters';
  }

  return 'Invalid project path';
}
