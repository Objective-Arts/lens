import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

/** Type guard: true only for ENOENT (file/dir not found) */
export function isEnoent(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

const MAX_CONFIG_SIZE = 1024 * 1024; // 1 MB

/** Read a file with a size cap. Throws if file exceeds maxBytes. */
export function safeReadFileSync(filePath: string, maxBytes: number = MAX_CONFIG_SIZE): string {
  const stat = fs.statSync(filePath);
  if (stat.size > maxBytes) {
    throw new Error(`File exceeds size limit (${stat.size} > ${maxBytes} bytes): ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export function copyDirectorySync(src: string, dest: string): void {
  const resolvedRoot = path.resolve(src);

  function copyRecursive(srcDir: string, destDir: string): void {
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isSymbolicLink()) {
        const realPath = fs.realpathSync(srcPath);
        if (!realPath.startsWith(resolvedRoot + path.sep) && realPath !== resolvedRoot) {
          continue; // Skip symlinks that escape the source tree
        }
        // Safe symlink — copy the target content
        const targetStat = fs.statSync(realPath);
        if (targetStat.isDirectory()) {
          copyRecursive(realPath, destPath);
        } else {
          fs.copyFileSync(realPath, destPath);
        }
      } else if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(src, dest);
}

export async function copyDirectoryAsync(src: string, dest: string): Promise<void> {
  const resolvedRoot = path.resolve(src);

  async function copyRecursive(srcDir: string, destDir: string): Promise<void> {
    await fsPromises.mkdir(destDir, { recursive: true });
    const entries = await fsPromises.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isSymbolicLink()) {
        const realPath = await fsPromises.realpath(srcPath);
        if (!realPath.startsWith(resolvedRoot + path.sep) && realPath !== resolvedRoot) {
          continue; // Skip symlinks that escape the source tree
        }
        const targetStat = await fsPromises.stat(realPath);
        if (targetStat.isDirectory()) {
          await copyRecursive(realPath, destPath);
        } else {
          await fsPromises.copyFile(realPath, destPath);
        }
      } else if (entry.isDirectory()) {
        await copyRecursive(srcPath, destPath);
      } else {
        await fsPromises.copyFile(srcPath, destPath);
      }
    }
  }

  await copyRecursive(src, dest);
}
