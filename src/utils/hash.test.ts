/**
 * Tests for hash utility functions:
 * hashFileContents, hashDirectoryContents
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { hashFileContents, hashDirectoryContents } from './hash.js';

describe('hashFileContents', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-hash-file-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns a non-empty hash string for a file', () => {
    const file = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(file, 'hello world');

    const hash = hashFileContents(file);

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('returns the same hash for identical content', () => {
    const file1 = path.join(tmpDir, 'a.txt');
    const file2 = path.join(tmpDir, 'b.txt');
    const content = 'identical content for hashing';
    fs.writeFileSync(file1, content);
    fs.writeFileSync(file2, content);

    expect(hashFileContents(file1)).toBe(hashFileContents(file2));
  });

  it('returns different hashes for different content', () => {
    const file1 = path.join(tmpDir, 'a.txt');
    const file2 = path.join(tmpDir, 'b.txt');
    fs.writeFileSync(file1, 'content alpha');
    fs.writeFileSync(file2, 'content beta');

    expect(hashFileContents(file1)).not.toBe(hashFileContents(file2));
  });

  it('returns a 16-character hex string (truncated prefix)', () => {
    const file = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(file, 'some data');

    const hash = hashFileContents(file);

    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('handles empty files', () => {
    const file = path.join(tmpDir, 'empty.txt');
    fs.writeFileSync(file, '');

    const hash = hashFileContents(file);

    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('hashDirectoryContents', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-hash-dir-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns a 16-character hex string for a directory', () => {
    const dir = path.join(tmpDir, 'mydir');
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'file.txt'), 'data');

    const hash = hashDirectoryContents(dir);

    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns the same hash for two directories with identical contents', () => {
    const dir1 = path.join(tmpDir, 'dir1');
    const dir2 = path.join(tmpDir, 'dir2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);
    const content = '# Same content\nline two\n';
    fs.writeFileSync(path.join(dir1, 'file.md'), content);
    fs.writeFileSync(path.join(dir2, 'file.md'), content);

    expect(hashDirectoryContents(dir1)).toBe(hashDirectoryContents(dir2));
  });

  it('returns different hashes when file content differs', () => {
    const dir1 = path.join(tmpDir, 'dir1');
    const dir2 = path.join(tmpDir, 'dir2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);
    fs.writeFileSync(path.join(dir1, 'file.txt'), 'version A');
    fs.writeFileSync(path.join(dir2, 'file.txt'), 'version B');

    expect(hashDirectoryContents(dir1)).not.toBe(hashDirectoryContents(dir2));
  });

  it('returns different hashes when files have different names', () => {
    const dir1 = path.join(tmpDir, 'dir1');
    const dir2 = path.join(tmpDir, 'dir2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);
    const content = 'same content';
    fs.writeFileSync(path.join(dir1, 'alpha.txt'), content);
    fs.writeFileSync(path.join(dir2, 'beta.txt'), content);

    expect(hashDirectoryContents(dir1)).not.toBe(hashDirectoryContents(dir2));
  });

  it('handles non-existent directory without throwing (returns consistent hash)', () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist');

    // Should not throw — returns hash of empty input
    expect(() => hashDirectoryContents(nonExistent)).not.toThrow();
    const hash = hashDirectoryContents(nonExistent);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('includes nested directory contents in the hash', () => {
    const dir1 = path.join(tmpDir, 'dir1');
    const dir2 = path.join(tmpDir, 'dir2');
    fs.mkdirSync(path.join(dir1, 'sub'), { recursive: true });
    fs.mkdirSync(path.join(dir2, 'sub'), { recursive: true });

    fs.writeFileSync(path.join(dir1, 'sub', 'nested.txt'), 'nested content A');
    fs.writeFileSync(path.join(dir2, 'sub', 'nested.txt'), 'nested content B');

    expect(hashDirectoryContents(dir1)).not.toBe(hashDirectoryContents(dir2));
  });

  it('produces deterministic hash regardless of insertion order', () => {
    // Write files in different orders and verify hash is same for same content
    const dir1 = path.join(tmpDir, 'dir1');
    const dir2 = path.join(tmpDir, 'dir2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);

    // Write in alphabetical order
    fs.writeFileSync(path.join(dir1, 'aaa.txt'), 'aaa content');
    fs.writeFileSync(path.join(dir1, 'zzz.txt'), 'zzz content');

    // Write in reverse order — hash should be same since it sorts by name
    fs.writeFileSync(path.join(dir2, 'zzz.txt'), 'zzz content');
    fs.writeFileSync(path.join(dir2, 'aaa.txt'), 'aaa content');

    expect(hashDirectoryContents(dir1)).toBe(hashDirectoryContents(dir2));
  });
});
