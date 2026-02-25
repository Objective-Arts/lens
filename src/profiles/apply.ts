/**
 * Profile application to projects.
 *
 * Apply skills, commands, MCP servers, and configuration to a project.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import type { ComposableProfile, SkillCategory } from '../types.js';
import { copyDirectoryAsync } from '../utils/fs.js';
import { isValidSkillName } from '../utils/validation.js';
import {
  findSkillSourcePath,
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  hashSkillDirectory,
  getCanonSourcePath
} from '../canon/index.js';
import { getGitCommit, getGitRemote } from '../utils/git.js';
import { installAllWorkflowSkills, registerInstallation } from '../workflow/index.js';
import { CLAUDE_DIR_NAME, SKILL_LIBRARY_PATHS, CANON_SUBDIRS, DEBUG } from './paths.js';
import { validateProjectPath } from '../utils/validation.js';
import { SKILL_CATEGORIES } from './validation.js';
import { applyMcpToProject } from './apply-mcp.js';
import {
  applyHooksToProject,
  updateClaudeMdWithProfile
} from './apply-config.js';

export interface ApplyResult {
  created: string[];
  linked: string[];
  skipped: string[];
  errors: string[];
  warnings: string[];
}

/** Result of copying a single skill */
interface SkillCopyResult {
  skillName: string;
  status: 'copied' | 'skipped' | 'error';
  message: string;
  sourcePath?: string;
}

async function findSkillPathAsync(skillName: string, category: SkillCategory): Promise<string | null> {
  const basePath = SKILL_LIBRARY_PATHS[category];

  if (category === 'canon') {
    for (const subdir of CANON_SUBDIRS) {
      const skillPath = path.join(basePath, subdir, skillName);
      try {
        await fsPromises.access(skillPath);
        return skillPath;
      } catch { /* continue */ }
    }
    const rootPath = path.join(basePath, skillName);
    try {
      await fsPromises.access(rootPath);
      return rootPath;
    } catch {
      if (DEBUG) console.debug(`Skill not found in canon: ${skillName}`);
      return null;
    }
  }

  const skillPath = path.join(basePath, skillName);
  try {
    await fsPromises.access(skillPath);
    return skillPath;
  } catch {
    if (DEBUG) console.debug(`Skill not found: ${skillName} in ${category}`);
    return null;
  }
}

async function copySkillToProject(
  skillName: string,
  category: SkillCategory,
  skillsDir: string
): Promise<SkillCopyResult> {
  if (!isValidSkillName(skillName)) {
    return { skillName, status: 'error', message: `Invalid skill name (path traversal): ${skillName}` };
  }

  let sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    sourcePath = await findSkillPathAsync(skillName, category);
  }

  if (!sourcePath) {
    return { skillName, status: 'error', message: `Skill not found: ${skillName} (${category})` };
  }

  const targetPath = path.join(skillsDir, skillName);
  if (fs.existsSync(targetPath)) {
    return { skillName, status: 'skipped', message: `${skillName} (already exists)` };
  }

  try {
    await copyDirectoryAsync(sourcePath, targetPath);
    return { skillName, status: 'copied', message: `${skillName} (copied from ${sourcePath})`, sourcePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { skillName, status: 'error', message: `Failed to copy skill ${skillName}: ${message}` };
  }
}

function getOrCreateManifest(projectPath: string, canonPath: string): ReturnType<typeof createManifest> {
  const manifest = readManifest(projectPath);
  if (manifest) return manifest;
  return createManifest({
    type: 'local',
    path: canonPath,
    gitRemote: getGitRemote(canonPath)
  });
}

function recordCopyResults(
  copyResults: SkillCopyResult[],
  manifest: ReturnType<typeof createManifest>,
  skillsDir: string,
  canonPath: string,
  sourceCommit: string | undefined,
  applyResult: ApplyResult
): void {
  for (const copyResult of copyResults) {
    if (copyResult.status === 'copied') {
      applyResult.linked.push(copyResult.message);
      if (copyResult.sourcePath) {
        updateSkillInManifest(manifest, copyResult.skillName, {
          installedCommit: sourceCommit,
          installedAt: new Date().toISOString(),
          sourceFile: path.relative(canonPath, copyResult.sourcePath) || copyResult.skillName,
          hash: hashSkillDirectory(path.join(skillsDir, copyResult.skillName)),
          modified: false
        });
      }
    } else if (copyResult.status === 'skipped') {
      applyResult.skipped.push(copyResult.message);
    } else {
      applyResult.errors.push(copyResult.message);
    }
  }
}

async function symlinkCanonSkill(
  skillsDir: string,
  copyResult: SkillCopyResult,
  applyResult: ApplyResult
): Promise<void> {
  const linkPath = path.join(skillsDir, copyResult.skillName);
  const relTarget = path.join('..', 'canon', copyResult.skillName);

  try {
    const stat = await fsPromises.lstat(linkPath);
    if (stat.isSymbolicLink()) {
      await fsPromises.unlink(linkPath);
    } else {
      return; // Real directory/file already at this path — skip
    }
  } catch (cause) {
    const code = (cause as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') {
      applyResult.errors.push(`Failed to check skill link ${copyResult.skillName}: ${cause instanceof Error ? cause.message : String(cause)}`);
      return;
    }
    // ENOENT — link doesn't exist yet, create it below
  }

  try {
    await fsPromises.symlink(relTarget, linkPath);
    applyResult.linked.push(`skills/${copyResult.skillName} → canon/${copyResult.skillName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    applyResult.errors.push(`Failed to symlink skill ${copyResult.skillName}: ${message}`);
  }
}

async function copyAndRecordCanonSkills(
  profile: ComposableProfile,
  projectPath: string,
  canonDir: string,
  applyResult: ApplyResult
): Promise<SkillCopyResult[]> {
  const canonPath = getCanonSourcePath();
  const manifest = getOrCreateManifest(projectPath, canonPath);

  const copyPromises: Promise<SkillCopyResult>[] = [];
  for (const category of SKILL_CATEGORIES) {
    const skills = profile.skills?.[category as SkillCategory] ?? [];
    for (const skillName of skills) {
      copyPromises.push(copySkillToProject(skillName, category as SkillCategory, canonDir));
    }
  }

  const copyResults = await Promise.all(copyPromises);
  recordCopyResults(copyResults, manifest, canonDir, canonPath, getGitCommit(canonPath), applyResult);
  writeManifest(projectPath, manifest);
  applyResult.created.push(`${CLAUDE_DIR_NAME}/canon-manifest.json`);
  return copyResults;
}

async function applySkillsToProject(
  profile: ComposableProfile,
  projectPath: string,
  applyResult: ApplyResult
): Promise<void> {
  if (!profile.skills) return;

  // Canon skills go to .claude/canon/ (reference/auto-invoke only, not slash commands).
  // Workflow skills go to .claude/skills/ separately via installAllWorkflowSkills.
  const canonDir = path.join(projectPath, CLAUDE_DIR_NAME, 'canon');
  await fsPromises.mkdir(canonDir, { recursive: true });

  const copyResults = await copyAndRecordCanonSkills(profile, projectPath, canonDir, applyResult);

  // Symlink profile-specified canon skills into .claude/skills/ so Claude Code discovers them.
  const skillsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'skills');
  await fsPromises.mkdir(skillsDir, { recursive: true });

  for (const copyResult of copyResults) {
    if (copyResult.status === 'error') continue;
    await symlinkCanonSkill(skillsDir, copyResult, applyResult);
  }
}

type LinkResult = { type: 'linked' | 'skipped' | 'warning' | 'error'; message: string };

async function linkSingleCommand(
  cmdPattern: string,
  commandsDir: string,
  globalClaudePath: string
): Promise<LinkResult> {
  const [cmdName] = cmdPattern.split('/');
  if (!isValidSkillName(cmdName)) {
    return { type: 'warning', message: `Invalid command name: ${cmdName}` };
  }
  const globalCmdPath = path.join(globalClaudePath, 'commands', cmdName);
  const targetPath = path.join(commandsDir, cmdName);

  if (!fs.existsSync(globalCmdPath)) {
    return { type: 'warning', message: `Global command not found: ${cmdName}` };
  }
  if (fs.existsSync(targetPath)) {
    return { type: 'skipped', message: `command:${cmdName} (already exists)` };
  }

  try {
    await fsPromises.symlink(globalCmdPath, targetPath);
    return { type: 'linked', message: `command:${cmdName} → ${globalCmdPath}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { type: 'error', message: `Failed to link command ${cmdName}: ${message}` };
  }
}

async function applyCommandsToProject(
  profile: ComposableProfile,
  projectPath: string,
  applyResult: ApplyResult
): Promise<void> {
  if (!profile.commands || profile.commands.length === 0) return;

  const commandsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'commands');
  const globalClaudePath = path.join(homedir(), CLAUDE_DIR_NAME);
  await fsPromises.mkdir(commandsDir, { recursive: true });

  const linkResults = await Promise.all(
    profile.commands.map(cmd => linkSingleCommand(cmd, commandsDir, globalClaudePath))
  );
  for (const linkResult of linkResults) {
    switch (linkResult.type) {
      case 'linked': applyResult.linked.push(linkResult.message); break;
      case 'skipped': applyResult.skipped.push(linkResult.message); break;
      case 'warning': applyResult.warnings.push(linkResult.message); break;
      case 'error': applyResult.errors.push(linkResult.message); break;
    }
  }
}

export interface ApplyOptions {
  /**
   * Override the workflow skill installer for testing.
   * Defaults to installAllWorkflowSkills from workflow/index.
   */
  installWorkflowSkills?: typeof installAllWorkflowSkills;
}

export async function applyComposableProfile(
  profile: ComposableProfile,
  projectPath: string,
  applyOptions: ApplyOptions = {}
): Promise<ApplyResult> {
  const applyResult: ApplyResult = { created: [], linked: [], skipped: [], errors: [], warnings: [] };

  const resolvedProjectPath = validateProjectPath(projectPath);
  if (!resolvedProjectPath) {
    applyResult.errors.push(`Invalid project path: ${projectPath}`);
    return applyResult;
  }

  const projectClaudePath = path.join(resolvedProjectPath, CLAUDE_DIR_NAME);
  const installWorkflow = applyOptions.installWorkflowSkills ?? installAllWorkflowSkills;

  await fsPromises.mkdir(projectClaudePath, { recursive: true });
  await applySkillsToProject(profile, resolvedProjectPath, applyResult);

  const workflowResult = installWorkflow(resolvedProjectPath, { force: false });
  if (workflowResult.installed.length > 0) applyResult.created.push(`Workflow skills: ${workflowResult.installed.join(', ')}`);
  applyResult.skipped.push(...workflowResult.skipped.filter(s => !s.includes('already installed')));
  applyResult.errors.push(...workflowResult.errors);

  registerInstallation(resolvedProjectPath, profile.name);

  await applyCommandsToProject(profile, resolvedProjectPath, applyResult);

  if (profile.claudeMd?.autoInvoke) {
    const claudeMdPath = path.join(resolvedProjectPath, 'CLAUDE.md');
    await updateClaudeMdWithProfile(claudeMdPath, profile, resolvedProjectPath);
    applyResult.created.push('Updated CLAUDE.md with profile info and auto-invoke rules');
  }

  await applyMcpToProject(profile, resolvedProjectPath, applyResult);
  await applyHooksToProject(profile, resolvedProjectPath, applyResult);

  return applyResult;
}
