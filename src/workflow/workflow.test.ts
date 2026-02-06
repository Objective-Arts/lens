/**
 * Workflow Skills Module Tests
 *
 * Validates:
 * 1. Path traversal protection on install
 * 2. Skill listing from source directory
 * 3. Skill installation and manifest tracking
 * 4. Status checking and upgrade categorization
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  installWorkflowSkill,
  listWorkflowSkills,
  installAllWorkflowSkills,
  checkWorkflowStatus,
  upgradeWorkflowSkills,
  getWorkflowSourceInfo
} from './index.js';

describe('path traversal protection', () => {
  const testDir = path.join(tmpdir(), `workflow-traversal-test-${Date.now()}`);

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('rejects skill names with forward slash', () => {
    const result = installWorkflowSkill('../../etc/passwd', testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('path traversal');
  });

  it('rejects skill names with dot-dot traversal', () => {
    const result = installWorkflowSkill('..', testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('path traversal');
  });

  it('rejects skill names with backslash', () => {
    const result = installWorkflowSkill('..\\..\\etc', testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('path traversal');
  });

  it('allows valid skill names with hyphens', () => {
    const result = installWorkflowSkill('valid-skill-name', testDir);
    // Should not fail with path traversal error (may fail for other reasons)
    expect(result.message).not.toContain('path traversal');
  });
});

describe('listWorkflowSkills', () => {
  it('returns an array', () => {
    const skills = listWorkflowSkills();
    expect(Array.isArray(skills)).toBe(true);
  });

  it('each skill has name and path', () => {
    const skills = listWorkflowSkills();
    for (const skill of skills) {
      expect(skill.name).toBeTruthy();
      expect(skill.path).toBeTruthy();
    }
  });

  it('skill paths exist on disk', () => {
    const skills = listWorkflowSkills();
    for (const skill of skills) {
      expect(fs.existsSync(skill.path)).toBe(true);
    }
  });

  it('does not include hidden directories', () => {
    const skills = listWorkflowSkills();
    const hiddenSkills = skills.filter(s => s.name.startsWith('.'));
    expect(hiddenSkills).toEqual([]);
  });

  it('does not include node_modules', () => {
    const skills = listWorkflowSkills();
    const nodeModules = skills.filter(s => s.name === 'node_modules');
    expect(nodeModules).toEqual([]);
  });
});

describe('getWorkflowSourceInfo', () => {
  it('returns source info with path', () => {
    const info = getWorkflowSourceInfo();
    expect(info.path).toBeTruthy();
    expect(info.type).toBe('local');
  });
});

describe('installWorkflowSkill', () => {
  const testDir = path.join(tmpdir(), `workflow-install-test-${Date.now()}`);

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('fails gracefully for nonexistent skill', () => {
    const result = installWorkflowSkill('nonexistent-skill-xyz', testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('installs a real skill if source exists', () => {
    const skills = listWorkflowSkills();
    if (skills.length === 0) return; // Skip if no skills available

    const skill = skills[0];
    const result = installWorkflowSkill(skill.name, testDir);
    expect(result.success).toBe(true);

    // Verify files were copied
    const installedPath = path.join(testDir, '.claude', 'skills', skill.name, 'SKILL.md');
    expect(fs.existsSync(installedPath)).toBe(true);
  });

  it('blocks duplicate install without --force', () => {
    const skills = listWorkflowSkills();
    if (skills.length === 0) return;

    const skill = skills[0];
    // First install already done in previous test
    const result = installWorkflowSkill(skill.name, testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('already installed');
  });

  it('allows overwrite with force', () => {
    const skills = listWorkflowSkills();
    if (skills.length === 0) return;

    const skill = skills[0];
    const result = installWorkflowSkill(skill.name, testDir, { force: true });
    expect(result.success).toBe(true);
  });

  it('creates manifest after install', () => {
    const skills = listWorkflowSkills();
    if (skills.length === 0) return; // Skip if no skills available

    const manifestPath = path.join(testDir, '.claude', 'workflow-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.skills).toBeDefined();
    expect(manifest.source).toBeDefined();
    expect(manifest.installedAt).toBeDefined();
  });
});

describe('checkWorkflowStatus', () => {
  it('returns empty array for project without manifest', () => {
    const testDir = path.join(tmpdir(), `workflow-status-test-${Date.now()}`);
    const statuses = checkWorkflowStatus(testDir);
    expect(statuses).toEqual([]);
  });
});

describe('upgradeWorkflowSkills', () => {
  it('returns error for project without manifest', () => {
    const testDir = path.join(tmpdir(), `workflow-upgrade-test-${Date.now()}`);
    const result = upgradeWorkflowSkills(testDir);
    expect(result.errors).toContain('No workflow manifest found');
  });
});
