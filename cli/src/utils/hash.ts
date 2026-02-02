/**
 * Shared hashing utilities.
 *
 * Directory content hashing for change detection.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

/**
 * Hash a directory's contents including structure.
 * Includes directory markers and file contents in the hash.
 * Returns truncated 16-char hash.
 */
export function hashDirectoryContents(dirPath: string): string {
  const hash = createHash('sha256');

  function processDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      if (entry.isDirectory()) {
        hash.update(`dir:${relativePath}\n`);
        processDir(fullPath);
      } else {
        const content = fs.readFileSync(fullPath);
        hash.update(`file:${relativePath}:${content.length}\n`);
        hash.update(content);
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    processDir(dirPath);
  }

  return hash.digest('hex').slice(0, 16);
}
