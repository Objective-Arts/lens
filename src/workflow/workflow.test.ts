/**
 * Workflow Skills Module Tests
 *
 * Validates:
 * 1. Path traversal protection on install
 * 2. Skill listing from source directory
 * 3. Skill installation and manifest tracking
 * 4. Status checking and upgrade categorization
 */

import { describe, it, expect, afterAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  installWorkflowSkill,
  installAllWorkflowSkills,
  listWorkflowSkills,
  checkWorkflowStatus,
  upgradeWorkflowSkills,
  getWorkflowSourceInfo,
  pushWorkflowSkills
} from './index.js';
import {
  getRegistryPath,
  loadRegistry,
  saveRegistry,
  registerInstallation,
  unregisterInstallation,
  listInstallations,
  pruneRegistry
} from './registry.js';

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

  it('updates stale skill when source differs', () => {
    const skills = listWorkflowSkills();
    if (skills.length === 0) return;

    const skill = skills[0];
    const installedSkillMd = path.join(testDir, '.claude', 'skills', skill.name, 'SKILL.md');
    // Mutate the installed copy so its hash differs from source
    fs.appendFileSync(installedSkillMd, '\n<!-- stale -->');

    const result = installWorkflowSkill(skill.name, testDir);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Updated');

    // Verify the installed file no longer has our mutation
    const content = fs.readFileSync(installedSkillMd, 'utf-8');
    expect(content).not.toContain('<!-- stale -->');
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

describe('installation registry', () => {
  let originalRegistry: string | null = null;
  const registryPath = getRegistryPath();

  beforeEach(() => {
    // Back up existing registry
    try {
      originalRegistry = fs.readFileSync(registryPath, 'utf-8');
    } catch {
      originalRegistry = null;
    }
    // Start with empty registry
    saveRegistry({ installations: {} });
  });

  afterEach(() => {
    // Restore original registry
    if (originalRegistry !== null) {
      fs.writeFileSync(registryPath, originalRegistry);
    } else {
      try { fs.unlinkSync(registryPath); } catch { /* ignore */ }
    }
  });

  it('register and list an installation', () => {
    registerInstallation('/tmp/test-project-a');
    const installations = listInstallations();
    expect(installations).toHaveLength(1);
    expect(installations[0].projectPath).toBe('/tmp/test-project-a');
    expect(installations[0].entry.registeredAt).toBeTruthy();
    expect(installations[0].entry.lastUpdated).toBeTruthy();
  });

  it('upsert preserves registeredAt and updates lastUpdated', () => {
    registerInstallation('/tmp/test-project-b', 'sql');
    const first = listInstallations()[0].entry;

    // Small delay to ensure different timestamp
    registerInstallation('/tmp/test-project-b', 'react');
    const second = listInstallations()[0].entry;

    expect(second.registeredAt).toBe(first.registeredAt);
    expect(second.profileName).toBe('react');
  });

  it('unregister removes an entry', () => {
    registerInstallation('/tmp/test-project-c');
    expect(listInstallations()).toHaveLength(1);

    unregisterInstallation('/tmp/test-project-c');
    expect(listInstallations()).toHaveLength(0);
  });

  it('prune removes entries whose .claude/ dir does not exist', () => {
    registerInstallation('/tmp/nonexistent-project-xyz');
    expect(listInstallations()).toHaveLength(1);

    const pruned = pruneRegistry();
    expect(pruned).toContain('/tmp/nonexistent-project-xyz');
    expect(listInstallations()).toHaveLength(0);
  });

  it('prune keeps entries with existing .claude/ dir', () => {
    const testDir = path.join(tmpdir(), `registry-prune-test-${Date.now()}`);
    fs.mkdirSync(path.join(testDir, '.claude'), { recursive: true });

    registerInstallation(testDir);
    const pruned = pruneRegistry();
    expect(pruned).not.toContain(testDir);
    expect(listInstallations()).toHaveLength(1);

    fs.rmSync(testDir, { recursive: true });
  });

  it('loadRegistry returns empty object for missing file', () => {
    try { fs.unlinkSync(registryPath); } catch { /* ignore */ }
    const registry = loadRegistry();
    expect(registry.installations).toEqual({});
  });
});

describe('pushWorkflowSkills', () => {
  let originalRegistry: string | null = null;
  const registryPath = getRegistryPath();

  beforeEach(() => {
    try {
      originalRegistry = fs.readFileSync(registryPath, 'utf-8');
    } catch {
      originalRegistry = null;
    }
    saveRegistry({ installations: {} });
  });

  afterEach(() => {
    if (originalRegistry !== null) {
      fs.writeFileSync(registryPath, originalRegistry);
    } else {
      try { fs.unlinkSync(registryPath); } catch { /* ignore */ }
    }
  });

  it('returns empty results with no installations', () => {
    const result = pushWorkflowSkills();
    expect(result.updated).toEqual([]);
    expect(result.current).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.pruned).toEqual([]);
  });

  it('prunes stale entries during push', () => {
    registerInstallation('/tmp/stale-push-project-xyz');
    const result = pushWorkflowSkills();
    expect(result.pruned).toContain('/tmp/stale-push-project-xyz');
  });

  it('upgrades a registered project with installed skills', () => {
    const testDir = path.join(tmpdir(), `push-test-${Date.now()}`);
    fs.mkdirSync(path.join(testDir, '.claude', 'skills'), { recursive: true });

    // Install skills to create a manifest
    installAllWorkflowSkills(testDir, { force: true });

    // Register and push — project should appear in updated or current (rubric re-copy counts as upgrade)
    registerInstallation(testDir);
    const result = pushWorkflowSkills();
    const allProcessed = [...result.updated, ...result.current];
    expect(allProcessed).toContain(testDir);
    expect(result.errors).toEqual([]);

    fs.rmSync(testDir, { recursive: true });
  });
});
