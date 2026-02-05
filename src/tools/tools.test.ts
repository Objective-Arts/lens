/**
 * Tools Module Tests
 *
 * Tests for companion CLI tools management.
 * Note: Ralph is now TypeScript-based, installed via npm link.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-tools-test-'));
    originalEnv = process.env.CC_BIN_DIR;
    process.env.CC_BIN_DIR = tempDir;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CC_BIN_DIR = originalEnv;
    } else {
      delete process.env.CC_BIN_DIR;
    }
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

    it('shows not installed status for ralph', () => {
      const tools = listTools();
      const ralph = tools.find(t => t.name === 'ralph');

      expect(ralph!.installed).toBe(false);
      expect(ralph!.path).toBeUndefined();
    });
  });

  describe('installTool', () => {
    it('returns message to use npm link for ralph', () => {
      const result = installTool('ralph');

      expect(result.success).toBe(false);
      expect(result.message).toContain('npm link');
    });

    it('fails for unknown tool', () => {
      const result = installTool('nonexistent-tool');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown tool');
    });
  });

  describe('uninstallTool', () => {
    it('removes installed tool file', () => {
      // Manually create a tool file
      const scriptPath = path.join(tempDir, 'ralph');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho test');

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

    it('returns true when file exists', () => {
      fs.writeFileSync(path.join(tempDir, 'ralph'), '#!/bin/bash');
      expect(isToolInstalled('ralph')).toBe(true);
    });
  });

  describe('getToolPath', () => {
    it('returns correct path in bin directory', () => {
      expect(getToolPath('ralph')).toBe(path.join(tempDir, 'ralph'));
    });
  });
});
