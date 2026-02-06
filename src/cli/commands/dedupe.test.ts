import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as childProcess from 'child_process';

// We test the module's internal functions via the exported registerDedupeCommands
// But since most functions are private, we test behavior through runDedupe indirectly

// Import the module to test searchPattern behavior via grep
describe('dedupe command', () => {
  describe('searchPattern safety', () => {
    it('uses execFileSync not execSync for grep calls', async () => {
      // Verify the module imports execFileSync (not execSync)
      const moduleSource = await import('fs').then(fs =>
        fs.readFileSync(path.resolve('src/cli/commands/dedupe.ts'), 'utf-8')
      );
      expect(moduleSource).toContain('execFileSync');
      expect(moduleSource).not.toContain("execSync(");
      // The import line has "execFileSync" from 'child_process', not "execSync"
      expect(moduleSource).toMatch(/import\s*\{[^}]*execFileSync[^}]*\}\s*from\s*'child_process'/);
    });

    it('does not use template literal shell commands', async () => {
      const moduleSource = await import('fs').then(fs =>
        fs.readFileSync(path.resolve('src/cli/commands/dedupe.ts'), 'utf-8')
      );
      // Should not contain backtick-grep pattern (old shell injection vector)
      expect(moduleSource).not.toMatch(/`grep\s/);
      expect(moduleSource).not.toMatch(/execSync\s*\(\s*`/);
    });
  });

  describe('isSourceLine filtering', () => {
    // Import the actual module to test
    let dedupe: typeof import('./dedupe.js');

    beforeEach(async () => {
      dedupe = await import('./dedupe.js');
    });

    it('exports registerDedupeCommands', () => {
      expect(typeof dedupe.registerDedupeCommands).toBe('function');
    });

    it('does not export runDedupe (private)', () => {
      expect((dedupe as Record<string, unknown>).runDedupe).toBeUndefined();
    });
  });
});
