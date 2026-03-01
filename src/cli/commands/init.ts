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
import { setupProjectStructure } from './init-setup.js';
import { detectStack } from '../stack-detector.js';
import { validateProjectPath } from '../../utils/validation.js';
import { isEnoent } from '../../utils/fs.js';
import { listWorkflowSkills, USER_FACING_SKILLS } from '../../workflow/index.js';
import { findSkillSourcePath } from '../../canon/source.js';
import { getProfile } from '../../profiles/loader.js';
import { parseProfileString, combineProfiles } from '../../profiles/combiner.js';
import type { ComposableProfile } from '../../types.js';

interface SkillSource {
  name: string;
  absolutePath: string;
  origin: 'workflow' | 'canon';
}

const FALLBACK_STACK: DetectedStack = { language: 'unknown', framework: null, profile: 'software-base' };

function discoverWorkflowSkills(): SkillSource[] {
  const skills = listWorkflowSkills();
  const sources: SkillSource[] = [];
  for (const skill of skills) {
    if (!USER_FACING_SKILLS.has(skill.name)) continue;
    try {
      const absolutePath = fs.realpathSync(skill.path);
      sources.push({ name: skill.name, absolutePath, origin: 'workflow' });
    } catch { /* skip broken paths */ }
  }
  return sources;
}

function discoverCanonSkills(profile: ComposableProfile | null): SkillSource[] {
  if (!profile?.skills?.canon) return [];
  const sources: SkillSource[] = [];
  for (const skillName of profile.skills.canon) {
    const sourcePath = findSkillSourcePath(skillName);
    if (!sourcePath) continue;
    try {
      const absolutePath = fs.realpathSync(sourcePath);
      sources.push({ name: skillName, absolutePath, origin: 'canon' });
    } catch { /* skip broken paths */ }
  }
  return sources;
}

function discoverAllSkills(profile: ComposableProfile | null): SkillSource[] {
  const workflow = discoverWorkflowSkills();
  const canon = discoverCanonSkills(profile);
  const byName = new Map<string, SkillSource>();
  for (const s of canon) byName.set(s.name, s);
  for (const s of workflow) byName.set(s.name, s);
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    isBroken = true;
  }
  await fsPromises.unlink(targetLink);
  await fsPromises.symlink(resolvedPath, targetLink);
  const reason = isBroken ? 'symlink was broken' : `was ${existingTarget}`;
  initResult.replaced.push(`${skillName} (symlink updated: ${reason})`);
}

async function linkOneSkill(
  projectDir: string,
  skill: SkillSource,
  initResult: InitResult,
  force: boolean
): Promise<void> {
  const targetLink = path.join(projectDir, skill.name);

  let lstat;
  try { lstat = await fsPromises.lstat(targetLink); } catch { lstat = null; }

  if (!lstat) {
    await fsPromises.symlink(skill.absolutePath, targetLink);
    initResult.created.push(`.claude/skills/${skill.name}`);
    return;
  }

  if (lstat.isSymbolicLink()) {
    await updateExistingSymlink(targetLink, skill.absolutePath, skill.name, initResult);
  } else if (force) {
    await fsPromises.rm(targetLink, { recursive: true });
    await fsPromises.symlink(skill.absolutePath, targetLink);
    initResult.replaced.push(`${skill.name} (replaced copy with symlink)`);
  } else {
    initResult.skipped.push(`${skill.name} (real directory; use --force to replace)`);
  }
}

async function setupSkillSymlinks(
  projectPath: string,
  skills: SkillSource[],
  initResult: InitResult,
  force: boolean
): Promise<void> {
  const projectDir = path.join(projectPath, '.claude', 'skills');
  await fsPromises.mkdir(projectDir, { recursive: true });

  if (skills.length === 0) {
    initResult.warnings.push('No skills found in installed package');
    return;
  }

  for (const skill of skills) {
    await linkOneSkill(projectDir, skill, initResult, force);
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
  profile: ComposableProfile | null,
  initResult: InitResult
): Promise<void> {
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  const newSection = buildLensSection(stack, profile);
  let content: string | null = null;

  try { content = await fsPromises.readFile(claudeMdPath, 'utf-8'); }
  catch (cause) {
    if (!isEnoent(cause)) {
      throw new Error(`Failed to read CLAUDE.md`, { cause });
    }
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

function safeAction(initResult: InitResult, label: string, fn: () => Promise<void>): Promise<void> {
  return fn().catch((cause: unknown) => {
    const detail = cause instanceof Error ? cause.message : String(cause);
    initResult.errors.push(`${label}: ${detail}`);
    if (process.env['DEBUG'] && cause instanceof Error) {
      console.debug(`[safeAction] ${label} error chain:`, cause);
    }
  });
}

function printDetectionHeader(stack: DetectedStack, skillCount: number): void {
  console.log(chalk.bold('\nlens init\n'));
  console.log(chalk.gray(`  Detected: ${stack.language}${stack.framework ? ` / ${stack.framework}` : ''}`));
  console.log(chalk.gray(`  Profile:  ${stack.profile}`));
  console.log(chalk.gray(`  Skills:   ${skillCount} available`));
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
  profile: ComposableProfile | null,
  skills: SkillSource[],
  options: { force?: boolean },
  initResult: InitResult
): Promise<void> {
  const force = options.force ?? false;
  await safeAction(initResult, 'Skill symlinks', () => setupSkillSymlinks(projectPath, skills, initResult, force));
  await safeAction(initResult, 'Project structure', () => setupProjectStructure(projectPath, initResult, force));
  await safeAction(initResult, 'CLAUDE.md', () => setupClaudeMd(projectPath, stack, profile, initResult));
  detectCopiedDirectories(projectPath, initResult);
}

async function handleInit(options: { force?: boolean; project?: string; profile?: string }): Promise<void> {
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

  const stack = options.profile
    ? { language: 'unknown', framework: null, profile: options.profile }
    : detectProjectStack(projectPath);

  const profileNames = parseProfileString(stack.profile);
  const profile = profileNames.length > 1
    ? combineProfiles(profileNames)
    : getProfile(profileNames[0]);
  const skills = discoverAllSkills(profile);

  printDetectionHeader(stack, skills.length);

  await runInitSteps(projectPath, stack, profile, skills, options, initResult);
  printResults(initResult);

  if (initResult.errors.length > 0) { process.exitCode = 1; return; }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Lens in the current project')
    .option('-f, --force', 'Overwrite existing symlinks and files')
    .option('-p, --project <path>', 'Project directory (defaults to cwd)')
    .option('--profile <name>', 'Use specific profile instead of auto-detecting')
    .action(handleInit);
}
