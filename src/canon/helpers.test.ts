import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  isValidSkillDir,
  scanDirForSkills,
  deduplicateSkills,
  determineSkillStatus,
  generateLineDiff,
  getInstalledSkills,
  getInstalledSkillDirs,
} from './helpers.js';
import type { CanonListItem } from './types.js';

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(tmpdir(), 'canon-helpers-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function createSkillDir(name: string, parentDir?: string): string {
  const dir = path.join(parentDir ?? tempDir, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `# ${name}\nTest skill content.`);
  return dir;
}

describe('isValidSkillDir', () => {
  it('returns true when SKILL.md exists', () => {
    const dir = createSkillDir('clarity');
    expect(isValidSkillDir(dir)).toBe(true);
  });

  it('returns false when SKILL.md missing', () => {
    const dir = path.join(tempDir, 'empty');
    fs.mkdirSync(dir, { recursive: true });
    expect(isValidSkillDir(dir)).toBe(false);
  });

  it('returns false for nonexistent directory', () => {
    expect(isValidSkillDir('/nonexistent/path')).toBe(false);
  });
});

describe('scanDirForSkills', () => {
  it('finds skill directories', () => {
    createSkillDir('clarity');
    createSkillDir('correctness');
    const skills = new Map<string, CanonListItem>();
    scanDirForSkills(tempDir, 'test', skills);
    expect(skills.size).toBe(2);
    expect(skills.has('clarity')).toBe(true);
    expect(skills.has('correctness')).toBe(true);
  });

  it('skips directories without SKILL.md', () => {
    createSkillDir('valid-skill');
    fs.mkdirSync(path.join(tempDir, 'no-skill'), { recursive: true });
    const skills = new Map<string, CanonListItem>();
    scanDirForSkills(tempDir, 'test', skills);
    expect(skills.size).toBe(1);
    expect(skills.has('valid-skill')).toBe(true);
  });

  it('skips hidden directories', () => {
    createSkillDir('.hidden');
    createSkillDir('visible');
    const skills = new Map<string, CanonListItem>();
    scanDirForSkills(tempDir, 'test', skills);
    expect(skills.size).toBe(1);
    expect(skills.has('visible')).toBe(true);
  });

  it('first-wins: does not overwrite existing entries', () => {
    const firstPath = path.join(tempDir, 'first');
    const secondPath = path.join(tempDir, 'second');
    fs.mkdirSync(firstPath, { recursive: true });
    fs.mkdirSync(secondPath, { recursive: true });

    createSkillDir('overlap', firstPath);
    createSkillDir('overlap', secondPath);

    const skills = new Map<string, CanonListItem>();
    scanDirForSkills(firstPath, 'a', skills);
    scanDirForSkills(secondPath, 'b', skills);
    expect(skills.get('overlap')!.category).toBe('a');
  });

  it('handles nonexistent directory', () => {
    const skills = new Map<string, CanonListItem>();
    scanDirForSkills('/nonexistent/dir', 'test', skills);
    expect(skills.size).toBe(0);
  });

  it('sets category to root when empty string', () => {
    createSkillDir('my-skill');
    const skills = new Map<string, CanonListItem>();
    scanDirForSkills(tempDir, '', skills);
    expect(skills.get('my-skill')!.category).toBe('root');
  });
});

describe('deduplicateSkills', () => {
  it('removes duplicate skill names', () => {
    const canonPath = '/canon';
    const skills: CanonListItem[] = [
      { name: 'clarity', path: '/a/clarity', category: 'a' },
      { name: 'clarity', path: '/b/clarity', category: 'b' },
    ];
    const result = deduplicateSkills(skills, canonPath);
    expect(result).toHaveLength(1);
  });

  it('prefers canon source path over non-canon', () => {
    const canonPath = '/canon';
    const skills: CanonListItem[] = [
      { name: 'clarity', path: '/other/clarity', category: 'other' },
      { name: 'clarity', path: '/canon/clarity', category: 'canon' },
    ];
    const result = deduplicateSkills(skills, canonPath);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/canon/clarity');
  });

  it('keeps first seen when both from non-canon paths', () => {
    const skills: CanonListItem[] = [
      { name: 'clarity', path: '/a/clarity', category: 'a' },
      { name: 'clarity', path: '/b/clarity', category: 'b' },
    ];
    const result = deduplicateSkills(skills, '/canon');
    expect(result[0].path).toBe('/a/clarity');
  });

  it('preserves distinct skills', () => {
    const skills: CanonListItem[] = [
      { name: 'clarity', path: '/a/clarity', category: 'a' },
      { name: 'correctness', path: '/a/correctness', category: 'a' },
    ];
    const result = deduplicateSkills(skills, '/canon');
    expect(result).toHaveLength(2);
  });
});

describe('determineSkillStatus', () => {
  it('returns missing when source path is null', () => {
    const result = determineSkillStatus('/installed', null, undefined);
    expect(result.status).toBe('missing');
  });

  it('returns current when hashes match with manifest', () => {
    const skillDir = createSkillDir('test-skill');
    const result = determineSkillStatus(skillDir, skillDir, undefined);
    expect(result.status).toBe('current');
  });

  it('returns current when installed and source identical', () => {
    const dir1 = createSkillDir('skill-a');
    // Copy to create identical skill
    const dir2 = path.join(tempDir, 'skill-b');
    fs.mkdirSync(dir2, { recursive: true });
    fs.copyFileSync(path.join(dir1, 'SKILL.md'), path.join(dir2, 'SKILL.md'));

    const result = determineSkillStatus(dir1, dir2, undefined);
    expect(result.status).toBe('current');
  });

  it('returns outdated when installed differs from source (no manifest)', () => {
    const dir1 = createSkillDir('skill-a');
    const dir2 = path.join(tempDir, 'skill-b');
    fs.mkdirSync(dir2, { recursive: true });
    fs.writeFileSync(path.join(dir2, 'SKILL.md'), 'different content');

    const result = determineSkillStatus(dir1, dir2, undefined);
    expect(result.status).toBe('outdated');
  });
});

describe('generateLineDiff', () => {
  it('returns empty for identical content', () => {
    const diff = generateLineDiff('line1\nline2', 'line1\nline2');
    expect(diff).toHaveLength(0);
  });

  it('shows changed lines', () => {
    const diff = generateLineDiff('old line', 'new line');
    expect(diff.some(d => d.startsWith('- '))).toBe(true);
    expect(diff.some(d => d.startsWith('+ '))).toBe(true);
  });

  it('shows added lines', () => {
    const diff = generateLineDiff('line1', 'line1\nline2');
    expect(diff.some(d => d.startsWith('+ '))).toBe(true);
  });

  it('shows removed lines', () => {
    const diff = generateLineDiff('line1\nline2', 'line1');
    expect(diff.some(d => d.startsWith('- '))).toBe(true);
  });

  it('truncates long lines to 80 chars', () => {
    const longLine = 'x'.repeat(200);
    const diff = generateLineDiff(longLine, 'short');
    for (const d of diff) {
      // prefix + line number + ": " + content (80 chars max)
      expect(d.length).toBeLessThanOrEqual(100);
    }
  });
});

describe('getInstalledSkills', () => {
  it('returns empty array when no .claude/skills dir', () => {
    expect(getInstalledSkills(tempDir)).toEqual([]);
  });

  it('lists installed skill directories sorted', () => {
    const skillsDir = path.join(tempDir, '.claude', 'skills');
    createSkillDir('clarity', skillsDir);
    createSkillDir('algorithms', skillsDir);
    createSkillDir('typescript', skillsDir);

    const result = getInstalledSkills(tempDir);
    expect(result).toEqual(['algorithms', 'clarity', 'typescript']);
  });

  it('excludes hidden directories', () => {
    const skillsDir = path.join(tempDir, '.claude', 'skills');
    createSkillDir('clarity', skillsDir);
    createSkillDir('.hidden', skillsDir);

    const result = getInstalledSkills(tempDir);
    expect(result).toEqual(['clarity']);
  });
});

describe('getInstalledSkillDirs', () => {
  it('returns empty for nonexistent directory', () => {
    expect(getInstalledSkillDirs('/nonexistent')).toEqual([]);
  });

  it('lists directories, excludes hidden and files', () => {
    createSkillDir('clarity');
    createSkillDir('.hidden');
    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'not a dir');

    const result = getInstalledSkillDirs(tempDir);
    expect(result).toContain('clarity');
    expect(result).not.toContain('.hidden');
    expect(result).not.toContain('file.txt');
  });
});
