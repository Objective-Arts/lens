import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

/** Maximum file size (in bytes) to read fully into memory for hashing. Files larger than this are skipped. */
const MAX_HASH_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const HASH_PREFIX_LEN = 16;

export function hashFileContents(filePath: string): string {
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_HASH_FILE_SIZE) {
    return createHash('sha256').update(`skipped:${stat.size}`).digest('hex').slice(0, HASH_PREFIX_LEN);
  }
  const content = fs.readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex').slice(0, HASH_PREFIX_LEN);
}

export function hashDirectoryContents(dirPath: string): string {
  const hash = createHash('sha256');

  function processDir(dir: string): void {
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
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_HASH_FILE_SIZE) {
          hash.update(`file:${relativePath}:skipped:${stat.size}\n`);
          continue;
        }
        const content = fs.readFileSync(fullPath);
        hash.update(`file:${relativePath}:${content.length}\n`);
        hash.update(content);
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    processDir(dirPath);
  }

  return hash.digest('hex').slice(0, HASH_PREFIX_LEN);
}
