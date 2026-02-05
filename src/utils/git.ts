/**
 * Shared git utilities.
 *
 * Read git repository information without spawning processes.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Get the short commit hash from a git repository.
 * Reads .git/HEAD directly instead of spawning `git rev-parse`.
 */
export function getGitCommit(repoPath: string): string | undefined {
  const gitHeadPath = path.join(repoPath, '.git', 'HEAD');

  if (!fs.existsSync(gitHeadPath)) {
    return undefined;
  }

  try {
    const headContent = fs.readFileSync(gitHeadPath, 'utf-8').trim();

    // Check if it's a direct ref or a symbolic ref
    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.slice(5);
      const refFilePath = path.join(repoPath, '.git', refPath);
      if (fs.existsSync(refFilePath)) {
        return fs.readFileSync(refFilePath, 'utf-8').trim().slice(0, 7);
      }
    } else {
      return headContent.slice(0, 7);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Get the git remote URL from a repository.
 * Reads .git/config directly instead of spawning `git remote`.
 */
export function getGitRemote(repoPath: string): string | undefined {
  const configPath = path.join(repoPath, '.git', 'config');

  if (!fs.existsSync(configPath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}
