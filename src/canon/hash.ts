/**
 * SHA256 hashing utilities for skill change detection
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Hash a single file's contents
 */
function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Hash all files in a skill directory recursively
 * Returns a combined hash representing the entire skill
 */
export function hashSkillDirectory(skillPath: string): string {
  const hashes: string[] = [];

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Sort for consistent ordering
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip hidden files and common non-content files
      if (entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        // Include relative path in hash for structural changes
        const relativePath = path.relative(skillPath, fullPath);
        const fileHash = hashFile(fullPath);
        hashes.push(`${relativePath}:${fileHash}`);
      }
    }
  }

  walkDir(skillPath);

  // Combine all file hashes into one
  const combinedContent = hashes.join('\n');
  return crypto.createHash('sha256').update(combinedContent).digest('hex');
}


