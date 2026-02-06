import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getGitCommit, getGitRemote } from './git.js';

describe('getGitCommit', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns undefined for non-git directory', () => {
    expect(getGitCommit(tmpDir)).toBeUndefined();
  });

  it('reads direct SHA from HEAD (detached head)', () => {
    const gitDir = path.join(tmpDir, '.git');
    fs.mkdirSync(gitDir);
    fs.writeFileSync(path.join(gitDir, 'HEAD'), 'abc1234567890def\n');

    const result = getGitCommit(tmpDir);
    expect(result).toBe('abc1234');
  });

  it('follows symbolic ref to get commit', () => {
    const gitDir = path.join(tmpDir, '.git');
    const refsDir = path.join(gitDir, 'refs', 'heads');
    fs.mkdirSync(refsDir, { recursive: true });
    fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main\n');
    fs.writeFileSync(path.join(refsDir, 'main'), 'deadbeef12345678\n');

    const result = getGitCommit(tmpDir);
    expect(result).toBe('deadbee');
  });

  it('returns undefined when ref file is missing', () => {
    const gitDir = path.join(tmpDir, '.git');
    fs.mkdirSync(gitDir);
    fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/nonexistent\n');

    expect(getGitCommit(tmpDir)).toBeUndefined();
  });
});

describe('getGitRemote', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns undefined for non-git directory', () => {
    expect(getGitRemote(tmpDir)).toBeUndefined();
  });

  it('extracts origin URL from git config', () => {
    const gitDir = path.join(tmpDir, '.git');
    fs.mkdirSync(gitDir);
    fs.writeFileSync(path.join(gitDir, 'config'), `[core]
\trepositoryformatversion = 0
[remote "origin"]
\turl = https://github.com/user/repo.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
`);

    expect(getGitRemote(tmpDir)).toBe('https://github.com/user/repo.git');
  });

  it('returns undefined when no origin remote', () => {
    const gitDir = path.join(tmpDir, '.git');
    fs.mkdirSync(gitDir);
    fs.writeFileSync(path.join(gitDir, 'config'), `[core]
\trepositoryformatversion = 0
`);

    expect(getGitRemote(tmpDir)).toBeUndefined();
  });
});
