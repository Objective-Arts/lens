/**
 * Tools Module Tests
 *
 * Tests for companion CLI tools installation (ralph, etc.)
 * Following Dodds' Testing Trophy - focus on integration tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  listTools,
  installTool,
  uninstallTool,
  isToolInstalled,
  getToolPath,
  getBinDir
} from './index.js';

describe('Tools Module', () => {
  let tempDir: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Create isolated temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-tools-test-'));
    // Override bin directory to use temp
    originalEnv = process.env.CC_BIN_DIR;
    process.env.CC_BIN_DIR = tempDir;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.CC_BIN_DIR = originalEnv;
    } else {
      delete process.env.CC_BIN_DIR;
    }
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('getBinDir', () => {
    it('returns CC_BIN_DIR when set', () => {
      expect(getBinDir()).toBe(tempDir);
    });

    it('returns default ~/.local/bin when CC_BIN_DIR not set', () => {
      delete process.env.CC_BIN_DIR;
      const expected = path.join(os.homedir(), '.local', 'bin');
      expect(getBinDir()).toBe(expected);
    });
  });

  describe('listTools', () => {
    it('returns available tools with metadata', () => {
      const tools = listTools();

      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some(t => t.name === 'ralph')).toBe(true);
    });

    it('includes ralph with correct description', () => {
      const tools = listTools();
      const ralph = tools.find(t => t.name === 'ralph');

      expect(ralph).toBeDefined();
      expect(ralph!.description).toContain('Autonomous PRD');
    });

    it('shows correct installation status when not installed', () => {
      const tools = listTools();
      const ralph = tools.find(t => t.name === 'ralph');

      expect(ralph!.installed).toBe(false);
      expect(ralph!.path).toBeUndefined();
    });

    it('shows correct installation status when installed', () => {
      // Install first
      installTool('ralph');

      const tools = listTools();
      const ralph = tools.find(t => t.name === 'ralph');

      expect(ralph!.installed).toBe(true);
      expect(ralph!.path).toBe(path.join(tempDir, 'ralph'));
    });
  });

  describe('installTool', () => {
    it('creates executable script in bin directory', () => {
      const result = installTool('ralph');

      expect(result.success).toBe(true);
      expect(result.path).toBe(path.join(tempDir, 'ralph'));

      // Verify file exists
      const scriptPath = path.join(tempDir, 'ralph');
      expect(fs.existsSync(scriptPath)).toBe(true);

      // Verify file is executable (unix permissions)
      const stats = fs.statSync(scriptPath);
      expect(stats.mode & 0o111).toBeTruthy(); // At least one execute bit set
    });

    it('script contains shebang and expected content', () => {
      installTool('ralph');

      const content = fs.readFileSync(path.join(tempDir, 'ralph'), 'utf-8');

      expect(content.startsWith('#!/bin/bash')).toBe(true);
      expect(content).toContain('RALPH LOOP ITERATION');
      expect(content).toContain('/frost');
      expect(content).toContain('/dodds');
      expect(content).toContain('JSDoc');
    });

    it('fails when tool already installed without force', () => {
      installTool('ralph');
      const result = installTool('ralph');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already installed');
    });

    it('overwrites when force option is true', () => {
      installTool('ralph');

      // Modify the file
      const scriptPath = path.join(tempDir, 'ralph');
      fs.writeFileSync(scriptPath, '# modified');

      // Reinstall with force
      const result = installTool('ralph', { force: true });

      expect(result.success).toBe(true);

      // Verify original content restored
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('RALPH LOOP');
    });

    it('fails gracefully for unknown tool', () => {
      const result = installTool('nonexistent-tool');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown tool');
      expect(result.message).toContain('ralph'); // Should list available tools
    });

    it('creates bin directory if it does not exist', () => {
      // Remove temp dir
      fs.rmSync(tempDir, { recursive: true });
      expect(fs.existsSync(tempDir)).toBe(false);

      // Install should recreate it
      const result = installTool('ralph');

      expect(result.success).toBe(true);
      expect(fs.existsSync(tempDir)).toBe(true);
    });
  });

  describe('uninstallTool', () => {
    it('removes installed tool', () => {
      installTool('ralph');
      const scriptPath = path.join(tempDir, 'ralph');
      expect(fs.existsSync(scriptPath)).toBe(true);

      const result = uninstallTool('ralph');

      expect(result.success).toBe(true);
      expect(fs.existsSync(scriptPath)).toBe(false);
    });

    it('fails when tool not installed', () => {
      const result = uninstallTool('ralph');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not installed');
    });
  });

  describe('isToolInstalled', () => {
    it('returns false when not installed', () => {
      expect(isToolInstalled('ralph')).toBe(false);
    });

    it('returns true when installed', () => {
      installTool('ralph');
      expect(isToolInstalled('ralph')).toBe(true);
    });

    it('returns false after uninstall', () => {
      installTool('ralph');
      uninstallTool('ralph');
      expect(isToolInstalled('ralph')).toBe(false);
    });
  });

  describe('getToolPath', () => {
    it('returns correct path in bin directory', () => {
      expect(getToolPath('ralph')).toBe(path.join(tempDir, 'ralph'));
    });
  });

  describe('ralph script content', () => {
    it('includes mandatory workflow steps', () => {
      installTool('ralph');
      const content = fs.readFileSync(path.join(tempDir, 'ralph'), 'utf-8');

      // Check for UI/UX canon masters
      expect(content).toContain('/frost');
      expect(content).toContain('/ive');
      expect(content).toContain('/norman');
      expect(content).toContain('/wroblewski');
      expect(content).toContain('/duarte');

      // Check for code quality masters
      expect(content).toContain('/abramov');
      expect(content).toContain('/cherny');

      // Check for testing requirement
      expect(content).toContain('/dodds');
      expect(content).toContain('Testing Trophy');

      // Check for documentation requirements
      expect(content).toContain('JSDoc');
      expect(content).toContain('XML comments');
      expect(content).toContain('docstrings');

      // Check for review
      expect(content).toContain('/review-hard');
    });

    it('includes verification checklist requiring proof of skill invocation', () => {
      installTool('ralph');
      const content = fs.readFileSync(path.join(tempDir, 'ralph'), 'utf-8');

      // Must have verification checklist
      expect(content).toContain('VERIFICATION CHECKLIST');
      expect(content).toContain('Appropriate canon skills were invoked');
      expect(content).toContain('Tests written and passing');

      // Must require showing work
      expect(content).toContain('OUTPUT FORMAT');
      expect(content).toContain('SKILLS INVOKED');
      expect(content).toContain('TESTS WRITTEN');
      expect(content).toContain('TEST RESULT');
    });

    it('requires actual skill invocation not just mentions', () => {
      installTool('ralph');
      const content = fs.readFileSync(path.join(tempDir, 'ralph'), 'utf-8');

      // Should explicitly tell Claude to use Skill tool
      expect(content).toContain('ACTUALLY INVOKE');
      expect(content).toContain('use the Skill tool');
    });

    it('includes idle detection', () => {
      installTool('ralph');
      const content = fs.readFileSync(path.join(tempDir, 'ralph'), 'utf-8');

      expect(content).toContain('idle_count');
      expect(content).toContain('No progress for 3 iterations');
    });

    it('includes progress tracking', () => {
      installTool('ralph');
      const content = fs.readFileSync(path.join(tempDir, 'ralph'), 'utf-8');

      expect(content).toContain('initial_incomplete');
      expect(content).toContain('remaining');
      expect(content).toContain('completed');
    });
  });
});
