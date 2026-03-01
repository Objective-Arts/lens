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
import { isEnoent, copyDirectorySync } from '../../utils/fs.js';
import { hashDirectoryContents } from '../../utils/hash.js';
import { listWorkflowSkills, USER_FACING_SKILLS, getWorkflowSourceInfo } from '../../workflow/index.js';
import { findSkillSourcePath, getCanonSourceInfo } from '../../canon/source.js';
import { createManifest, writeManifest, updateSkillInManifest } from '../../canon/manifest.js';
import { hashSkillDirectory } from '../../canon/hash.js';
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

async function copyOneSkill(
  projectDir: string,
  skill: SkillSource,
  initResult: InitResult,
  force: boolean
): Promise<void> {
  const targetPath = path.join(projectDir, skill.name);

  let lstat;
  try { lstat = await fsPromises.lstat(targetPath); } catch { lstat = null; }

  if (!lstat) {
    copyDirectorySync(skill.absolutePath, targetPath);
    initResult.created.push(`.claude/skills/${skill.name}`);
    return;
  }

  // Old symlinks from previous version — always replace (migration)
  if (lstat.isSymbolicLink()) {
    await fsPromises.unlink(targetPath);
    copyDirectorySync(skill.absolutePath, targetPath);
    initResult.replaced.push(`${skill.name} (migrated symlink to copy)`);
  } else if (force) {
    await fsPromises.rm(targetPath, { recursive: true });
    copyDirectorySync(skill.absolutePath, targetPath);
    initResult.replaced.push(`${skill.name} (replaced with fresh copy)`);
  } else {
    initResult.skipped.push(`${skill.name} (exists; use --force to replace)`);
  }
}

async function setupSkillCopies(
  projectPath: string,
  skills: SkillSource[],
  initResult: InitResult,
  force: boolean
): Promise<void> {
  const projectDir = path.join(projectPath, '.claude', 'skills');
  await fsPromises.mkdir(projectDir, { recursive: true });

  const workflowSkills = skills.filter(s => s.origin === 'workflow');
  if (workflowSkills.length === 0) {
    initResult.warnings.push('No workflow skills found in installed package');
    return;
  }

  for (const skill of workflowSkills) {
    await copyOneSkill(projectDir, skill, initResult, force);
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

async function copyCanonDirectories(
  projectPath: string,
  skills: SkillSource[],
  initResult: InitResult
): Promise<void> {
  const canonSkills = skills.filter(s => s.origin === 'canon');
  if (canonSkills.length === 0) return;

  const canonDir = path.join(projectPath, '.claude', 'canon');
  await fsPromises.mkdir(canonDir, { recursive: true });

  for (const skill of canonSkills) {
    const targetPath = path.join(canonDir, skill.name);
    let lstat;
    try { lstat = await fsPromises.lstat(targetPath); } catch { lstat = null; }

    if (lstat?.isSymbolicLink()) {
      await fsPromises.unlink(targetPath);
    } else if (lstat) {
      continue; // Skip existing canon dirs (not force-replaced — canons are reference material)
    }

    copyDirectorySync(skill.absolutePath, targetPath);
    initResult.created.push(`.claude/canon/${skill.name}`);
  }
}

function writeWorkflowManifest(projectPath: string, skills: SkillSource[]): void {
  const sourceInfo = getWorkflowSourceInfo();
  const manifest = {
    source: { type: sourceInfo.type, path: sourceInfo.path, gitRemote: sourceInfo.gitRemote },
    installedAt: new Date().toISOString(),
    sourceCommit: sourceInfo.commit,
    skills: {} as Record<string, { installedAt: string; sourceFile: string; hash: string; modified: boolean; installedCommit?: string }>
  };

  const workflowSkills = skills.filter(s => s.origin === 'workflow');
  for (const skill of workflowSkills) {
    const targetPath = path.join(projectPath, '.claude', 'skills', skill.name);
    if (!fs.existsSync(targetPath)) continue;
    manifest.skills[skill.name] = {
      installedAt: new Date().toISOString(),
      sourceFile: path.join(skill.name, 'SKILL.md'),
      hash: hashDirectoryContents(targetPath),
      modified: false,
      installedCommit: sourceInfo.commit
    };
  }

  const claudeDir = path.join(projectPath, '.claude');
  if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
  const filePath = path.join(claudeDir, 'workflow-manifest.json');
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(manifest, null, 2) + '\n');
  fs.renameSync(tmpPath, filePath);
}

function writeCanonManifest(projectPath: string, skills: SkillSource[]): void {
  const canonSkills = skills.filter(s => s.origin === 'canon');
  if (canonSkills.length === 0) return;

  const sourceInfo = getCanonSourceInfo();
  const manifest = createManifest({ type: 'local', path: sourceInfo.path, gitRemote: sourceInfo.remote });
  if (sourceInfo.commit) manifest.sourceCommit = sourceInfo.commit;

  for (const skill of canonSkills) {
    const targetPath = path.join(projectPath, '.claude', 'canon', skill.name);
    if (!fs.existsSync(targetPath)) continue;
    updateSkillInManifest(manifest, skill.name, {
      installedAt: new Date().toISOString(),
      sourceFile: path.join(skill.name, 'SKILL.md'),
      hash: hashSkillDirectory(targetPath),
      modified: false,
      installedCommit: sourceInfo.commit
    });
  }

  writeManifest(projectPath, manifest);
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
  await safeAction(initResult, 'Skill copies', () => setupSkillCopies(projectPath, skills, initResult, force));
  await safeAction(initResult, 'Canon directories', () => copyCanonDirectories(projectPath, skills, initResult));
  await safeAction(initResult, 'Project structure', () => setupProjectStructure(projectPath, initResult, force));
  await safeAction(initResult, 'Manifests', async () => {
    writeWorkflowManifest(projectPath, skills);
    writeCanonManifest(projectPath, skills);
    initResult.created.push('.claude/workflow-manifest.json', '.claude/canon-manifest.json');
  });
  await safeAction(initResult, 'CLAUDE.md', () => setupClaudeMd(projectPath, stack, profile, initResult));
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
