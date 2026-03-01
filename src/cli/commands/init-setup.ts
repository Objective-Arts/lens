// Project structure setup helpers for the init command.

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { PATHS } from '../../paths.js';
import type { InitResult } from './init-display.js';

async function symlinkOrCopyDir(
  projectPath: string,
  dirName: string,
  sourceDir: string,
  initResult: InitResult,
  force: boolean
): Promise<void> {
  const targetPath = path.join(projectPath, dirName);

  let lstat;
  try { lstat = await fsPromises.lstat(targetPath); } catch { lstat = null; }

  if (lstat?.isSymbolicLink()) {
    try {
      if (fs.realpathSync(targetPath) === fs.realpathSync(sourceDir)) {
        initResult.skipped.push(`${dirName} (symlink already correct)`);
        return;
      }
    } catch { /* broken symlink */ }
    await fsPromises.unlink(targetPath);
  } else if (lstat) {
    if (!force) {
      initResult.skipped.push(`${dirName} (directory exists; use --force to replace)`);
      return;
    }
    await fsPromises.rm(targetPath, { recursive: true });
  }

  const absoluteSource = fs.realpathSync(sourceDir);
  await fsPromises.symlink(absoluteSource, targetPath);
  initResult.created.push(`${dirName} -> package`);
}

export async function setupProjectStructure(
  projectPath: string,
  initResult: InitResult,
  force: boolean
): Promise<void> {
  if (fs.existsSync(PATHS.rubrics)) {
    await symlinkOrCopyDir(projectPath, '.claude/rubric', PATHS.rubrics, initResult, force);
  }
}

