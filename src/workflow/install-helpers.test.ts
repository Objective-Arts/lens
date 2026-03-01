/**
 * Tests for workflow install-helpers:
 * lstatTarget, removeTarget, checkAlreadyInstalled,
 * copyRubricFiles, installOneSkill, upgradeOneSkill, skipReason logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  lstatTarget,
  removeTarget,
  checkAlreadyInstalled,
  copyRubricFiles,
  installOneSkill,
  upgradeOneSkill
} from './install-helpers.js';
import type { WorkflowStatusInfo, WorkflowSkillInfo } from './types.js';

// ---------------------------------------------------------------------------
// lstatTarget
// ---------------------------------------------------------------------------

describe('lstatTarget', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-lstat-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns exists:false for missing path', () => {
    const result = lstatTarget(path.join(tmpDir, 'nonexistent'));
    expect(result.exists).toBe(false);
    expect(result.isSymlink).toBe(false);
  });

  it('returns exists:true, isSymlink:false for regular directory', () => {
    const dir = path.join(tmpDir, 'regular');
    fs.mkdirSync(dir);
    const result = lstatTarget(dir);
    expect(result.exists).toBe(true);
    expect(result.isSymlink).toBe(false);
  });

  it('returns exists:true, isSymlink:true for symlink', () => {
    const source = path.join(tmpDir, 'source');
    const link = path.join(tmpDir, 'link');
    fs.mkdirSync(source);
    fs.symlinkSync(source, link);
    const result = lstatTarget(link);
    expect(result.exists).toBe(true);
    expect(result.isSymlink).toBe(true);
  });

  it('returns exists:true, isSymlink:true for broken symlink', () => {
    const link = path.join(tmpDir, 'broken');
    fs.symlinkSync('/nonexistent/path', link);
    const result = lstatTarget(link);
    expect(result.exists).toBe(true);
    expect(result.isSymlink).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeTarget
// ---------------------------------------------------------------------------

describe('removeTarget', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-removeTarget-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes a symlink using unlinkSync', () => {
    const source = path.join(tmpDir, 'source');
    const link = path.join(tmpDir, 'link');
    fs.mkdirSync(source);
    fs.symlinkSync(source, link);

    removeTarget(link, true, tmpDir);
    expect(fs.existsSync(link)).toBe(false);
  });

  it('removes a real directory recursively', () => {
    const dir = path.join(tmpDir, 'dir');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'file.txt'), 'content');

    removeTarget(dir, false, tmpDir);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('throws when path escapes expectedRoot', () => {
    const dir = path.join(tmpDir, 'dir');
    fs.mkdirSync(dir);

    expect(() => removeTarget(dir, false, path.join(tmpDir, 'other-root'))).toThrow('Path escapes expected root');
  });
});

// ---------------------------------------------------------------------------
// checkAlreadyInstalled
// ---------------------------------------------------------------------------

describe('checkAlreadyInstalled', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-checkInstalled-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null when installed content differs from source', () => {
    const source = path.join(tmpDir, 'source');
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(source);
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(source, 'SKILL.md'), '# Source Content', 'utf-8');
    fs.writeFileSync(path.join(target, 'SKILL.md'), '# Different Content', 'utf-8');

    const result = checkAlreadyInstalled(target, source, 'test-skill');
    expect(result).toBeNull();
  });

  it('returns failure message when installed content matches source', () => {
    const source = path.join(tmpDir, 'source');
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(source);
    fs.mkdirSync(target);
    const content = '# Same Content\nNo differences here.\n';
    fs.writeFileSync(path.join(source, 'SKILL.md'), content, 'utf-8');
    fs.writeFileSync(path.join(target, 'SKILL.md'), content, 'utf-8');

    const result = checkAlreadyInstalled(target, source, 'my-skill');
    expect(result).not.toBeNull();
    expect(result!.success).toBe(false);
    expect(result!.message).toContain('my-skill');
    expect(result!.message).toContain('already installed');
  });
});

// ---------------------------------------------------------------------------
// copyRubricFiles
// ---------------------------------------------------------------------------

describe('copyRubricFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-rubric-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('does nothing when rubric source directory does not exist', () => {
    const projectDir = path.join(tmpDir, 'project');
    const sourceDir = path.join(tmpDir, 'source');
    fs.mkdirSync(projectDir);
    fs.mkdirSync(sourceDir);
    // No rubric/ subdir in sourceDir

    expect(() => copyRubricFiles(projectDir, sourceDir)).not.toThrow();
    expect(fs.existsSync(path.join(projectDir, '.claude', 'rubric'))).toBe(false);
  });

  it('copies rubric files from source to project .claude/rubric', () => {
    const projectDir = path.join(tmpDir, 'project');
    const sourceDir = path.join(tmpDir, 'source');
    const rubricSource = path.join(sourceDir, 'rubric');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(rubricSource, { recursive: true });
    fs.writeFileSync(path.join(rubricSource, 'quality.md'), '# Quality Criteria', 'utf-8');

    copyRubricFiles(projectDir, sourceDir);

    const rubricTarget = path.join(projectDir, '.claude', 'rubric');
    expect(fs.existsSync(rubricTarget)).toBe(true);
    expect(fs.existsSync(path.join(rubricTarget, 'quality.md'))).toBe(true);
  });

  it('replaces existing rubric directory on re-copy', () => {
    const projectDir = path.join(tmpDir, 'project');
    const sourceDir = path.join(tmpDir, 'source');
    const rubricSource = path.join(sourceDir, 'rubric');
    const rubricTarget = path.join(projectDir, '.claude', 'rubric');

    fs.mkdirSync(rubricSource, { recursive: true });
    fs.mkdirSync(rubricTarget, { recursive: true });
    fs.writeFileSync(path.join(rubricTarget, 'old.md'), '# Old', 'utf-8');
    fs.writeFileSync(path.join(rubricSource, 'new.md'), '# New', 'utf-8');

    copyRubricFiles(projectDir, sourceDir);

    expect(fs.existsSync(path.join(rubricTarget, 'new.md'))).toBe(true);
    // Old file should be gone (directory was replaced)
    expect(fs.existsSync(path.join(rubricTarget, 'old.md'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// installOneSkill
// ---------------------------------------------------------------------------

describe('installOneSkill', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-install-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeSkill(name: string): WorkflowSkillInfo {
    return { name, path: `/some/path/${name}` };
  }

  function makeInstallFn(
    successFor: Set<string>
  ): (name: string, _p: string, _opts: object) => { success: boolean; message: string } {
    return (name) => successFor.has(name)
      ? { success: true, message: `Installed ${name}` }
      : { success: false, message: `Failed to install ${name}` };
  }

  it('skips skills not in userFacingSkills set', () => {
    const results = { installed: [], skipped: [], errors: [] };
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    installOneSkill(
      makeSkill('internal-skill'),
      tmpDir, skillsDir, {},
      new Set(['other-skill']), // internal-skill not in here
      makeInstallFn(new Set(['internal-skill'])),
      results
    );

    expect(results.skipped.length).toBe(1);
    expect(results.skipped[0]).toContain('internal-skill');
    expect(results.installed.length).toBe(0);
  });

  it('records skill as installed when installFn succeeds', () => {
    const results = { installed: [], skipped: [], errors: [] };
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    installOneSkill(
      makeSkill('my-skill'),
      tmpDir, skillsDir, {},
      new Set(['my-skill']),
      makeInstallFn(new Set(['my-skill'])),
      results
    );

    expect(results.installed).toContain('my-skill');
    expect(results.errors.length).toBe(0);
  });

  it('records skill as skipped when already installed and no force', () => {
    const results = { installed: [], skipped: [], errors: [] };
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    // Create the skill dir to simulate "already installed"
    fs.mkdirSync(path.join(skillsDir, 'my-skill'));

    installOneSkill(
      makeSkill('my-skill'),
      tmpDir, skillsDir, { force: false },
      new Set(['my-skill']),
      makeInstallFn(new Set()), // always fails
      results
    );

    expect(results.skipped.length).toBe(1);
    expect(results.skipped[0]).toContain('already installed');
  });

  it('records error when installFn fails and target does not exist', () => {
    const results = { installed: [], skipped: [], errors: [] };
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    installOneSkill(
      makeSkill('bad-skill'),
      tmpDir, skillsDir, {},
      new Set(['bad-skill']),
      makeInstallFn(new Set()), // always fails
      results
    );

    expect(results.errors.length).toBe(1);
    expect(results.errors[0]).toContain('bad-skill');
  });
});

// ---------------------------------------------------------------------------
// upgradeOneSkill
// ---------------------------------------------------------------------------

describe('upgradeOneSkill', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-upgrade-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeStatus(
    name: string,
    status: WorkflowStatusInfo['status']
  ): WorkflowStatusInfo & { name: string } {
    return { name, status };
  }

  function makeInstallFn(
    successFor: Set<string>
  ): (name: string, _p: string, _opts: object) => { success: boolean; message: string } {
    return (name) => successFor.has(name)
      ? { success: true, message: `Upgraded ${name}` }
      : { success: false, message: `Failed: ${name}` };
  }

  it('skips skill with status "current"', () => {
    const results = { upgraded: [], skipped: [], errors: [] };

    upgradeOneSkill(
      makeStatus('my-skill', 'current'),
      tmpDir, false,
      new Set(['my-skill']),
      makeInstallFn(new Set(['my-skill'])),
      results
    );

    expect(results.skipped.length).toBe(1);
    expect(results.skipped[0]).toContain('already current');
    expect(results.upgraded.length).toBe(0);
  });

  it('skips locally modified skill without force', () => {
    const results = { upgraded: [], skipped: [], errors: [] };

    upgradeOneSkill(
      makeStatus('my-skill', 'modified'),
      tmpDir, false,
      new Set(['my-skill']),
      makeInstallFn(new Set(['my-skill'])),
      results
    );

    expect(results.skipped.length).toBe(1);
    expect(results.skipped[0]).toContain('locally modified');
  });

  it('upgrades locally modified skill with force', () => {
    const results = { upgraded: [], skipped: [], errors: [] };

    upgradeOneSkill(
      makeStatus('my-skill', 'modified'),
      tmpDir, true, // force=true
      new Set(['my-skill']),
      makeInstallFn(new Set(['my-skill'])),
      results
    );

    expect(results.upgraded).toContain('my-skill');
    expect(results.skipped.length).toBe(0);
  });

  it('skips skill not in userFacingSkills', () => {
    const results = { upgraded: [], skipped: [], errors: [] };

    upgradeOneSkill(
      makeStatus('internal-skill', 'outdated'),
      tmpDir, true,
      new Set(['other-skill']), // internal-skill not here
      makeInstallFn(new Set(['internal-skill'])),
      results
    );

    expect(results.skipped.length).toBe(1);
    expect(results.skipped[0]).toContain('internal');
  });

  it('records error when installFn fails', () => {
    const results = { upgraded: [], skipped: [], errors: [] };

    upgradeOneSkill(
      makeStatus('bad-skill', 'outdated'),
      tmpDir, true,
      new Set(['bad-skill']),
      makeInstallFn(new Set()), // always fails
      results
    );

    expect(results.errors.length).toBe(1);
    expect(results.errors[0]).toContain('bad-skill');
  });

  it('skips skill with missing status', () => {
    const results = { upgraded: [], skipped: [], errors: [] };

    upgradeOneSkill(
      makeStatus('missing-skill', 'missing'),
      tmpDir, false,
      new Set(['missing-skill']),
      makeInstallFn(new Set(['missing-skill'])),
      results
    );

    expect(results.skipped.length).toBe(1);
    expect(results.skipped[0]).toContain('missing');
  });
});
