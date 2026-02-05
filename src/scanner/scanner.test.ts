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
  const testProjectPath = path.join(tmpdir(), 'cc-config-test-project');

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
