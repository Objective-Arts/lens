/**
 * Skill Loader Tests — SUMMARY.md loading, checklist extraction, enforcement.
 *
 * Tests the phone session changes (888782d):
 * - Loads SUMMARY.md alongside SKILL.md
 * - Extracts checklist items from "## Checklist" sections
 * - Extracts numbered items from "## The X Test" sections
 * - Falls back to SKILL.md checklist when no SUMMARY.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadSkills } from './loader.js';

const TEST_DIR = '/tmp/skill-loader-test';
const SKILLS_DIR = path.join(TEST_DIR, '.claude', 'skills');

/** Create a skill directory with SKILL.md and optional SUMMARY.md */
function createSkill(name: string, skillContent: string, summaryContent?: string): void {
  const dir = path.join(SKILLS_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), skillContent);
  if (summaryContent !== undefined) {
    fs.writeFileSync(path.join(dir, 'SUMMARY.md'), summaryContent);
  }
}

describe('Skill Loader', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('loadSkills', () => {
    it('loads a skill by name', () => {
      createSkill('clarity', '# Clarity\n\nBe clear.');

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('clarity');
      expect(skills[0].content).toContain('Be clear');
    });

    it('skips skills that do not exist', () => {
      createSkill('clarity', '# Clarity');

      const skills = loadSkills(TEST_DIR, ['clarity', 'nonexistent']);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('clarity');
    });

    it('loads multiple skills', () => {
      createSkill('clarity', '# Clarity');
      createSkill('simplicity', '# Simplicity');
      createSkill('correctness', '# Correctness');

      const skills = loadSkills(TEST_DIR, ['clarity', 'simplicity', 'correctness']);

      expect(skills).toHaveLength(3);
      expect(skills.map(s => s.name)).toEqual(['clarity', 'simplicity', 'correctness']);
    });

    it('returns empty array when no skills found', () => {
      const skills = loadSkills(TEST_DIR, ['nonexistent']);

      expect(skills).toEqual([]);
    });
  });

  describe('SUMMARY.md loading', () => {
    it('loads SUMMARY.md content into summary field', () => {
      createSkill(
        'clarity',
        '# Full SKILL.md content\nLong detailed content...',
        '# Summary\nCondensed wisdom here.'
      );

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].summary).toContain('Condensed wisdom');
    });

    it('sets empty summary when no SUMMARY.md exists', () => {
      createSkill('clarity', '# Full SKILL.md content only');

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].summary).toBe('');
    });

    it('still loads SKILL.md content even when SUMMARY.md exists', () => {
      createSkill(
        'clarity',
        '# Full SKILL content',
        '# Summary content'
      );

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].content).toContain('Full SKILL content');
      expect(skills[0].summary).toContain('Summary content');
    });
  });

  describe('checklist extraction', () => {
    it('extracts checklist items from ## Checklist section', () => {
      const summary = `# Clarity Summary

## Core Principles
Be clear.

## Checklist

- [ ] Every function does one thing
- [ ] No cleverness requiring explanation
- [ ] Names are self-documenting
`;
      createSkill('clarity', '# SKILL', summary);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toHaveLength(3);
      expect(skills[0].checklist).toContain('Every function does one thing');
      expect(skills[0].checklist).toContain('No cleverness requiring explanation');
      expect(skills[0].checklist).toContain('Names are self-documenting');
    });

    it('extracts items from "The X Test" sections', () => {
      const summary = `# Clarity Summary

## The Kernighan Test

Before committing, ask:
1. Can I explain this in one sentence?
2. Would I understand this at 3am during an outage?
3. Is there a more obvious way?
4. Am I being clever?
`;
      createSkill('clarity', '# SKILL', summary);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toHaveLength(4);
      expect(skills[0].checklist).toContain('Can I explain this in one sentence?');
      expect(skills[0].checklist).toContain('Am I being clever?');
    });

    it('combines items from both Checklist and Test sections', () => {
      const summary = `# Summary

## The Clarity Test

1. Is the code obvious?
2. Can a junior understand it?

## Checklist

- [ ] No magic numbers
- [x] Functions under 30 lines
`;
      createSkill('clarity', '# SKILL', summary);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toHaveLength(4);
      expect(skills[0].checklist).toContain('Is the code obvious?');
      expect(skills[0].checklist).toContain('No magic numbers');
    });

    it('falls back to SKILL.md checklist when no SUMMARY.md', () => {
      const skillContent = `# Full Skill

## Checklist

- [ ] Validate all inputs
- [ ] Handle errors explicitly
`;
      createSkill('clarity', skillContent);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toHaveLength(2);
      expect(skills[0].checklist).toContain('Validate all inputs');
    });

    it('returns empty checklist when no checklist sections exist', () => {
      createSkill('clarity', '# SKILL', '# Summary\nJust text.');

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toEqual([]);
    });

    it('handles checked and unchecked checkboxes', () => {
      const summary = `## Checklist

- [ ] Unchecked item
- [x] Checked item
`;
      createSkill('clarity', '# SKILL', summary);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toHaveLength(2);
      expect(skills[0].checklist).toContain('Unchecked item');
      expect(skills[0].checklist).toContain('Checked item');
    });

    it('ignores non-checklist bullet points in Checklist section', () => {
      const summary = `## Checklist

- [ ] Real checklist item
- This is just a regular bullet
- [ ] Another checklist item
`;
      createSkill('clarity', '# SKILL', summary);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].checklist).toHaveLength(2);
      expect(skills[0].checklist).toContain('Real checklist item');
      expect(skills[0].checklist).toContain('Another checklist item');
    });
  });

  describe('source field', () => {
    it('marks loaded skills with source "profile"', () => {
      createSkill('clarity', '# Clarity');

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].source).toBe('profile');
    });
  });

  describe('frontmatter handling', () => {
    it('loads skill with YAML frontmatter', () => {
      const skillContent = `---
name: clarity
description: "Kernighan's clarity"
allowed-tools: []
---

# Clarity

Be clear and simple.
`;
      createSkill('clarity', skillContent);

      const skills = loadSkills(TEST_DIR, ['clarity']);

      expect(skills[0].content).toContain('---');
      expect(skills[0].content).toContain('Be clear and simple');
    });
  });
});
