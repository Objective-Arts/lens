/**
 * Tests for scanner analysis functions:
 * buildDependencies, generateSummary, extractDescription
 */

import { describe, it, expect } from 'vitest';
import { buildDependencies, generateSummary, extractDescription } from './analysis.js';
import type { ConfigItem, ClaudeMdParsed } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<ConfigItem> = {}): ConfigItem {
  return {
    name: 'my-skill',
    path: '/project/.claude/skills/my-skill/SKILL.md',
    type: 'skill',
    scope: 'project',
    isSymlink: false,
    tokens: 100,
    dependencies: [],
    referencedBy: [],
    metadata: {},
    ...overrides,
  };
}

function makeClaudeMd(overrides: Partial<ClaudeMdParsed> = {}): ClaudeMdParsed {
  return {
    path: '/project/.claude/CLAUDE.md',
    scope: 'project',
    autoInvokes: [],
    skillReferences: [],
    commandReferences: [],
    agentReferences: [],
    rawContent: '',
    sections: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildDependencies
// ---------------------------------------------------------------------------

describe('buildDependencies', () => {
  it('adds skill reference to CLAUDE.md item dependencies', () => {
    const skillItem = makeItem({ name: 'plan', path: '/p/skills/plan/SKILL.md' });
    const claudeMdItem = makeItem({
      name: 'CLAUDE.md',
      path: '/p/CLAUDE.md',
      type: 'command',
    });
    const claudeMd = makeClaudeMd({
      path: '/p/CLAUDE.md',
      skillReferences: ['plan'],
    });

    buildDependencies([skillItem, claudeMdItem], [claudeMd]);

    expect(claudeMdItem.dependencies).toContain('plan');
  });

  it('populates referencedBy on a skill when it appears in CLAUDE.md', () => {
    const skillItem = makeItem({ name: 'implement', path: '/p/skills/implement/SKILL.md' });
    const claudeMdItem = makeItem({ name: 'CLAUDE.md', path: '/p/CLAUDE.md', type: 'command' });
    const claudeMd = makeClaudeMd({
      path: '/p/CLAUDE.md',
      skillReferences: ['implement'],
    });

    buildDependencies([skillItem, claudeMdItem], [claudeMd]);

    expect(skillItem.referencedBy).toContain('CLAUDE.md');
  });

  it('handles command references', () => {
    const cmdItem = makeItem({ name: '/build', path: '/p/commands/build/SKILL.md', type: 'command' });
    const claudeMdItem = makeItem({ name: 'CLAUDE.md', path: '/p/CLAUDE.md', type: 'command' });
    const claudeMd = makeClaudeMd({
      path: '/p/CLAUDE.md',
      commandReferences: ['/build'],
    });

    buildDependencies([cmdItem, claudeMdItem], [claudeMd]);

    expect(claudeMdItem.dependencies).toContain('/build');
    expect(cmdItem.referencedBy).toContain('CLAUDE.md');
  });

  it('skips null claudeMd entries without throwing', () => {
    const items = [makeItem()];
    expect(() => buildDependencies(items, [null])).not.toThrow();
  });

  it('silently ignores unresolved skill references', () => {
    const claudeMdItem = makeItem({ name: 'CLAUDE.md', path: '/p/CLAUDE.md', type: 'command' });
    const claudeMd = makeClaudeMd({
      path: '/p/CLAUDE.md',
      skillReferences: ['unknown-skill'],
    });

    buildDependencies([claudeMdItem], [claudeMd]);

    expect(claudeMdItem.dependencies).toContain('unknown-skill');
  });

  it('leaves items untouched when claudeMds array is empty', () => {
    const skill = makeItem({ name: 'plan' });
    buildDependencies([skill], []);
    expect(skill.referencedBy).toHaveLength(0);
    expect(skill.dependencies).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateSummary
// ---------------------------------------------------------------------------

describe('generateSummary', () => {
  it('returns zero totals for empty items array', () => {
    const summary = generateSummary([], []);

    expect(summary.totalItems).toBe(0);
    expect(summary.byType.skill).toBe(0);
    expect(summary.conflicts).toHaveLength(0);
    expect(summary.missingReferences).toHaveLength(0);
    expect(summary.unusedItems).toHaveLength(0);
  });

  it('counts items by type', () => {
    const items = [
      makeItem({ type: 'skill', name: 'skill-a', path: '/p/a' }),
      makeItem({ type: 'skill', name: 'skill-b', path: '/p/b' }),
      makeItem({ type: 'command', name: 'cmd-a', path: '/p/c' }),
      makeItem({ type: 'settings', name: 'settings-a', path: '/p/d' }),
    ];

    const summary = generateSummary(items, []);

    expect(summary.byType.skill).toBe(2);
    expect(summary.byType.command).toBe(1);
    expect(summary.byType.settings).toBe(1);
    expect(summary.totalItems).toBe(4);
  });

  it('counts items by scope', () => {
    const items = [
      makeItem({ scope: 'global', name: 'g1', path: '/g1' }),
      makeItem({ scope: 'global', name: 'g2', path: '/g2' }),
      makeItem({ scope: 'project', name: 'p1', path: '/p1' }),
    ];

    const summary = generateSummary(items, []);

    expect(summary.byScope.global).toBe(2);
    expect(summary.byScope.project).toBe(1);
  });

  it('detects conflicts when two items share the same type and name', () => {
    const items = [
      makeItem({ name: 'plan', path: '/global/plan/SKILL.md', scope: 'global' }),
      makeItem({ name: 'plan', path: '/project/plan/SKILL.md', scope: 'project' }),
    ];

    const summary = generateSummary(items, []);

    expect(summary.conflicts).toHaveLength(1);
    expect(summary.conflicts[0].name).toBe('plan');
    expect(summary.conflicts[0].locations).toHaveLength(2);
  });

  it('does not flag conflict for same name but different types', () => {
    const items = [
      makeItem({ name: 'plan', type: 'skill', path: '/a' }),
      makeItem({ name: 'plan', type: 'command', path: '/b' }),
    ];

    const summary = generateSummary(items, []);

    expect(summary.conflicts).toHaveLength(0);
  });

  it('reports missing skill references from claudeMds', () => {
    const claudeMd = makeClaudeMd({
      path: '/p/CLAUDE.md',
      skillReferences: ['missing-skill'],
    });

    const summary = generateSummary([], [claudeMd]);

    expect(summary.missingReferences).toHaveLength(1);
    expect(summary.missingReferences[0].referencedName).toBe('missing-skill');
    expect(summary.missingReferences[0].referenceType).toBe('skill');
  });

  it('does not report missing reference when skill exists', () => {
    const skillItem = makeItem({ name: 'exists', path: '/p/exists' });
    const claudeMd = makeClaudeMd({
      path: '/p/CLAUDE.md',
      skillReferences: ['exists'],
    });

    const summary = generateSummary([skillItem], [claudeMd]);

    expect(summary.missingReferences).toHaveLength(0);
  });

  it('reports unused skills with zero referencedBy', () => {
    const skill = makeItem({ name: 'orphan', type: 'skill', referencedBy: [] });
    const summary = generateSummary([skill], []);

    expect(summary.unusedItems).toContain('orphan');
  });

  it('does not report skill as unused when it has referencedBy entries', () => {
    const skill = makeItem({ name: 'used', type: 'skill', referencedBy: ['CLAUDE.md'] });
    const summary = generateSummary([skill], []);

    expect(summary.unusedItems).not.toContain('used');
  });

  it('sums tokens by scope', () => {
    const items = [
      makeItem({ scope: 'global', tokens: 200, name: 'g1', path: '/g1' }),
      makeItem({ scope: 'global', tokens: 300, name: 'g2', path: '/g2' }),
      makeItem({ scope: 'project', tokens: 100, name: 'p1', path: '/p1' }),
    ];

    const summary = generateSummary(items, []);

    expect(summary.tokensByScope.global).toBe(500);
    expect(summary.tokensByScope.project).toBe(100);
    expect(summary.totalTokens).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// extractDescription
// ---------------------------------------------------------------------------

describe('extractDescription', () => {
  it('returns undefined for empty content', () => {
    expect(extractDescription('')).toBeUndefined();
  });

  it('extracts description from YAML frontmatter', () => {
    const content = `---
name: my-skill
description: "Does something useful"
---

# My Skill
`;
    expect(extractDescription(content)).toBe('Does something useful');
  });

  it('extracts description with single-quoted value', () => {
    const content = `---
description: 'Single quoted desc'
---
`;
    expect(extractDescription(content)).toBe('Single quoted desc');
  });

  it('falls back to first non-heading, non-frontmatter line', () => {
    const content = `# My Heading

This is the first paragraph line.
`;
    expect(extractDescription(content)).toBe('This is the first paragraph line.');
  });

  it('skips blank lines and heading lines to find first paragraph', () => {
    const content = `

# Title

## Subtitle

Here is the first real paragraph.
`;
    expect(extractDescription(content)).toBe('Here is the first real paragraph.');
  });

  it('truncates first paragraph to 100 characters', () => {
    const longLine = 'x'.repeat(200);
    const content = `\n${longLine}\n`;
    const result = extractDescription(content);
    expect(result).toBeDefined();
    expect(result!.length).toBeLessThanOrEqual(100);
  });

  it('returns undefined when file has only headings', () => {
    const content = `# Heading One\n## Heading Two\n### Heading Three\n`;
    expect(extractDescription(content)).toBeUndefined();
  });
});
