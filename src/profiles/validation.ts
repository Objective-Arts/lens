/**
 * Profile schema validation.
 *
 * Type guards and validation for ComposableProfile schema.
 */

import { isRecord as isRecordUtil } from '../utils/validation.js';

// Re-export for backward compatibility with test files
export const isRecord = isRecordUtil;

/** Skill categories for iteration */
export const SKILL_CATEGORIES = ['security', 'tech', 'canon', 'global'] as const;

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/** Type guard for auto-invoke items */
function isAutoInvokeItem(value: unknown): value is { context: string; action: string } {
  return isRecord(value) &&
    typeof value.context === 'string' &&
    typeof value.action === 'string';
}

/** Result type for validation */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSkills(skills: unknown, filename: string): string[] {
  if (skills === undefined) return [];
  if (!isRecord(skills)) return [`${filename}: 'skills' must be an object`];

  const errors: string[] = [];
  for (const category of SKILL_CATEGORIES) {
    const val = skills[category];
    if (val !== undefined && !isStringArray(val)) {
      errors.push(`${filename}: 'skills.${category}' must be an array of strings`);
    }
  }
  return errors;
}

function validateClaudeMd(claudeMd: unknown, filename: string): string[] {
  if (claudeMd === undefined) return [];
  if (!isRecord(claudeMd)) return [`${filename}: 'claudeMd' must be an object`];

  const errors: string[] = [];
  if (claudeMd.standards !== undefined && !isStringArray(claudeMd.standards)) {
    errors.push(`${filename}: 'claudeMd.standards' must be an array of strings`);
  }
  if (claudeMd.antiPatterns !== undefined && !isStringArray(claudeMd.antiPatterns)) {
    errors.push(`${filename}: 'claudeMd.antiPatterns' must be an array of strings`);
  }
  if (claudeMd.autoInvoke !== undefined) {
    if (!Array.isArray(claudeMd.autoInvoke)) {
      errors.push(`${filename}: 'claudeMd.autoInvoke' must be an array`);
    } else {
      claudeMd.autoInvoke.forEach((item, i) => {
        if (!isAutoInvokeItem(item)) {
          errors.push(`${filename}: 'claudeMd.autoInvoke[${i}]' must have 'context' and 'action' strings`);
        }
      });
    }
  }
  return errors;
}

function validateOptionalFields(data: Record<string, unknown>, filename: string): string[] {
  const errors: string[] = [];

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push(`${filename}: 'description' must be a string`);
  }
  if (data.projectType !== undefined && data.projectType !== 'software' && data.projectType !== 'business') {
    errors.push(`${filename}: 'projectType' must be 'software' or 'business'`);
  }
  if (data.agents !== undefined && !isStringArray(data.agents)) {
    errors.push(`${filename}: 'agents' must be an array of strings`);
  }
  if (data.commands !== undefined && !isStringArray(data.commands)) {
    errors.push(`${filename}: 'commands' must be an array of strings`);
  }

  return errors;
}

export function validateProfileSchema(rawProfile: unknown, filename: string): ValidationResult {
  if (!isRecord(rawProfile)) {
    return { valid: false, errors: [`${filename}: Profile must be an object`] };
  }

  const errors: string[] = [];

  if (typeof rawProfile.name !== 'string' || rawProfile.name.trim() === '') {
    errors.push(`${filename}: 'name' is required and must be a non-empty string`);
  }

  errors.push(...validateOptionalFields(rawProfile, filename));
  errors.push(...validateSkills(rawProfile.skills, filename));
  errors.push(...validateClaudeMd(rawProfile.claudeMd, filename));

  return { valid: errors.length === 0, errors };
}
