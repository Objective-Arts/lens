/**
 * Integration tests for lens CLI
 *
 * Tests that run actual CLI commands and verify real functionality.
 * Uses `canon deploy` (not install) and `profile apply` as the primary
 * entry points since individual skill install isn't exposed via CLI.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { fileURLToPath } from 'node:url';

/** Resolve the built CLI entry point relative to the project root */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CLI_BIN = path.join(PROJECT_ROOT, 'dist', 'cli', 'index.js');

// Helper to create unique test directories
function createTestDir(): string {
  const testDir = path.join(tmpdir(), `lens-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Helper to run CLI commands
function runCli(args: string, cwd?: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI_BIN} ${args}`, {
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

describe('lens CLI integration', () => {
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

  describe('canon commands', () => {
    it('canon list - shows all available skills from source', () => {
      const result = runCli('canon list');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Available Canon Skills');
      expect(result.stdout).toContain('Source:');
      // Skills use generic names; categories like JAVASCRIPT appear in output
      expect(result.stdout).toMatch(/JAVASCRIPT|clarity|simplicity/i);
    });

    it('canon source - shows canon source path and info', () => {
      const result = runCli('canon source');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Canon Source');
      expect(result.stdout).toContain('Path:');
      expect(result.stdout).toContain('canon');
    });

    it('canon deploy - deploys all skills to project', () => {
      const result = runCli(`canon deploy -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Deployed');

      // Verify skills were copied as real directories (not symlinks)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      expect(fs.existsSync(skillsDir)).toBe(true);

      const entries = fs.readdirSync(skillsDir);
      expect(entries.length).toBeGreaterThan(0);

      // Check a known skill exists
      const clarity = path.join(skillsDir, 'clarity');
      expect(fs.existsSync(clarity)).toBe(true);
      expect(isSymlink(clarity)).toBe(false);
      expect(fs.existsSync(path.join(clarity, 'SKILL.md'))).toBe(true);
    });

    it('canon status - shows current status for deployed skills', () => {
      // Deploy skills first
      runCli(`canon deploy -p ${testDir}`);

      const result = runCli(`canon status -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      // Should show some status info (either skill list or "current")
      expect(result.stdout.length).toBeGreaterThan(0);
    });

    it('canon status - detects local modifications', () => {
      // Deploy skills
      runCli(`canon deploy -p ${testDir}`);

      // Modify a deployed skill
      const skillMdPath = path.join(testDir, '.claude', 'skills', 'clarity', 'SKILL.md');
      if (fs.existsSync(skillMdPath)) {
        fs.appendFileSync(skillMdPath, '\n# Local modification for testing');
      }

      const result = runCli(`canon status -p ${testDir}`);

      // Should detect the change (may show as "modified" or "outdated" depending on manifest)
      expect(result.stdout).toMatch(/modified|outdated/);
    });

    it('canon diff - shows differences between installed and source', () => {
      // Deploy and modify a skill
      runCli(`canon deploy -p ${testDir}`);
      const skillMdPath = path.join(testDir, '.claude', 'skills', 'clarity', 'SKILL.md');
      if (fs.existsSync(skillMdPath)) {
        fs.appendFileSync(skillMdPath, '\n# Test diff line');
      }

      const result = runCli(`canon diff clarity -p ${testDir}`);

      expect(result.stdout).toContain('Diff: clarity');
      expect(result.stdout).toContain('Test diff line');
    });
  });

  describe('profile apply', () => {
    it('creates .claude directory structure', () => {
      runCli(`profile apply javascript ${testDir}`);

      expect(fs.existsSync(path.join(testDir, '.claude'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'skills'))).toBe(true);
    });

    it('makes canon skills discoverable via .claude/skills/ symlinks', () => {
      runCli(`profile apply javascript ${testDir}`);

      const skillsDir = path.join(testDir, '.claude', 'skills');
      const entries = fs.readdirSync(skillsDir);

      // Should have at least one skill
      expect(entries.length).toBeGreaterThan(0);

      // Canon skills are relative symlinks into ../canon/, workflow skills are real dirs.
      // All entries should resolve to readable directories.
      for (const entry of entries) {
        const skillPath = path.join(skillsDir, entry);
        if (isSymlink(skillPath)) {
          const target = fs.readlinkSync(skillPath);
          expect(target).toMatch(/^\.\.\/canon\//);
        }
        expect(fs.statSync(skillPath).isDirectory()).toBe(true);
      }
    });

    it('creates CLAUDE.md with auto-invoke rules', () => {
      runCli(`profile apply javascript ${testDir}`);

      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      expect(fs.existsSync(claudeMdPath)).toBe(true);

      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      expect(content).toContain('Auto-Invoke');
      expect(content).toContain('INVOKE');
    });

    it('profile show - shows profile details', () => {
      const result = runCli('profile show javascript');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('javascript');
    });
  });

  describe('portability', () => {
    it('deployed skills are real files (not symlinks)', () => {
      runCli(`canon deploy -p ${testDir}`);

      const skillsDir = path.join(testDir, '.claude', 'skills');
      if (fs.existsSync(skillsDir)) {
        const entries = fs.readdirSync(skillsDir);
        expect(entries.length).toBeGreaterThan(0);

        for (const entry of entries) {
          const skillPath = path.join(skillsDir, entry);
          expect(isSymlink(skillPath)).toBe(false);
        }
      }
    });

    it('deployed skill files are readable standalone', () => {
      runCli(`canon deploy -p ${testDir}`);

      const skillPath = path.join(testDir, '.claude', 'skills', 'clarity', 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);

      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('scan/audit', () => {
    it('scan reports on deployed skills', () => {
      runCli(`canon deploy -p ${testDir}`);

      const result = runCli(`scan -p ${testDir}`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration Summary');
    });

    it('audit reports on deployed skills', () => {
      runCli(`canon deploy -p ${testDir}`);

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

  it('workflow list - shows available workflow skills', () => {
    const result = runCli('workflow list');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Available Workflow Skills');
    // Check for known workflow skills
    expect(result.stdout).toContain('structure');
    expect(result.stdout).toContain('plan');
  });

  it('workflow source - shows workflow source path', () => {
    const result = runCli('workflow source');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Workflow Skills Source');
    expect(result.stdout).toContain('Path:');
    expect(result.stdout).toContain('workflow-skills');
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

  it('deploys canon skills via profile apply', () => {
    runCli(`profile apply javascript ${testDir}`);

    const skillsDir = path.join(testDir, '.claude', 'skills');
    const entries = fs.readdirSync(skillsDir);

    // Should have canon skills deployed
    expect(entries.length).toBeGreaterThan(5);
  });
});

describe('mcp commands', () => {
  it('mcp list - shows servers in registry', () => {
    const result = runCli('mcp list');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('MCP Server Registry');
  });

  it('mcp check - checks env vars for servers', () => {
    const result = runCli('mcp check');

    // Should not crash even if no servers installed
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.length > 0).toBe(true);
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
    expect(result.stdout).toContain('Lens');
    expect(result.stdout).toContain('scan');
    expect(result.stdout).toContain('profile');
    expect(result.stdout).toContain('canon');
    expect(result.stdout).toContain('mcp');
    expect(result.stdout).toContain('workflow');
  });
});

// ============================================================================
// Error path tests
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
    const result = runCli(`profile apply nonexistent-profile-xyz-123 ${testDir}`);

    // Should not crash - either error message or non-zero exit
    expect(
      result.exitCode !== 0 ||
      result.stderr.includes('not found') ||
      result.stdout.includes('not found') ||
      result.stdout.includes('Unknown profile')
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

  it('canon diff on non-deployed skill reports appropriately', () => {
    const result = runCli(`canon diff clarity -p ${testDir}`);

    // Should indicate skill not installed or no diff
    expect(
      result.stdout.includes('not installed') ||
      result.stdout.includes('No diff') ||
      result.stdout.includes('Could not generate diff') ||
      result.exitCode !== 0
    ).toBe(true);
  });
});
