import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

export function hashFileContents(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
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
