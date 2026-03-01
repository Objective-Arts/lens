import * as fs from 'fs';
import * as path from 'path';
import type { WorkflowManifest, WorkflowSkillInfo, WorkflowStatusInfo } from './types.js';
import { copyDirectorySync } from '../utils/fs.js';
import { hashDirectoryContents, hashFileContents } from '../utils/hash.js';

export function lstatTarget(targetPath: string): { exists: boolean; isSymlink: boolean } {
  try {
    const lstat = fs.lstatSync(targetPath);
    return { exists: true, isSymlink: lstat.isSymbolicLink() };
  } catch {
    return { exists: false, isSymlink: false };
  }
}

export function removeTarget(targetPath: string, isSymlink: boolean, expectedRoot: string): void {
  const resolved = path.resolve(targetPath);
  const rootPrefix = path.resolve(expectedRoot) + path.sep;
  if (!resolved.startsWith(rootPrefix)) {
    throw new Error(`Path escapes expected root: ${resolved} is not inside ${rootPrefix}`);
  }

  try {
    if (isSymlink) {
      fs.unlinkSync(targetPath);
    } else {
      fs.rmSync(targetPath, { recursive: true });
    }
  } catch (cause) {
    throw new Error(`Failed to remove ${targetPath}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
  }
}

export function checkAlreadyInstalled(
  targetPath: string,
  skillSourcePath: string,
  skillName: string
): { success: false; message: string } | null {
  const sameContent = hashDirectoryContents(targetPath) === hashDirectoryContents(skillSourcePath);
  return sameContent
    ? { success: false, message: `Skill already installed: ${skillName}. Use --force to overwrite.` }
    : null;
}

export function copyRubricFiles(projectPath: string, sourcePath: string): void {
  const rubricSource = path.join(sourcePath, 'rubric');
  if (!fs.existsSync(rubricSource)) return;
  const rubricTarget = path.join(projectPath, '.claude', 'rubric');

  if (fs.existsSync(rubricTarget) || lstatSafe(rubricTarget)) {
    const resolvedTarget = path.resolve(rubricTarget);
    const rootPrefix = path.resolve(projectPath) + path.sep;
    if (!resolvedTarget.startsWith(rootPrefix)) {
      throw new Error(`Rubric target escapes project root: ${resolvedTarget} is not inside ${rootPrefix}`);
    }

    try {
      const stat = fs.lstatSync(rubricTarget);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(rubricTarget);
      } else {
        fs.rmSync(rubricTarget, { recursive: true });
      }
    } catch {
      // Target doesn't exist after all — continue to copy
    }
  }

  copyDirectorySync(rubricSource, rubricTarget);
}

function lstatSafe(p: string): boolean {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

export function copyQualityGateScript(projectPath: string, sourcePath: string, manifest: WorkflowManifest, saveManifest: (m: WorkflowManifest) => void): void {
  const gateSource = path.join(path.dirname(sourcePath), 'scripts', 'quality-gate.ts');
  if (!fs.existsSync(gateSource)) return;
  const gateTarget = path.join(projectPath, '.claude', 'scripts', 'quality-gate.ts');
  fs.mkdirSync(path.dirname(gateTarget), { recursive: true });
  fs.copyFileSync(gateSource, gateTarget);
  manifest.scriptHash = hashFileContents(gateSource);
  saveManifest(manifest);
}

export function upgradeQualityGateScript(
  projectPath: string,
  sourcePath: string,
  manifest: WorkflowManifest,
  saveManifest: (m: WorkflowManifest) => void,
  upgraded: string[]
): void {
  const gateSource = path.join(path.dirname(sourcePath), 'scripts', 'quality-gate.ts');
  if (!fs.existsSync(gateSource)) return;
  const sourceHash = hashFileContents(gateSource);
  if (manifest.scriptHash === sourceHash) return;
  const gateTarget = path.join(projectPath, '.claude', 'scripts', 'quality-gate.ts');
  fs.mkdirSync(path.dirname(gateTarget), { recursive: true });
  fs.copyFileSync(gateSource, gateTarget);
  manifest.scriptHash = sourceHash;
  saveManifest(manifest);
  upgraded.push('quality-gate.ts (script)');
}

export function upgradeRubricFiles(projectPath: string, sourcePath: string, upgraded: string[]): void {
  const rubricSource = path.join(sourcePath, 'rubric');
  if (!fs.existsSync(rubricSource)) return;
  copyRubricFiles(projectPath, sourcePath);
  upgraded.push('rubric/ (criteria files)');
}

export function installOneSkill(
  skill: WorkflowSkillInfo,
  projectPath: string,
  skillsDir: string,
  options: { force?: boolean },
  userFacingSkills: Set<string>,
  installFn: (name: string, projectPath: string, opts: { force?: boolean; targetDir?: string }) => { success: boolean; message: string },
  results: { installed: string[]; skipped: string[]; errors: string[] }
): void {
  if (!userFacingSkills.has(skill.name)) {
    results.skipped.push(`${skill.name}: internal (referenced from workflow-skills/)`);
    return;
  }
  const result = installFn(skill.name, projectPath, { ...options, targetDir: skillsDir });
  if (result.success) {
    results.installed.push(skill.name);
  } else if (!options.force && fs.existsSync(path.join(skillsDir, skill.name))) {
    results.skipped.push(`${skill.name}: already installed`);
  } else {
    results.errors.push(`${skill.name}: ${result.message}`);
  }
}

type InstallFn = (name: string, projectPath: string, opts: { force?: boolean; targetDir?: string }) => { success: boolean; message: string };

function skipReason(
  status: WorkflowStatusInfo & { name: string },
  force: boolean,
  userFacingSkills: Set<string>
): string | null {
  if (status.status === 'current') return `${status.name}: already current`;
  if (status.status === 'modified' && !force) return `${status.name}: locally modified (use --force to overwrite)`;
  if (status.status === 'missing' || status.status === 'unknown') return `${status.name}: ${status.status}`;
  if (!userFacingSkills.has(status.name)) return `${status.name}: internal (referenced from workflow-skills/)`;
  return null;
}

export function upgradeOneSkill(
  status: WorkflowStatusInfo & { name: string },
  projectPath: string,
  force: boolean,
  userFacingSkills: Set<string>,
  installFn: InstallFn,
  results: { upgraded: string[]; skipped: string[]; errors: string[] }
): void {
  const reason = skipReason(status, force, userFacingSkills);
  if (reason) { results.skipped.push(reason); return; }

  const targetDir = path.join(projectPath, '.claude', 'skills');
  const result = installFn(status.name, projectPath, { force: true, targetDir });
  if (result.success) {
    results.upgraded.push(status.name);
  } else {
    results.errors.push(`${status.name}: ${result.message}`);
  }
}
