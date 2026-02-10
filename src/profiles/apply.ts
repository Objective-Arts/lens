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
import { installAllWorkflowSkills } from '../workflow/index.js';
import { CLAUDE_DIR_NAME, SKILL_LIBRARY_PATHS, CANON_SUBDIRS, DEBUG } from './paths.js';
import { SKILL_CATEGORIES } from './validation.js';
import { applyMcpToProject } from './apply-mcp.js';
import {
  applyHooksToProject,
  copyPhaseConfigFiles,
  generateRalphConfig,
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

/** Reject skill names with path traversal characters */
function isValidSkillName(name: string): boolean {
  return !name.includes('/') && !name.includes('\\') && !name.includes('..');
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
  result: ApplyResult
): void {
  for (const cr of copyResults) {
    if (cr.status === 'copied') {
      result.linked.push(cr.message);
      if (cr.sourcePath) {
        updateSkillInManifest(manifest, cr.skillName, {
          installedCommit: sourceCommit,
          installedAt: new Date().toISOString(),
          sourceFile: path.relative(canonPath, cr.sourcePath) || cr.skillName,
          hash: hashSkillDirectory(path.join(skillsDir, cr.skillName)),
          modified: false
        });
      }
    } else if (cr.status === 'skipped') {
      result.skipped.push(cr.message);
    } else {
      result.errors.push(cr.message);
    }
  }
}

async function applySkillsToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.skills) return;

  const skillsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'skills');
  await fsPromises.mkdir(skillsDir, { recursive: true });

  const canonPath = getCanonSourcePath();
  const manifest = getOrCreateManifest(projectPath, canonPath);

  const copyPromises: Promise<SkillCopyResult>[] = [];
  for (const category of SKILL_CATEGORIES) {
    const skills = profile.skills[category as SkillCategory] ?? [];
    for (const skillName of skills) {
      copyPromises.push(copySkillToProject(skillName, category as SkillCategory, skillsDir));
    }
  }

  const copyResults = await Promise.all(copyPromises);
  recordCopyResults(copyResults, manifest, skillsDir, canonPath, getGitCommit(canonPath), result);
  writeManifest(projectPath, manifest);
  result.created.push(`${CLAUDE_DIR_NAME}/canon-manifest.json`);
}

async function applyCommandsToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.commands || profile.commands.length === 0) return;

  const commandsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'commands');
  const globalClaudePath = path.join(homedir(), CLAUDE_DIR_NAME);
  await fsPromises.mkdir(commandsDir, { recursive: true });

  const linkPromises = profile.commands.map(async (cmdPattern) => {
    const [cmdName] = cmdPattern.split('/');
    const globalCmdPath = path.join(globalClaudePath, 'commands', cmdName);
    const targetPath = path.join(commandsDir, cmdName);

    if (!fs.existsSync(globalCmdPath)) {
      return { type: 'warning' as const, message: `Global command not found: ${cmdName}` };
    }
    if (fs.existsSync(targetPath)) {
      return { type: 'skipped' as const, message: `command:${cmdName} (already exists)` };
    }

    try {
      await fsPromises.symlink(globalCmdPath, targetPath);
      return { type: 'linked' as const, message: `command:${cmdName} → ${globalCmdPath}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { type: 'error' as const, message: `Failed to link command ${cmdName}: ${message}` };
    }
  });

  const linkResults = await Promise.all(linkPromises);
  for (const r of linkResults) {
    switch (r.type) {
      case 'linked': result.linked.push(r.message); break;
      case 'skipped': result.skipped.push(r.message); break;
      case 'warning': result.warnings.push(r.message); break;
      case 'error': result.errors.push(r.message); break;
    }
  }
}

export async function applyComposableProfile(
  profile: ComposableProfile,
  projectPath: string
): Promise<ApplyResult> {
  const result: ApplyResult = { created: [], linked: [], skipped: [], errors: [], warnings: [] };
  const projectClaudePath = path.join(projectPath, CLAUDE_DIR_NAME);

  await fsPromises.mkdir(projectClaudePath, { recursive: true });
  await applySkillsToProject(profile, projectPath, result);

  const workflowResult = installAllWorkflowSkills(projectPath, { force: false });
  if (workflowResult.installed.length > 0) result.created.push(`Workflow skills: ${workflowResult.installed.join(', ')}`);
  result.skipped.push(...workflowResult.skipped.filter(s => !s.includes('already installed')));
  result.errors.push(...workflowResult.errors);

  await applyCommandsToProject(profile, projectPath, result);

  if (profile.claudeMd?.autoInvoke) {
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    await updateClaudeMdWithProfile(claudeMdPath, profile, projectPath);
    result.created.push('Updated CLAUDE.md with profile info and auto-invoke rules');
  }

  await generateRalphConfig(profile, projectPath, result);

  if (profile.ralph || profile.name === 'ralph-integration') {
    await copyPhaseConfigFiles(projectPath, result);
  }

  await applyMcpToProject(profile, projectPath, result);
  await applyHooksToProject(profile, projectPath, result);

  return result;
}
