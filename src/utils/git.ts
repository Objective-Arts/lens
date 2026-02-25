import * as fs from 'fs';
import * as path from 'path';
import { isEnoent } from './fs.js';

/** Reads .git/HEAD directly instead of spawning `git rev-parse`. */
export function getGitCommit(repoPath: string): string | undefined {
  try {
    const headContent = fs.readFileSync(path.join(repoPath, '.git', 'HEAD'), 'utf-8').trim();

    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.slice(5);
      return fs.readFileSync(path.join(repoPath, '.git', refPath), 'utf-8').trim().slice(0, 7);
    }
    return headContent.slice(0, 7);
  } catch (cause) {
    if (!isEnoent(cause) && cause instanceof Error) {
      // Non-ENOENT errors (permission denied, etc.) are unexpected — surface them in debug
      if (process.env['DEBUG']) console.debug('getGitCommit failed:', cause.message);
    }
    return undefined;
  }
}

export function getGitRemote(repoPath: string): string | undefined {
  const configPath = path.join(repoPath, '.git', 'config');

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);
    return match ? match[1].trim() : undefined;
  } catch (cause) {
    if (!isEnoent(cause) && cause instanceof Error) {
      if (process.env['DEBUG']) console.debug('getGitRemote failed:', cause.message);
    }
    return undefined;
  }
}
