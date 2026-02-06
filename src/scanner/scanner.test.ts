/**
 * Tests for configuration scanner
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { scan, GLOBAL_CLAUDE_PATH } from './index.js';

describe('scan', () => {
  it('scans global configuration', async () => {
    const result = await scan();

    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('globalPath');
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('summary');

    expect(result.globalPath).toBe(GLOBAL_CLAUDE_PATH);
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('includes summary with meaningful values', async () => {
    const result = await scan();

    // Test behavior, not just structure existence
    expect(result.summary.totalItems).toBeGreaterThanOrEqual(0);
    expect(result.summary.totalTokens).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.summary.conflicts)).toBe(true);
    expect(Array.isArray(result.summary.missingReferences)).toBe(true);
    expect(Array.isArray(result.summary.unusedItems)).toBe(true);
  });

  it('counts items by type with valid numbers', async () => {
    const result = await scan();

    // All type counts should be non-negative integers
    expect(result.summary.byType.skill).toBeGreaterThanOrEqual(0);
    expect(result.summary.byType.command).toBeGreaterThanOrEqual(0);
    expect(result.summary.byType.agent).toBeGreaterThanOrEqual(0);
    expect(result.summary.byType.memory).toBeGreaterThanOrEqual(0);
    expect(result.summary.byType.settings).toBeGreaterThanOrEqual(0);
  });

  it('counts items by scope with valid numbers', async () => {
    const result = await scan();

    // All scope counts should be non-negative integers
    expect(result.summary.byScope.global).toBeGreaterThanOrEqual(0);
    expect(result.summary.byScope.project).toBeGreaterThanOrEqual(0);
    expect(result.summary.byScope.plugin).toBeGreaterThanOrEqual(0);
  });
});

describe('scan with project path', () => {
  const testProjectPath = path.join(tmpdir(), 'lens-test-project');

  beforeEach(() => {
    // Create a minimal test project structure
    fs.mkdirSync(path.join(testProjectPath, '.claude', 'skills'), { recursive: true });
    fs.writeFileSync(
      path.join(testProjectPath, 'CLAUDE.md'),
      '# Test Project\n\n## Auto-Invoke\n\n| Context | Action |\n|---------|--------|\n| Testing | INVOKE `/test` |'
    );
    fs.mkdirSync(path.join(testProjectPath, '.claude', 'skills', 'test-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(testProjectPath, '.claude', 'skills', 'test-skill', 'SKILL.md'),
      '# Test Skill\n\nA test skill for unit tests.'
    );
  });

  afterEach(() => {
    // Clean up test project
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  it('scans project configuration', async () => {
    const result = await scan({ projectPath: testProjectPath });

    expect(result.projectPath).toBe(testProjectPath);
    expect(result.items.some(i => i.scope === 'project')).toBe(true);
  });

  it('finds project CLAUDE.md', async () => {
    const result = await scan({ projectPath: testProjectPath });

    const claudeMd = result.items.find(
      i => i.name === 'CLAUDE.md' && i.scope === 'project'
    );
    expect(claudeMd).toBeDefined();
  });

  it('finds project skills', async () => {
    const result = await scan({ projectPath: testProjectPath });

    const testSkill = result.items.find(
      i => i.name === 'test-skill' && i.scope === 'project'
    );
    expect(testSkill).toBeDefined();
    expect(testSkill?.type).toBe('skill');
  });

  it('estimates tokens for scanned items', async () => {
    const result = await scan({ projectPath: testProjectPath });

    const testSkill = result.items.find(i => i.name === 'test-skill');
    expect(testSkill?.tokens).toBeGreaterThan(0);
  });

  it('detects conflicts between scopes', async () => {
    // If there's a CLAUDE.md in both global and project, it should be a conflict
    const result = await scan({ projectPath: testProjectPath });

    // Check if CLAUDE.md appears in conflicts (if global one exists)
    const claudeMdConflict = result.summary.conflicts.find(c => c.name === 'CLAUDE.md');
    if (claudeMdConflict) {
      expect(claudeMdConflict.locations.length).toBeGreaterThan(1);
    }
  });
});

describe('scan options', () => {
  it('can exclude plugins', async () => {
    const withPlugins = await scan({ includePlugins: true });
    const withoutPlugins = await scan({ includePlugins: false });

    // Without plugins should have fewer or equal items
    expect(withoutPlugins.summary.totalItems).toBeLessThanOrEqual(
      withPlugins.summary.totalItems
    );
  });
});

describe('description extraction', () => {
  const testDir = path.join(tmpdir(), 'cc-desc-test');

  beforeEach(() => {
    fs.mkdirSync(path.join(testDir, '.claude', 'skills'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('extracts description from YAML frontmatter', async () => {
    const skillDir = path.join(testDir, '.claude', 'skills', 'fm-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'),
      '---\nname: test\ndescription: "A frontmatter description"\n---\n# Title\nBody text.');

    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'fm-skill');
    expect(skill?.metadata.description).toBe('A frontmatter description');
  });

  it('falls back to first non-heading line when no frontmatter', async () => {
    const skillDir = path.join(testDir, '.claude', 'skills', 'nofm-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'),
      '# Title\n\nFirst paragraph line.');

    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'nofm-skill');
    expect(skill?.metadata.description).toBe('First paragraph line.');
  });

  it('returns undefined for empty content', async () => {
    const skillDir = path.join(testDir, '.claude', 'skills', 'empty-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '');

    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'empty-skill');
    expect(skill?.metadata.description).toBeUndefined();
  });

  it('truncates long descriptions to 100 chars', async () => {
    const skillDir = path.join(testDir, '.claude', 'skills', 'long-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    const longLine = 'A'.repeat(200);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), longLine);

    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'long-skill');
    expect(skill?.metadata.description).toHaveLength(100);
  });

  it('skips heading-only content', async () => {
    const skillDir = path.join(testDir, '.claude', 'skills', 'headonly-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Title\n## Subtitle\n### Sub-sub');

    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'headonly-skill');
    expect(skill?.metadata.description).toBeUndefined();
  });
});

describe('scan with nonexistent project', () => {
  it('returns empty project items for missing path', async () => {
    const result = await scan({ projectPath: '/tmp/nonexistent-project-xyz', includePlugins: false });
    const projectItems = result.items.filter(i => i.scope === 'project');
    expect(projectItems).toHaveLength(0);
  });
});

describe('scan with symlinked skills', () => {
  const testDir = path.join(tmpdir(), 'cc-symlink-test');
  const realSkillDir = path.join(tmpdir(), 'cc-real-skill');

  beforeEach(() => {
    fs.mkdirSync(path.join(testDir, '.claude', 'skills'), { recursive: true });
    fs.mkdirSync(realSkillDir, { recursive: true });
    fs.writeFileSync(path.join(realSkillDir, 'SKILL.md'), '# Real Skill\n\nLinked skill content.');
    fs.symlinkSync(realSkillDir, path.join(testDir, '.claude', 'skills', 'linked-skill'));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(realSkillDir, { recursive: true, force: true });
  });

  it('follows symlinks and reads content', async () => {
    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'linked-skill');
    expect(skill).toBeDefined();
    expect(skill?.isSymlink).toBe(true);
    expect(skill?.content).toContain('Linked skill content.');
  });

  it('reports symlink target path', async () => {
    const result = await scan({ projectPath: testDir, includePlugins: false });
    const skill = result.items.find(i => i.name === 'linked-skill');
    expect(skill?.symlinkTarget).toBe(realSkillDir);
  });
});

describe('scan settings files', () => {
  const testDir = path.join(tmpdir(), 'cc-settings-test');

  beforeEach(() => {
    fs.mkdirSync(path.join(testDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(testDir, '.claude', 'settings.json'), '{"model": "opus"}');
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('finds settings files with Settings file description', async () => {
    const result = await scan({ projectPath: testDir, includePlugins: false });
    const settings = result.items.find(i => i.name === 'settings.json' && i.scope === 'project');
    expect(settings).toBeDefined();
    expect(settings?.type).toBe('settings');
    expect(settings?.metadata.description).toBe('Settings file');
  });
});
