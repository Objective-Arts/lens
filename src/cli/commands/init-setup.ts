// Project structure setup helpers for the init command.

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { PATHS } from '../../paths.js';
import { copyDirectorySync } from '../../utils/fs.js';
import type { InitResult } from './init-display.js';

async function copyRubrics(projectPath: string, initResult: InitResult, force: boolean): Promise<void> {
  if (!fs.existsSync(PATHS.rubrics)) return;

  const rubricTarget = path.join(projectPath, '.claude', 'rubric');
  let lstat;
  try { lstat = await fsPromises.lstat(rubricTarget); } catch { lstat = null; }

  if (lstat?.isSymbolicLink()) {
    await fsPromises.unlink(rubricTarget);
  } else if (lstat && !force) {
    initResult.skipped.push('.claude/rubric (exists; use --force to replace)');
    return;
  } else if (lstat) {
    await fsPromises.rm(rubricTarget, { recursive: true });
  }

  copyDirectorySync(PATHS.rubrics, rubricTarget);
  initResult.created.push('.claude/rubric');
}

async function copyQualityGate(projectPath: string, initResult: InitResult, force: boolean): Promise<void> {
  const gateSource = path.join(PATHS.root, 'scripts', 'quality-gate.ts');
  if (!fs.existsSync(gateSource)) return;

  const gateTarget = path.join(projectPath, '.claude', 'scripts', 'quality-gate.ts');
  let exists = false;
  try { await fsPromises.access(gateTarget); exists = true; } catch { /* doesn't exist */ }

  if (exists && !force) {
    initResult.skipped.push('.claude/scripts/quality-gate.ts (exists; use --force to replace)');
    return;
  }

  fs.mkdirSync(path.dirname(gateTarget), { recursive: true });
  fs.copyFileSync(gateSource, gateTarget);
  initResult.created.push('.claude/scripts/quality-gate.ts');
}

export async function setupProjectStructure(
  projectPath: string,
  initResult: InitResult,
  force: boolean
): Promise<void> {
  await copyRubrics(projectPath, initResult, force);
  await copyQualityGate(projectPath, initResult, force);
}
