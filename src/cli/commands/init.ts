// Init command -- set up Claude Code integration in a project.

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { PATHS } from '../../paths.js';
import {
  buildLensSection, printResults,
  LENS_MARKER_START, LENS_MARKER_END,
  type DetectedStack, type InitResult
} from './init-display.js';
import { detectStack } from '../stack-detector.js';
import { validateProjectPath } from '../../utils/validation.js';
import { isEnoent } from '../../utils/fs.js';

interface SkillLinkContext {
  packageDir: string;
  projectDir: string;
  force: boolean;
}

const FALLBACK_STACK: DetectedStack = { language: 'unknown', framework: null, profile: 'software-base' };

async function getPackageSkills(): Promise<string[]> {
  try {
    const entries = await fsPromises.readdir(PATHS.skills, { withFileTypes: true });
    return entries
      .filter(e => (e.isDirectory() || e.isSymbolicLink()) && !e.name.startsWith('.'))
      .map(e => e.name).sort();
  } catch {
    return [];
  }
}

async function updateExistingSymlink(
  targetLink: string,
  resolvedPath: string,
  skillName: string,
  initResult: InitResult
): Promise<void> {
  const existingTarget = await fsPromises.readlink(targetLink);
  let isBroken = false;
  try {
    if (fs.realpathSync(targetLink) === resolvedPath) {
      initResult.skipped.push(`${skillName} (symlink already correct)`);
      return;
    }
  } catch {
    // Broken symlink — proceed to replace
    isBroken = true;
  }
  await fsPromises.unlink(targetLink);
  await fsPromises.symlink(resolvedPath, targetLink);
  const reason = isBroken ? 'symlink was broken' : `was ${existingTarget}`;
  initResult.replaced.push(`${skillName} (symlink updated: ${reason})`);
}

function resolvePackageSkillPath(packageDir: string, skillName: string): string | null {
  try {
    return fs.realpathSync(path.join(packageDir, skillName));
  } catch {
    return null;
  }
}

async function linkOneSkill(
  ctx: SkillLinkContext, skillName: string, initResult: InitResult
): Promise<void> {
  const targetLink = path.join(ctx.projectDir, skillName);
  const resolvedPath = resolvePackageSkillPath(ctx.packageDir, skillName);
  if (!resolvedPath) {
    initResult.warnings.push(`Skipped ${skillName}: broken symlink in package`);
    return;
  }

  let lstat;
  try { lstat = await fsPromises.lstat(targetLink); } catch { lstat = null; }

  if (!lstat) {
    await fsPromises.symlink(resolvedPath, targetLink);
    initResult.created.push(`.claude/skills/${skillName}`);
    return;
  }

  if (lstat.isSymbolicLink()) {
    await updateExistingSymlink(targetLink, resolvedPath, skillName, initResult);
  } else if (ctx.force) {
    await fsPromises.rm(targetLink, { recursive: true });
    await fsPromises.symlink(resolvedPath, targetLink);
    initResult.replaced.push(`${skillName} (replaced copy with symlink)`);
  } else {
    initResult.skipped.push(`${skillName} (real directory; use --force to replace)`);
  }
}

async function setupSkillSymlinks(
  projectPath: string,
  initResult: InitResult,
  force: boolean
): Promise<void> {
  const projectDir = path.join(projectPath, '.claude', 'skills');
  await fsPromises.mkdir(projectDir, { recursive: true });

  const skills = await getPackageSkills();
  if (skills.length === 0) {
    initResult.warnings.push('No skills found in installed package');
    return;
  }

  const ctx: SkillLinkContext = { packageDir: PATHS.skills, projectDir, force };
  for (const skillName of skills) {
    await linkOneSkill(ctx, skillName, initResult);
  }
}

function mergeLensSection(existing: string, section: string): string {
  const startIdx = existing.indexOf(LENS_MARKER_START);
  const endIdx = existing.indexOf(LENS_MARKER_END);
  if (startIdx !== -1 && endIdx !== -1) {
    return existing.slice(0, startIdx) + section + existing.slice(endIdx + LENS_MARKER_END.length);
  }
  return existing.trimEnd() + '\n\n' + section + '\n';
}

async function setupClaudeMd(
  projectPath: string,
  stack: DetectedStack,
  initResult: InitResult
): Promise<void> {
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  const newSection = buildLensSection(stack);
  let content: string | null = null;

  try { content = await fsPromises.readFile(claudeMdPath, 'utf-8'); }
  catch (cause) {
    if (!isEnoent(cause)) {
      throw new Error(`Failed to read CLAUDE.md`, { cause });
    }
    /* file not found — content stays null, will create new */
  }

  if (content !== null) {
    const hadMarkers = content.includes(LENS_MARKER_START);
    content = mergeLensSection(content, newSection);
    initResult[hadMarkers ? 'replaced' : 'created']
      .push(`CLAUDE.md (${hadMarkers ? 'updated' : 'appended'} Lens section)`);
  } else {
    content = newSection + '\n';
    initResult.created.push('CLAUDE.md');
  }

  const tmpPath = claudeMdPath + '.tmp';
  await fsPromises.writeFile(tmpPath, content, 'utf-8');
  await fsPromises.rename(tmpPath, claudeMdPath);
}

const LENS_DIR_SIGNATURES: Record<string, (entries: string[]) => boolean> = {
  'canon': (entries) => entries.some(f => ['javascript', 'python', 'react', 'testing'].includes(f)),
  'workflow-skills': (entries) => entries.some(f => ['workflow', 'utils'].includes(f)),
  'profiles': (entries) => entries.some(f => f.endsWith('.yaml')),
};

function detectCopiedDirectories(projectPath: string, initResult: InitResult): void {
  for (const [dir, isLensDir] of Object.entries(LENS_DIR_SIGNATURES)) {
    const fullPath = path.join(projectPath, dir);
    if (!fs.existsSync(fullPath)) continue;
    try { if (fs.lstatSync(fullPath).isSymbolicLink()) continue; } catch { continue; }
    let entries: string[];
    try { entries = fs.readdirSync(fullPath); } catch { continue; }
    if (isLensDir(entries)) initResult.cleanupHints.push(`${dir}/`);
  }
}

async function setupClaudeDirectories(projectPath: string, initResult: InitResult): Promise<void> {
  const dirsToCreate = ['.claude/rubric', '.claude/phases', '.claude/plans', '.claude/config'];
  for (const dir of dirsToCreate) {
    const targetDir = path.join(projectPath, dir);
    const sourceDir = path.join(PATHS.root, dir);
    if (!fs.existsSync(sourceDir)) continue;
    await fsPromises.mkdir(targetDir, { recursive: true });
    try {
      const entries = await fsPromises.readdir(sourceDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || !entry.isFile()) continue;
        await fsPromises.copyFile(path.join(sourceDir, entry.name), path.join(targetDir, entry.name));
      }
      initResult.created.push(`${dir}/`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      initResult.warnings.push(`Could not copy ${dir}: ${message}`);
    }
  }
}

function safeAction(initResult: InitResult, label: string, fn: () => Promise<void>): Promise<void> {
  return fn().catch((cause: unknown) => {
    const detail = cause instanceof Error ? cause.message : String(cause);
    initResult.errors.push(`${label}: ${detail}`);
    if (process.env['DEBUG'] && cause instanceof Error) {
      console.debug(`[safeAction] ${label} error chain:`, cause);
    }
  });
}

function printDetectionHeader(stack: DetectedStack): void {
  console.log(chalk.bold('\nlens init\n'));
  console.log(chalk.gray(`  Detected: ${stack.language}${stack.framework ? ` / ${stack.framework}` : ''}`));
  console.log(chalk.gray(`  Profile:  ${stack.profile}`));
  console.log(chalk.gray(`  Package:  ${PATHS.root}`));
  console.log(chalk.gray(`  Mode:     ${PATHS.mode}\n`));
}

function detectProjectStack(projectPath: string): DetectedStack {
  try {
    return detectStack(projectPath);
  } catch (cause) {
    if (process.env['DEBUG']) {
      console.debug('[init] Stack detection failed, using fallback:', cause instanceof Error ? cause.message : String(cause));
    }
    return FALLBACK_STACK;
  }
}

async function runInitSteps(
  projectPath: string,
  stack: DetectedStack,
  options: { force?: boolean },
  initResult: InitResult
): Promise<void> {
  await safeAction(initResult, 'Skill symlinks', () => setupSkillSymlinks(projectPath, initResult, options.force ?? false));
  await safeAction(initResult, 'Directories', () => setupClaudeDirectories(projectPath, initResult));
  await safeAction(initResult, 'CLAUDE.md', () => setupClaudeMd(projectPath, stack, initResult));
  detectCopiedDirectories(projectPath, initResult);
}

async function handleInit(options: { force?: boolean; project?: string }): Promise<void> {
  const rawProjectPath = options.project ?? process.cwd();
  const projectPath = validateProjectPath(rawProjectPath);
  if (!projectPath) {
    console.error(chalk.red(`Invalid project path: ${rawProjectPath}`));
    process.exitCode = 1;
    return;
  }

  const initResult: InitResult = {
    created: [], replaced: [], skipped: [],
    warnings: [], errors: [], cleanupHints: []
  };

  const stack = detectProjectStack(projectPath);
  printDetectionHeader(stack);

  await runInitSteps(projectPath, stack, options, initResult);
  printResults(initResult);

  if (initResult.errors.length > 0) { process.exitCode = 1; return; }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Lens in the current project')
    .option('-f, --force', 'Overwrite existing symlinks and files')
    .option('-p, --project <path>', 'Project directory (defaults to cwd)')
    .action(handleInit);
}
