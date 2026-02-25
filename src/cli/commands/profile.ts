/**
 * Profile commands - manage configuration profiles
 * Following clarity: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import {
  listProfiles,
  getProfile,
  saveProfile,
  applyComposableProfile,
  combineProfiles,
  parseProfileString,
  exampleComposableProfile
} from '../../profiles/index.js';
import { deployAllSkills } from '../../canon/index.js';
import {
  printDryRun,
  printDeployedSkills,
  printApplyResults,
  printProfileNotFound
} from '../display/index.js';
import type { ComposableProfile } from '../../types.js';
import { isValidName, validateProjectPath } from '../../utils/validation.js';

export function registerProfileCommands(program: Command): void {
  const profileCmd = program.command('profile').description('Manage configuration profiles');

  profileCmd.command('list').description('List available profiles').action(handleList);
  profileCmd.command('show <name>').description('Show profile details').action(handleShow);
  profileCmd.command('create <name>').description('Create a new profile').action(handleCreate);

  profileCmd
    .command('apply <profiles> [projectPath]')
    .description('Apply profile(s) to a project')
    .option('-p, --project <path>', 'Project path')
    .option('--dry-run', 'Show what would be done')
    .action(handleApply);

  profileCmd
    .command('clean [projectPath]')
    .description('Remove all lens-managed files from a project')
    .option('-p, --project <path>', 'Project path')
    .option('--dry-run', 'Show what would be removed')
    .action(handleClean);
}

function handleList(): void {
  const profiles = listProfiles();

  if (profiles.length === 0) {
    console.log(chalk.gray('No profiles found.'));
    console.log(chalk.gray(`Create one with: lens profile create <name>`));
    return;
  }

  console.log(chalk.bold('\nAvailable Profiles:\n'));
  for (const profile of profiles) {
    const composable = profile.composable ? chalk.green(' [composable]') : '';
    console.log(`  ${chalk.cyan(profile.name)}${composable}`);
    if (profile.description) console.log(chalk.gray(`    ${profile.description}`));
    const skillCount = Object.values(profile.skills || {}).flat().length;
    console.log(chalk.gray(`    Skills: ${skillCount}`));
  }

  console.log(chalk.gray('\nTip: Combine profiles with + syntax:'));
  console.log(chalk.gray('  lens profile apply base-tech+javascript+react /path/to/project'));
}

function handleShow(name: string): void {
  const profileNames = parseProfileString(name);
  const profile = resolveProfile(profileNames, name);
  if (!profile) return;

  console.log(chalk.bold(`\n${profile.name}`));
  console.log(chalk.gray('─'.repeat(50)));

  if (profile.description) console.log(`Description: ${profile.description}\n`);

  printSkillsByCategory(profile);
  printCommands(profile);
  printAutoInvoke(profile);
}

function handleCreate(name: string): void {
  if (!isValidName(name)) {
    console.error(chalk.red(`Invalid profile name: must contain only letters, numbers, hyphens, and underscores`));
    process.exitCode = 1;
    return;
  }
  const profile: ComposableProfile = { ...exampleComposableProfile, name };
  saveProfile(profile);
  console.log(chalk.green(`Created profile: ${name}`));
  console.log(chalk.gray(`Edit at: ~/.claude/profiles/${name.toLowerCase().replace(/\s+/g, '-')}.yaml`));
}

function validateProfileNames(profileNames: string[]): boolean {
  for (const profileName of profileNames) {
    if (!isValidName(profileName)) {
      console.error(chalk.red(`Invalid profile name component "${profileName}": must contain only letters, numbers, hyphens, and underscores`));
      process.exitCode = 1;
      return false;
    }
  }
  return true;
}

async function runApplySteps(profile: ReturnType<typeof resolveProfile>, targetPath: string): Promise<void> {
  if (!profile) return;

  console.log(chalk.blue(`Applying profile "${profile.name}" to ${targetPath}...\n`));

  console.log(chalk.cyan('[1/4] Setting up project structure...'));
  const result = await applyComposableProfile(profile, targetPath);

  console.log(chalk.cyan('[2/4] Processing results...'));
  printApplyResults(result);

  console.log(chalk.cyan('\n[3/4] Deploying canon skills...'));
  const deployResult = deployAllSkills(targetPath, { force: true });
  console.log(chalk.green(`  ✓ Deployed ${deployResult.deployed} canon skills`));
  if (deployResult.deployedNames.length > 0) printDeployedSkills(deployResult.deployedNames);
  deployResult.errors.forEach(deployError => console.log(chalk.red(`  Error: ${deployError}`)));

  console.log(chalk.cyan('[4/4] Finalizing...'));
  if (result.errors.length > 0 || deployResult.errors.length > 0) {
    console.log(chalk.yellow('\n⚠ Profile applied with some errors.'));
    process.exitCode = 1;
  } else {
    console.log(chalk.green('\n✓ Profile applied successfully!'));
  }
}

async function handleApply(
  profiles: string,
  projectPath: string | undefined,
  options: { project?: string; dryRun?: boolean }
): Promise<void> {
  const rawPath = projectPath || options.project || process.cwd();
  const targetPath = validateProjectPath(rawPath);
  if (!targetPath) {
    console.error(chalk.red(`Invalid project path: ${rawPath}`));
    process.exitCode = 1;
    return;
  }
  const profileNames = parseProfileString(profiles);

  if (!validateProfileNames(profileNames)) return;

  const profile = resolveProfile(profileNames, profiles);
  if (!profile) return;

  if (profileNames.length > 1) {
    console.log(chalk.blue(`Combining profiles: ${profileNames.join(' + ')}\n`));
  }

  if (options.dryRun) {
    printDryRun(profile, targetPath);
    return;
  }

  await runApplySteps(profile, targetPath);
}

type CleanTarget = { path: string; label: string; type: 'dir' | 'file' | 'symlink' };

function findCleanTargets(targetPath: string): CleanTarget[] | null {
  const claudeDir = path.join(targetPath, '.claude');

  if (!fs.existsSync(claudeDir)) {
    console.log(chalk.yellow('No .claude directory found. Nothing to clean.'));
    return null;
  }

  const targets: CleanTarget[] = [
    { path: path.join(claudeDir, 'skills'), label: '.claude/skills/', type: 'dir' },
    { path: path.join(claudeDir, 'canon-manifest.json'), label: '.claude/canon-manifest.json', type: 'file' },
    { path: path.join(claudeDir, 'config'), label: '.claude/config/', type: 'dir' },
    { path: path.join(targetPath, 'canon'), label: 'canon (symlink)', type: 'symlink' },
    { path: path.join(targetPath, 'workflow-skills'), label: 'workflow-skills (symlink)', type: 'symlink' },
  ];

  const found = targets.filter(t => fs.existsSync(t.path));

  if (found.length === 0) {
    console.log(chalk.yellow('No lens-managed files found. Nothing to clean.'));
    return null;
  }

  return found;
}

function printDryRunClean(found: CleanTarget[]): void {
  console.log(chalk.bold('\nDRY RUN — would remove:\n'));
  for (const t of found) {
    if (t.type === 'dir') {
      const count = fs.readdirSync(t.path).length;
      console.log(`  ${chalk.red('×')} ${t.label} (${count} items)`);
    } else {
      console.log(`  ${chalk.red('×')} ${t.label}`);
    }
  }
  console.log(chalk.gray('\nRun without --dry-run to remove.'));
}

function executeClean(found: CleanTarget[], targetPath: string): void {
  console.log(chalk.blue(`Cleaning lens files from ${targetPath}...\n`));
  const { removed, failed } = removeCleanTargets(found);
  if (failed > 0) {
    console.log(chalk.yellow(`\n⚠ Cleaned ${removed} items, ${failed} failed.`));
    process.exitCode = 1;
  } else if (removed > 0) {
    console.log(chalk.green(`\n✓ Cleaned ${removed} items. Project is ready for a fresh apply.`));
  } else {
    console.log(chalk.yellow('\nNothing was removed.'));
  }
}

function handleClean(
  projectPath: string | undefined,
  options: { project?: string; dryRun?: boolean }
): void {
  const rawPath = projectPath || options.project || process.cwd();
  const targetPath = validateProjectPath(rawPath);
  if (!targetPath) {
    console.error(chalk.red(`Invalid project path: ${rawPath}`));
    process.exitCode = 1;
    return;
  }

  const found = findCleanTargets(targetPath);
  if (!found) return;

  if (options.dryRun) {
    printDryRunClean(found);
  } else {
    executeClean(found, targetPath);
  }
}

function removeCleanTargets(targets: CleanTarget[]): { removed: number; failed: number } {
  let removed = 0;
  let failed = 0;
  for (const target of targets) {
    try {
      if (target.type === 'symlink') {
        const stat = fs.lstatSync(target.path);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(target.path);
          console.log(`  ${chalk.red('×')} ${target.label}`);
          removed++;
        }
      } else if (target.type === 'dir') {
        const count = fs.readdirSync(target.path).length;
        fs.rmSync(target.path, { recursive: true });
        console.log(`  ${chalk.red('×')} ${target.label} (${count} items)`);
        removed++;
      } else {
        fs.unlinkSync(target.path);
        console.log(`  ${chalk.red('×')} ${target.label}`);
        removed++;
      }
    } catch (removeErr) {
      console.error(chalk.red(`  Failed to remove ${target.label}: ${removeErr instanceof Error ? removeErr.message : removeErr}`));
      failed++;
    }
  }
  return { removed, failed };
}

// Helpers

function resolveProfile(names: string[], original: string): ComposableProfile | null {
  const available = listProfiles().map(p => p.name);
  const profile = names.length > 1 ? combineProfiles(names) : getProfile(names[0]);

  if (!profile) {
    printProfileNotFound(names.length > 1 ? original : names[0], available);
    process.exitCode = 1;
    return null;
  }
  return profile;
}

function printSkillsByCategory(profile: ComposableProfile): void {
  if (!profile.skills) return;

  const categories = ['security', 'tech', 'canon', 'global'] as const;
  const colors: Record<string, typeof chalk.red> = {
    security: chalk.red, tech: chalk.yellow, canon: chalk.blue, global: chalk.green
  };

  for (const cat of categories) {
    const skills = profile.skills[cat];
    if (skills?.length) {
      console.log((colors[cat] || chalk.white)(`Skills (${cat}):`));
      skills.forEach(skillName => console.log(`  • ${skillName}`));
    }
  }
}

function printCommands(profile: ComposableProfile): void {
  if (profile.commands?.length) {
    console.log(chalk.cyan('\nCommands:'));
    profile.commands.forEach(cmdName => console.log(`  • ${cmdName}`));
  }
}

function printAutoInvoke(profile: ComposableProfile): void {
  if (profile.claudeMd?.autoInvoke?.length) {
    console.log(chalk.cyan('\nAuto-invoke rules:'));
    profile.claudeMd.autoInvoke.forEach(rule => console.log(`  ${rule.context} → ${rule.action}`));
  }
}
