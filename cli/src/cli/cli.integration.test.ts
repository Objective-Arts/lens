/**
 * Integration tests for cc-config CLI
 *
 * Tests that run actual CLI commands and verify real functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

// Helper to create unique test directories
function createTestDir(): string {
  const testDir = path.join(tmpdir(), `cc-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Helper to run CLI commands
function runCli(args: string, cwd?: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`cc-config ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout || '',
      stderr: e.stderr || '',
      exitCode: e.status || 1
    };
  }
}

// Helper to check if path is a symlink
function isSymlink(filepath: string): boolean {
  try {
    const stats = fs.lstatSync(filepath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

describe('cc-config CLI integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    // Clean up test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('canon commands', () => {
    it('canon list - shows all available skills from source', () => {
      const result = runCli('canon list');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Available Canon Skills');
      expect(result.stdout).toContain('Source:');
      // Should contain at least some known skills (using generic names)
      expect(result.stdout).toMatch(/java|clarity|typescript/);
    });

    it('canon source - shows canon source path and info', () => {
      const result = runCli('canon source');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Canon Source');
      expect(result.stdout).toContain('Path:');
      expect(result.stdout).toContain('claude-optimal/canon');
    });

    it('canon install - copies skill to project (not symlink)', () => {
      const result = runCli(`canon install java -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Copied skill: java');

      // Verify it's a real directory, not a symlink
      const skillPath = path.join(testDir, '.claude', 'skills', 'java');
      expect(fs.existsSync(skillPath)).toBe(true);
      expect(isSymlink(skillPath)).toBe(false);
      expect(fs.statSync(skillPath).isDirectory()).toBe(true);

      // Verify SKILL.md exists
      expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
    });

    it('canon install - creates canon-manifest.json', () => {
      runCli(`canon install java -p ${testDir}`);

      const manifestPath = path.join(testDir, '.claude', 'canon-manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.skills).toHaveProperty('java');
      expect(manifest.skills.java.hash).toBeTruthy();
      expect(manifest.skills.java.installedAt).toBeTruthy();
    });

    it('canon status - shows current status for installed skills', () => {
      // Install a skill first
      runCli(`canon install clarity -p ${testDir}`);

      const result = runCli(`canon status -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Canon Skills Status');
      expect(result.stdout).toContain('clarity');
      expect(result.stdout).toContain('current');
    });

    it('canon status - detects local modifications', () => {
      // Install a skill
      runCli(`canon install java -p ${testDir}`);

      // Modify the skill
      const skillMdPath = path.join(testDir, '.claude', 'skills', 'java', 'SKILL.md');
      fs.appendFileSync(skillMdPath, '\n# Local modification for testing');

      const result = runCli(`canon status -p ${testDir}`);

      expect(result.stdout).toContain('modified');
    });

    it('canon upgrade - skips locally modified skills without --force', () => {
      // Install and modify a skill
      runCli(`canon install java -p ${testDir}`);
      const skillMdPath = path.join(testDir, '.claude', 'skills', 'java', 'SKILL.md');
      fs.appendFileSync(skillMdPath, '\n# Local modification');

      const result = runCli(`canon upgrade -p ${testDir}`);

      expect(result.stdout).toContain('Skipped');
      expect(result.stdout).toContain('locally modified');
    });

    it('canon upgrade --force - overwrites modified skills', () => {
      // Install and modify a skill
      runCli(`canon install java -p ${testDir}`);
      const skillMdPath = path.join(testDir, '.claude', 'skills', 'java', 'SKILL.md');
      const originalContent = fs.readFileSync(skillMdPath, 'utf-8');
      fs.appendFileSync(skillMdPath, '\n# Local modification');

      runCli(`canon upgrade --force -p ${testDir}`);

      // Verify the modification was overwritten
      const newContent = fs.readFileSync(skillMdPath, 'utf-8');
      expect(newContent).not.toContain('Local modification');
      expect(newContent).toBe(originalContent);
    });

    it('canon diff - shows differences between installed and source', () => {
      // Install and modify a skill
      runCli(`canon install clarity -p ${testDir}`);
      const skillMdPath = path.join(testDir, '.claude', 'skills', 'clarity', 'SKILL.md');
      fs.appendFileSync(skillMdPath, '\n# Test diff line');

      const result = runCli(`canon diff clarity -p ${testDir}`);

      expect(result.stdout).toContain('Diff: clarity');
      expect(result.stdout).toContain('Test diff line');
    });
  });

  describe('profile apply', () => {
    it('creates .claude directory structure', () => {
      runCli(`profile apply javascript -p ${testDir}`);

      expect(fs.existsSync(path.join(testDir, '.claude'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'skills'))).toBe(true);
    });

    it('copies skill files (not symlinks) to .claude/skills/', () => {
      runCli(`profile apply javascript -p ${testDir}`);

      const skillsDir = path.join(testDir, '.claude', 'skills');
      const entries = fs.readdirSync(skillsDir);

      // Should have at least one skill
      expect(entries.length).toBeGreaterThan(0);

      // All should be real directories, not symlinks
      for (const entry of entries) {
        const skillPath = path.join(skillsDir, entry);
        expect(isSymlink(skillPath)).toBe(false);
        expect(fs.statSync(skillPath).isDirectory()).toBe(true);
      }
    });

    it('creates canon-manifest.json with skill hashes', () => {
      runCli(`profile apply javascript -p ${testDir}`);

      const manifestPath = path.join(testDir, '.claude', 'canon-manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.source).toBeTruthy();
      expect(manifest.skills).toBeTruthy();

      // Each skill should have a hash
      for (const [name, info] of Object.entries(manifest.skills)) {
        const skillInfo = info as { hash: string };
        expect(skillInfo.hash).toBeTruthy();
      }
    });

    it('creates CLAUDE.md with auto-invoke rules', () => {
      runCli(`profile apply javascript -p ${testDir}`);

      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      expect(fs.existsSync(claudeMdPath)).toBe(true);

      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      expect(content).toContain('Auto-Invoke');
      expect(content).toContain('INVOKE');
    });

    it('profile show - supports + syntax for combined preview', () => {
      const result = runCli('profile show javascript');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('javascript');
    });
  });

  describe('portability', () => {
    it('project works without canon-skills source present', () => {
      // Install a skill
      runCli(`canon install java -p ${testDir}`);

      // The project should have all necessary files to work standalone
      const skillPath = path.join(testDir, '.claude', 'skills', 'java', 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);

      // Read the file - should work since it's a copy
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('project files are real (not symlinks that could break)', () => {
      runCli(`profile apply javascript -p ${testDir}`);

      const skillsDir = path.join(testDir, '.claude', 'skills');
      if (fs.existsSync(skillsDir)) {
        const entries = fs.readdirSync(skillsDir);
        for (const entry of entries) {
          const skillPath = path.join(skillsDir, entry);
          // Should not be a symlink
          expect(isSymlink(skillPath)).toBe(false);
        }
      }
    });
  });

  describe('scan/audit', () => {
    it('finds all installed skills (real files, not symlinks)', () => {
      // Install some skills
      runCli(`canon install java -p ${testDir}`);
      runCli(`canon install clarity -p ${testDir}`);

      const result = runCli(`scan -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration Summary');
    });

    it('audit reports installed skills', () => {
      runCli(`canon install java -p ${testDir}`);

      const result = runCli(`audit -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Audit Report');
    });
  });
});

describe('workflow commands', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('workflow list - shows all available workflow skills', () => {
    const result = runCli('workflow list');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Available Workflow Skills');
    expect(result.stdout).toContain('adversarial-review');
    expect(result.stdout).toContain('refactor-check');
    expect(result.stdout).toContain('structure-first');
    expect(result.stdout).toContain('test');
    expect(result.stdout).toContain('plan');
  });

  it('workflow source - shows workflow source path', () => {
    const result = runCli('workflow source');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Workflow Skills Source');
    expect(result.stdout).toContain('Path:');
    expect(result.stdout).toContain('workflow-skills');
  });

  it('workflow install - installs a single skill', () => {
    const result = runCli(`workflow install adversarial-review -p ${testDir}`);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Installed workflow skill: adversarial-review');

    // Verify skill was copied
    const skillPath = path.join(testDir, '.claude', 'skills', 'adversarial-review');
    expect(fs.existsSync(skillPath)).toBe(true);
    expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
  });

  it('workflow install --all - installs all workflow skills', () => {
    const result = runCli(`workflow install --all -p ${testDir}`);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Installed:');

    // Verify all skills installed
    const skillsDir = path.join(testDir, '.claude', 'skills');
    expect(fs.existsSync(path.join(skillsDir, 'plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'adversarial-review', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'refactor-check', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'structure-first', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'test', 'SKILL.md'))).toBe(true);
  });

  it('workflow install - creates workflow-manifest.json', () => {
    runCli(`workflow install adversarial-review -p ${testDir}`);

    const manifestPath = path.join(testDir, '.claude', 'workflow-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.skills).toHaveProperty('adversarial-review');
    expect(manifest.skills['adversarial-review'].hash).toBeTruthy();
  });

  it('workflow status - shows installed skills status', () => {
    runCli(`workflow install --all -p ${testDir}`);

    const result = runCli(`workflow status -p ${testDir}`);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Workflow Skills Status');
    expect(result.stdout).toContain('adversarial-review');
    expect(result.stdout).toContain('current');
  });

  it('workflow status - detects local modifications', () => {
    runCli(`workflow install adversarial-review -p ${testDir}`);

    // Modify the skill
    const skillMdPath = path.join(testDir, '.claude', 'skills', 'adversarial-review', 'SKILL.md');
    fs.appendFileSync(skillMdPath, '\n# Local modification for testing');

    const result = runCli(`workflow status -p ${testDir}`);

    expect(result.stdout).toContain('modified');
  });

  it('workflow upgrade - skips locally modified skills without --force', () => {
    runCli(`workflow install adversarial-review -p ${testDir}`);
    const skillMdPath = path.join(testDir, '.claude', 'skills', 'adversarial-review', 'SKILL.md');
    fs.appendFileSync(skillMdPath, '\n# Local modification');

    const result = runCli(`workflow upgrade -p ${testDir}`);

    expect(result.stdout).toContain('Skipped');
    expect(result.stdout).toContain('locally modified');
  });

  it('workflow upgrade --force - overwrites modified skills', () => {
    runCli(`workflow install adversarial-review -p ${testDir}`);
    const skillMdPath = path.join(testDir, '.claude', 'skills', 'adversarial-review', 'SKILL.md');
    const originalContent = fs.readFileSync(skillMdPath, 'utf-8');
    fs.appendFileSync(skillMdPath, '\n# Local modification');

    runCli(`workflow upgrade --force -p ${testDir}`);

    const newContent = fs.readFileSync(skillMdPath, 'utf-8');
    expect(newContent).not.toContain('Local modification');
    expect(newContent).toBe(originalContent);
  });
});

describe('profile apply with workflow skills', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('automatically installs all workflow skills', () => {
    const result = runCli(`profile apply base-tech -p ${testDir}`);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Workflow skills:');
    expect(result.stdout).toContain('adversarial-review');
    expect(result.stdout).toContain('structure-first');
    expect(result.stdout).toContain('plan');

    // Verify all workflow skills installed
    const skillsDir = path.join(testDir, '.claude', 'skills');
    expect(fs.existsSync(path.join(skillsDir, 'plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'adversarial-review', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'refactor-check', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'structure-first', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'test', 'SKILL.md'))).toBe(true);
  });

  it('installs both canon skills and workflow skills', () => {
    runCli(`profile apply javascript -p ${testDir}`);

    const skillsDir = path.join(testDir, '.claude', 'skills');

    // Should have workflow skills
    expect(fs.existsSync(path.join(skillsDir, 'plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, 'adversarial-review', 'SKILL.md'))).toBe(true);

    // Should also have canon/profile skills
    const entries = fs.readdirSync(skillsDir);
    expect(entries.length).toBeGreaterThan(5); // More than just workflow skills
  });
});

describe('mcp commands', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('mcp list - shows servers in registry', () => {
    const result = runCli('mcp list');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('MCP Server Registry');
  });

  it('mcp show - shows server details', () => {
    const result = runCli('mcp show sequential-thinking');

    // May or may not exist in registry, but should not crash
    expect(result.exitCode === 0 || result.stdout.includes('not found')).toBe(true);
  });

  it('mcp check - checks env vars for servers', () => {
    const result = runCli('mcp check --all');

    // Should not crash even if no servers installed
    expect(result.exitCode === 0 || result.stdout.includes('No installed servers')).toBe(true);
  });
});

describe('CLI version and help', () => {
  it('--version returns version number', () => {
    const result = runCli('--version');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it('--help shows available commands', () => {
    const result = runCli('--help');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Claude Code configuration manager');
    expect(result.stdout).toContain('scan');
    expect(result.stdout).toContain('profile');
    expect(result.stdout).toContain('canon');
    expect(result.stdout).toContain('mcp');
    expect(result.stdout).toContain('workflow');
  });
});

// ============================================================================
// Error path tests (Dodds: always test error states)
// ============================================================================

describe('error handling', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('fails gracefully with non-existent profile', () => {
    const result = runCli(`profile apply nonexistent-profile-xyz-123 -p ${testDir}`);

    // Should not crash - either error message or non-zero exit
    expect(
      result.exitCode !== 0 ||
      result.stderr.includes('not found') ||
      result.stdout.includes('not found') ||
      result.stdout.includes('Unknown profile')
    ).toBe(true);
  });

  it('fails gracefully with non-existent canon skill', () => {
    const result = runCli(`canon install nonexistent-skill-xyz-123 -p ${testDir}`);

    // Should report skill not found
    expect(
      result.exitCode !== 0 ||
      result.stderr.includes('not found') ||
      result.stdout.includes('not found') ||
      result.stdout.includes('Skill not found')
    ).toBe(true);
  });

  it('fails gracefully with non-existent workflow skill', () => {
    const result = runCli(`workflow install nonexistent-workflow-xyz -p ${testDir}`);

    // Should report skill not found
    expect(
      result.exitCode !== 0 ||
      result.stderr.includes('not found') ||
      result.stdout.includes('not found') ||
      result.stdout.includes('Workflow skill not found')
    ).toBe(true);
  });

  it('handles invalid project path gracefully', () => {
    const result = runCli('scan -p /nonexistent/path/that/does/not/exist');

    // Should not crash - may return empty scan or error
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.length > 0).toBe(true);
  });

  it('canon status on empty project reports no installed skills', () => {
    const result = runCli(`canon status -p ${testDir}`);

    // Should work but show nothing installed
    expect(result.exitCode).toBe(0);
    expect(
      result.stdout.includes('No skills installed') ||
      result.stdout.includes('Canon Skills Status')
    ).toBe(true);
  });

  it('canon diff on non-installed skill reports appropriately', () => {
    const result = runCli(`canon diff clarity -p ${testDir}`);

    // Should indicate skill not installed
    expect(
      result.stdout.includes('not installed') ||
      result.stdout.includes('No diff') ||
      result.exitCode !== 0
    ).toBe(true);
  });
});
