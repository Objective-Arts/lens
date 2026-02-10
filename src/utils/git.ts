import * as fs from 'fs';
import * as path from 'path';

/** Reads .git/HEAD directly instead of spawning `git rev-parse`. */
export function getGitCommit(repoPath: string): string | undefined {
  try {
    const headContent = fs.readFileSync(path.join(repoPath, '.git', 'HEAD'), 'utf-8').trim();

    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.slice(5);
      return fs.readFileSync(path.join(repoPath, '.git', refPath), 'utf-8').trim().slice(0, 7);
    }
    return headContent.slice(0, 7);
  } catch {
    return undefined;
  }
}

export function getGitRemote(repoPath: string): string | undefined {
  const configPath = path.join(repoPath, '.git', 'config');

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}
