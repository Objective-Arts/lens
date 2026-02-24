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

interface SkillLinkContext {
  packageDir: string;
  projectDir: string;
  force: boolean;
}

const FALLBACK_STACK: DetectedStack = { language: 'unknown', framework: null, profile: 'software-base' };

function allDeps(pkg: Record<string, unknown>): Record<string, string> {
  return {
    ...(pkg.dependencies as Record<string, string> || {}),
    ...(pkg.devDependencies as Record<string, string> || {})
  };
}

function detectJsFramework(pkg: Record<string, unknown>): DetectedStack {
  const deps = allDeps(pkg);
  const hasDep = (name: string): boolean => name in deps;

  if (hasDep('next')) return { language: 'typescript', framework: 'nextjs', profile: 'nextjs' };
  if (hasDep('angular') || hasDep('@angular/core')) return { language: 'typescript', framework: 'angular', profile: 'angular' };
  if (hasDep('react')) {
    const language = hasDep('typescript') ? 'typescript' : 'javascript';
    return { language, framework: 'react', profile: 'react' };
  }
  if (hasDep('d3') || hasDep('d3-selection')) return { language: 'javascript', framework: 'd3', profile: 'd3' };
  if (hasDep('typescript')) return { language: 'typescript', framework: null, profile: 'javascript' };
  return { language: 'javascript', framework: null, profile: 'javascript' };
}

function fileExistsAt(projectPath: string, file: string): boolean {
  try { fs.accessSync(path.join(projectPath, file)); return true; }
  catch { return false; }
}

function readJsonFile(projectPath: string, file: string): Record<string, unknown> | null {
  try { return JSON.parse(fs.readFileSync(path.join(projectPath, file), 'utf-8')); }
  catch { return null; }
}

function detectCSharp(projectPath: string): DetectedStack | null {
  try {
    const hasCsProj = fs.readdirSync(projectPath).some(f => f.endsWith('.csproj') || f.endsWith('.sln'));
    return hasCsProj ? { language: 'csharp', framework: null, profile: 'csharp' } : null;
  } catch {
    return null;
  }
}

function isPythonProject(has: (f: string) => boolean): boolean {
  return has('requirements.txt') || has('pyproject.toml') || has('setup.py') || has('Pipfile');
}

function isJavaProject(has: (f: string) => boolean): boolean {
  return has('pom.xml') || has('build.gradle') || has('build.gradle.kts');
}

function detectStack(projectPath: string): DetectedStack {
  const has = (file: string): boolean => fileExistsAt(projectPath, file);

  const pkg = readJsonFile(projectPath, 'package.json');
  if (pkg) return detectJsFramework(pkg);
  if (isPythonProject(has)) return { language: 'python', framework: null, profile: 'python' };
  if (isJavaProject(has)) return { language: 'java', framework: null, profile: 'java' };

  const csharp = detectCSharp(projectPath);
  if (csharp) return csharp;

  if (has('go.mod')) return { language: 'go', framework: null, profile: 'software-base' };
  if (has('Cargo.toml')) return { language: 'rust', framework: null, profile: 'software-base' };
  return FALLBACK_STACK;
}

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
  try {
    if (fs.realpathSync(targetLink) === resolvedPath) {
      initResult.skipped.push(`${skillName} (symlink already correct)`);
      return;
    }
  } catch { /* broken — replace */ }
  await fsPromises.unlink(targetLink);
  await fsPromises.symlink(resolvedPath, targetLink);
  initResult.replaced.push(`${skillName} (symlink updated: was ${existingTarget})`);
}

async function linkOneSkill(
  ctx: SkillLinkContext, skillName: string, initResult: InitResult
): Promise<void> {
  const targetLink = path.join(ctx.projectDir, skillName);
  let resolvedPath: string;
  try { resolvedPath = fs.realpathSync(path.join(ctx.packageDir, skillName)); }
  catch {
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
  catch { /* new file */ }

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
    } catch (error) {
      initResult.warnings.push(`Could not copy ${dir}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function safeAction(initResult: InitResult, label: string, fn: () => Promise<void>): Promise<void> {
  return fn().catch((error: unknown) => {
    initResult.errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  });
}

async function handleInit(options: { force?: boolean }): Promise<void> {
  const projectPath = process.cwd();
  const initResult: InitResult = {
    created: [], replaced: [], skipped: [],
    warnings: [], errors: [], cleanupHints: []
  };

  console.log(chalk.bold('\nlens init\n'));

  let stack: DetectedStack;
  try { stack = detectStack(projectPath); } catch { stack = FALLBACK_STACK; }
  console.log(chalk.gray(`  Detected: ${stack.language}${stack.framework ? ` / ${stack.framework}` : ''}`));
  console.log(chalk.gray(`  Profile:  ${stack.profile}`));
  console.log(chalk.gray(`  Package:  ${PATHS.root}`));
  console.log(chalk.gray(`  Mode:     ${PATHS.mode}\n`));

  await safeAction(initResult, 'Skill symlinks', () => setupSkillSymlinks(projectPath, initResult, options.force ?? false));
  await safeAction(initResult, 'Directories', () => setupClaudeDirectories(projectPath, initResult));
  await safeAction(initResult, 'CLAUDE.md', () => setupClaudeMd(projectPath, stack, initResult));
  detectCopiedDirectories(projectPath, initResult);
  printResults(initResult);

  if (initResult.errors.length > 0) process.exit(1);
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Lens in the current project')
    .option('-f, --force', 'Overwrite existing symlinks and files')
    .action(handleInit);
}
