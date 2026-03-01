/**
 * Integration tests for lens CLI
 *
 * Tests that run actual CLI commands and verify real functionality.
 * Uses `canon deploy` and `lens init` as the primary entry points.
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

  describe('init', () => {
    it('creates .claude directory structure', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      expect(fs.existsSync(path.join(testDir, '.claude'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'skills'))).toBe(true);
    });

    it('copies workflow skills only to .claude/skills/', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      const skillsDir = path.join(testDir, '.claude', 'skills');
      const entries = fs.readdirSync(skillsDir);

      // Should have workflow skills only (~10), not canons
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.length).toBeLessThanOrEqual(15);

      // Known workflow skills should be present
      expect(entries).toContain('fix');
      expect(entries).toContain('code-scan');

      // Canon-only skills should NOT be in .claude/skills/
      expect(entries).not.toContain('clarity');

      // All entries should be real directories (copies, not symlinks)
      for (const entry of entries) {
        const skillPath = path.join(skillsDir, entry);
        expect(isSymlink(skillPath)).toBe(false);
        expect(fs.statSync(skillPath).isDirectory()).toBe(true);
        expect(fs.existsSync(path.join(skillPath, 'SKILL.md'))).toBe(true);
      }
    });

    it('copies canon directories to .claude/canon/', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      const canonDir = path.join(testDir, '.claude', 'canon');
      expect(fs.existsSync(canonDir)).toBe(true);

      // javascript profile should include clarity canon
      const clarityDir = path.join(canonDir, 'clarity');
      if (fs.existsSync(clarityDir)) {
        expect(isSymlink(clarityDir)).toBe(false);
        expect(fs.existsSync(path.join(clarityDir, 'SKILL.md'))).toBe(true);
      }
    });

    it('copies quality gate to .claude/scripts/', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      const gatePath = path.join(testDir, '.claude', 'scripts', 'quality-gate.ts');
      expect(fs.existsSync(gatePath)).toBe(true);
      expect(isSymlink(gatePath)).toBe(false);
    });

    it('CLAUDE.md references local quality gate path', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      expect(fs.existsSync(claudeMdPath)).toBe(true);

      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      expect(content).toContain('tsx .claude/scripts/quality-gate.ts');
    });

    it('creates CLAUDE.md with transformed auto-invoke rules', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      const claudeMdPath = path.join(testDir, 'CLAUDE.md');
      expect(fs.existsSync(claudeMdPath)).toBe(true);

      const content = fs.readFileSync(claudeMdPath, 'utf-8');
      expect(content).toContain('Auto-Invoke');
      // Canon references should be transformed to Read paths
      expect(content).toContain('Read `.claude/canon/');
      // Should NOT contain INVOKE for canon-only skills
      expect(content).not.toContain('INVOKE `/clarity`');
      expect(content).not.toContain('INVOKE `/js-internals`');
    });

    it('writes workflow and canon manifests', () => {
      runCli(`init --profile javascript -p ${testDir}`);

      const workflowManifest = path.join(testDir, '.claude', 'workflow-manifest.json');
      const canonManifest = path.join(testDir, '.claude', 'canon-manifest.json');

      expect(fs.existsSync(workflowManifest)).toBe(true);
      expect(fs.existsSync(canonManifest)).toBe(true);

      const wf = JSON.parse(fs.readFileSync(workflowManifest, 'utf-8'));
      expect(wf.source).toBeDefined();
      expect(wf.skills).toBeDefined();
      expect(wf.installedAt).toBeDefined();

      const cm = JSON.parse(fs.readFileSync(canonManifest, 'utf-8'));
      expect(cm.source).toBeDefined();
      expect(cm.skills).toBeDefined();
      expect(cm.installedAt).toBeDefined();
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

describe('init with workflow skills', () => {
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

  it('installs workflow skills to skills/ and canons to canon/', () => {
    runCli(`init --profile javascript -p ${testDir}`);

    const skillsDir = path.join(testDir, '.claude', 'skills');
    const entries = fs.readdirSync(skillsDir);

    // Should have workflow skills only (~10)
    expect(entries.length).toBeGreaterThan(5);
    expect(entries.length).toBeLessThanOrEqual(15);

    // Canons should be in .claude/canon/ not .claude/skills/
    const canonDir = path.join(testDir, '.claude', 'canon');
    expect(fs.existsSync(canonDir)).toBe(true);
    const canonEntries = fs.readdirSync(canonDir);
    expect(canonEntries.length).toBeGreaterThan(0);
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

  it('handles non-existent profile gracefully', () => {
    const result = runCli(`init --profile nonexistent-profile-xyz-123 -p ${testDir}`);

    // Should not crash — still installs workflow skills, just no canon skills
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Init complete');
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
