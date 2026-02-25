import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../profiles/index.js', () => ({
  listProfiles: vi.fn(() => []),
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
  combineProfiles: vi.fn(),
  parseProfileString: vi.fn((s: string) => s.split('+')),
  applyComposableProfile: vi.fn(),
  exampleComposableProfile: { name: 'example', skills: {} },
}));

vi.mock('../../canon/index.js', () => ({
  deployAllSkills: vi.fn(() => ({ deployed: 0, skipped: 0, deployedNames: [], errors: [] })),
}));

vi.mock('../display/index.js', () => ({
  printDryRun: vi.fn(),
  printDeployedSkills: vi.fn(),
  printApplyResults: vi.fn(),
  printProfileNotFound: vi.fn(),
}));

import { registerProfileCommands } from './profile.js';
import { saveProfile } from '../../profiles/index.js';
import { Command } from 'commander';

describe('profile commands', () => {
  describe('path traversal protection in handleCreate', () => {
    let program: Command;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      program = new Command();
      program.exitOverride(); // Prevent process.exit
      registerProfileCommands(program);
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.mocked(saveProfile).mockClear();
    });

    it('rejects names with forward slash', async () => {
      await program.parseAsync(['node', 'test', 'profile', 'create', '../../etc/passwd']);
      expect(saveProfile).not.toHaveBeenCalled();
    });

    it('rejects names with backslash', async () => {
      await program.parseAsync(['node', 'test', 'profile', 'create', '..\\..\\etc']);
      expect(saveProfile).not.toHaveBeenCalled();
    });

    it('rejects names with dot-dot traversal', async () => {
      await program.parseAsync(['node', 'test', 'profile', 'create', 'foo..bar']);
      // "foo..bar" contains ".." so it's rejected
      expect(saveProfile).not.toHaveBeenCalled();
    });

    it('allows valid profile names', async () => {
      await program.parseAsync(['node', 'test', 'profile', 'create', 'my-profile']);
      expect(saveProfile).toHaveBeenCalledTimes(1);
      expect(vi.mocked(saveProfile).mock.calls[0][0].name).toBe('my-profile');
    });

    it('rejects names with spaces', async () => {
      await program.parseAsync(['node', 'test', 'profile', 'create', 'My Profile']);
      expect(saveProfile).not.toHaveBeenCalled();
    });

    it('allows names with underscores', async () => {
      await program.parseAsync(['node', 'test', 'profile', 'create', 'My_Profile']);
      expect(saveProfile).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      consoleSpy?.mockRestore();
    });
  });
});
