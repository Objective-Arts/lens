/**
 * Tests for skill-loader: loadSkills with path traversal validation
 *
 * Covers WI-11 scenarios:
 * - Skill names with `../`, `/`, `\` return empty results (path traversal rejected)
 * - Valid skill names load correctly from filesystem
 * - Missing SKILL.md is handled gracefully
 * - loadSkills returns only successfully loaded skills
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { loadSkills } from './skill-loader.js';

// ---------------------------------------------------------------------------
// Test fixture: a project directory with .claude/skills/<skill>/SKILL.md
// ---------------------------------------------------------------------------

let tmpProjectDir: string;

function createSkill(projectDir: string, skillName: string, content: string): void {
  const skillDir = path.join(projectDir, '.claude', 'skills', skillName);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
}

beforeAll(() => {
  tmpProjectDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-skill-loader-'));

  // Create valid skills
  createSkill(tmpProjectDir, 'my-skill', `---
name: my-skill
description: A test skill
---
# My Skill
## Checklist
- [ ] Step one
- [ ] Step two
`);

  createSkill(tmpProjectDir, 'skill-with-summary', `---
name: skill-with-summary
description: Has a summary file too
---
# Skill With Summary
Content here.
`);

  // Also add SUMMARY.md for the second skill
  const summaryDir = path.join(tmpProjectDir, '.claude', 'skills', 'skill-with-summary');
  fs.writeFileSync(path.join(summaryDir, 'SUMMARY.md'), `## Summary Checklist
- [ ] Summary item one
- [x] Summary item two
`, 'utf-8');
});

afterAll(() => {
  fs.rmSync(tmpProjectDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Path traversal protection (WI-11)
// ---------------------------------------------------------------------------

describe('loadSkills — path traversal rejection', () => {
  it('rejects skill name with ../ (returns empty array)', () => {
    const skills = loadSkills(tmpProjectDir, ['../../../etc/passwd']);
    expect(skills).toEqual([]);
  });

  it('rejects skill name with leading slash', () => {
    const skills = loadSkills(tmpProjectDir, ['/etc/passwd']);
    expect(skills).toEqual([]);
  });

  it('rejects skill name with backslash traversal', () => {
    const skills = loadSkills(tmpProjectDir, ['..\\..\\windows\\system32']);
    expect(skills).toEqual([]);
  });

  it('rejects skill name with dot-dot alone', () => {
    const skills = loadSkills(tmpProjectDir, ['..']);
    expect(skills).toEqual([]);
  });

  it('rejects skill name with embedded slash', () => {
    const skills = loadSkills(tmpProjectDir, ['foo/bar']);
    expect(skills).toEqual([]);
  });

  it('rejects skill names with spaces', () => {
    const skills = loadSkills(tmpProjectDir, ['bad name']);
    expect(skills).toEqual([]);
  });

  it('rejects empty string skill name', () => {
    const skills = loadSkills(tmpProjectDir, ['']);
    expect(skills).toEqual([]);
  });

  it('rejects skill name exceeding max length', () => {
    const longName = 'a'.repeat(101);
    const skills = loadSkills(tmpProjectDir, [longName]);
    expect(skills).toEqual([]);
  });

  it('filters out traversal names while loading valid names in same array', () => {
    const skills = loadSkills(tmpProjectDir, ['../evil', 'my-skill']);
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('my-skill');
  });
});

// ---------------------------------------------------------------------------
// Happy path loading
// ---------------------------------------------------------------------------

describe('loadSkills — happy path', () => {
  it('loads a valid skill with content', () => {
    const skills = loadSkills(tmpProjectDir, ['my-skill']);
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('my-skill');
    expect(skills[0].content).toContain('My Skill');
    expect(skills[0].source).toBe('profile');
  });

  it('extracts checklist items from SKILL.md', () => {
    const skills = loadSkills(tmpProjectDir, ['my-skill']);
    expect(skills[0].checklist.length).toBeGreaterThan(0);
    expect(skills[0].checklist).toContain('Step one');
  });

  it('uses SUMMARY.md checklist when summary file exists', () => {
    const skills = loadSkills(tmpProjectDir, ['skill-with-summary']);
    expect(skills.length).toBe(1);
    // Checklist should come from SUMMARY.md
    expect(skills[0].checklist).toContain('Summary item one');
  });

  it('loads multiple valid skills', () => {
    const skills = loadSkills(tmpProjectDir, ['my-skill', 'skill-with-summary']);
    expect(skills.length).toBe(2);
    const names = skills.map(s => s.name);
    expect(names).toContain('my-skill');
    expect(names).toContain('skill-with-summary');
  });

  it('returns empty array for empty input', () => {
    const skills = loadSkills(tmpProjectDir, []);
    expect(skills).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('loadSkills — missing or broken skills', () => {
  it('returns empty array when skill directory does not exist', () => {
    const skills = loadSkills(tmpProjectDir, ['nonexistent-skill-xyz']);
    expect(skills).toEqual([]);
  });

  it('returns empty array when SKILL.md is missing from skill dir', () => {
    // Create a skill dir with no SKILL.md
    const emptySkillDir = path.join(tmpProjectDir, '.claude', 'skills', 'empty-skill');
    fs.mkdirSync(emptySkillDir, { recursive: true });

    const skills = loadSkills(tmpProjectDir, ['empty-skill']);
    expect(skills).toEqual([]);
  });

  it('skips invalid names and still loads valid ones', () => {
    const skills = loadSkills(tmpProjectDir, [
      '../../../etc/passwd',
      'my-skill',
      '/absolute/path',
      'skill-with-summary'
    ]);
    expect(skills.length).toBe(2);
  });
});
