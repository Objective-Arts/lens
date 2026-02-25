/**
 * Tests for fs utility functions:
 * isEnoent, copyDirectorySync, copyDirectoryAsync
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { isEnoent, copyDirectorySync, copyDirectoryAsync } from './fs.js';

// ---------------------------------------------------------------------------
// isEnoent
// ---------------------------------------------------------------------------

describe('isEnoent', () => {
  it('returns true for ENOENT filesystem error', () => {
    let caught: unknown;
    try {
      fs.readFileSync('/nonexistent/file/that/does/not/exist/abc123');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    expect(isEnoent(caught)).toBe(true);
  });

  it('returns false for non-ENOENT Error', () => {
    const err = new Error('Some other error');
    expect(isEnoent(err)).toBe(false);
  });

  it('returns false for an error with different code', () => {
    const err = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    expect(isEnoent(err)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEnoent(null)).toBe(false);
  });

  it('returns false for plain string', () => {
    expect(isEnoent('ENOENT')).toBe(false);
  });

  it('returns false for an object without Error prototype', () => {
    const obj = { code: 'ENOENT', message: 'no entry' };
    expect(isEnoent(obj)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// copyDirectorySync
// ---------------------------------------------------------------------------

describe('copyDirectorySync', () => {
  let tmpDir: string;

  beforeEach(() => {
    // Use realpathSync to resolve macOS /var -> /private/var symlink so that
    // path.resolve() and fs.realpathSync() agree inside copyDirectorySync.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'lens-fs-sync-')));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies a flat directory with files', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'hello.txt'), 'hello world');
    fs.writeFileSync(path.join(src, 'config.json'), '{"key":"val"}');

    copyDirectorySync(src, dest);

    expect(fs.readFileSync(path.join(dest, 'hello.txt'), 'utf-8')).toBe('hello world');
    expect(fs.readFileSync(path.join(dest, 'config.json'), 'utf-8')).toBe('{"key":"val"}');
  });

  it('copies nested directories recursively', () => {
    const src = path.join(tmpDir, 'src');
    const sub = path.join(src, 'subdir', 'nested');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'deep.txt'), 'deep file');

    const dest = path.join(tmpDir, 'dest');
    copyDirectorySync(src, dest);

    expect(fs.readFileSync(path.join(dest, 'subdir', 'nested', 'deep.txt'), 'utf-8')).toBe('deep file');
  });

  it('creates the destination directory if it does not exist', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'new', 'nested', 'dest');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'a.txt'), 'content');

    copyDirectorySync(src, dest);

    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(path.join(dest, 'a.txt'), 'utf-8')).toBe('content');
  });

  it('copies safe symlinks that point inside the source tree', () => {
    const src = path.join(tmpDir, 'src');
    const subDir = path.join(src, 'real');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'file.txt'), 'linked content');

    // Symlink inside the src tree pointing to a subdirectory
    const linkPath = path.join(src, 'link');
    fs.symlinkSync(subDir, linkPath);

    const dest = path.join(tmpDir, 'dest');
    copyDirectorySync(src, dest);

    // The linked directory should be copied as a real directory
    expect(fs.readFileSync(path.join(dest, 'link', 'file.txt'), 'utf-8')).toBe('linked content');
  });

  it('skips symlinks that escape the source tree', () => {
    const src = path.join(tmpDir, 'src');
    fs.mkdirSync(src);
    const externalDir = path.join(tmpDir, 'external');
    fs.mkdirSync(externalDir);
    fs.writeFileSync(path.join(externalDir, 'secret.txt'), 'secret');

    // Symlink points outside src
    fs.symlinkSync(externalDir, path.join(src, 'escape'));

    const dest = path.join(tmpDir, 'dest');
    copyDirectorySync(src, dest);

    // The escaping symlink should not be copied
    expect(fs.existsSync(path.join(dest, 'escape'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// copyDirectoryAsync
// ---------------------------------------------------------------------------

describe('copyDirectoryAsync', () => {
  let tmpDir: string;

  beforeEach(() => {
    // Use realpathSync to resolve macOS /var -> /private/var symlink.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'lens-fs-async-')));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies files from source to destination', async () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'file.txt'), 'async content');

    await copyDirectoryAsync(src, dest);

    expect(fs.readFileSync(path.join(dest, 'file.txt'), 'utf-8')).toBe('async content');
  });

  it('copies nested directories recursively', async () => {
    const src = path.join(tmpDir, 'src');
    const nested = path.join(src, 'a', 'b');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'deep.txt'), 'deep async');

    const dest = path.join(tmpDir, 'dest');
    await copyDirectoryAsync(src, dest);

    expect(fs.readFileSync(path.join(dest, 'a', 'b', 'deep.txt'), 'utf-8')).toBe('deep async');
  });

  it('skips symlinks pointing outside the source tree', async () => {
    const src = path.join(tmpDir, 'src');
    fs.mkdirSync(src);
    const external = path.join(tmpDir, 'external');
    fs.mkdirSync(external);
    fs.writeFileSync(path.join(external, 'outside.txt'), 'outside');

    fs.symlinkSync(external, path.join(src, 'evil-link'));

    const dest = path.join(tmpDir, 'dest');
    await copyDirectoryAsync(src, dest);

    expect(fs.existsSync(path.join(dest, 'evil-link'))).toBe(false);
  });

  it('copies safe symlinks that point inside the source tree', async () => {
    const src = path.join(tmpDir, 'src');
    const innerDir = path.join(src, 'inner');
    fs.mkdirSync(innerDir, { recursive: true });
    fs.writeFileSync(path.join(innerDir, 'content.txt'), 'inner content');

    fs.symlinkSync(innerDir, path.join(src, 'safe-link'));

    const dest = path.join(tmpDir, 'dest');
    await copyDirectoryAsync(src, dest);

    expect(fs.readFileSync(path.join(dest, 'safe-link', 'content.txt'), 'utf-8')).toBe('inner content');
  });
});
