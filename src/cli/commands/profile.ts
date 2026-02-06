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
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    console.log(chalk.red(`Invalid profile name (path traversal): ${name}`));
    return;
  }
  const profile: ComposableProfile = { ...exampleComposableProfile, name };
  saveProfile(profile);
  console.log(chalk.green(`Created profile: ${name}`));
  console.log(chalk.gray(`Edit at: ~/.claude/profiles/${name.toLowerCase().replace(/\s+/g, '-')}.yaml`));
}

async function handleApply(
  profiles: string,
  projectPath: string | undefined,
  options: { project?: string; dryRun?: boolean }
): Promise<void> {
  const targetPath = projectPath || options.project || process.cwd();
  const profileNames = parseProfileString(profiles);
  const profile = resolveProfile(profileNames, profiles);
  if (!profile) return;

  if (profileNames.length > 1) {
    console.log(chalk.blue(`Combining profiles: ${profileNames.join(' + ')}\n`));
  }

  if (options.dryRun) {
    printDryRun(profile, targetPath);
    return;
  }

  console.log(chalk.blue(`Applying profile "${profile.name}" to ${targetPath}...\n`));

  console.log(chalk.cyan('[1/4] Setting up project structure...'));
  const result = await applyComposableProfile(profile, targetPath);

  console.log(chalk.cyan('[2/4] Processing results...'));
  printApplyResults(result);

  console.log(chalk.cyan('\n[3/4] Deploying canon skills...'));
  const deployResult = deployAllSkills(targetPath, { force: true });
  console.log(chalk.green(`  ✓ Deployed ${deployResult.deployed} canon skills`));
  if (deployResult.deployedNames.length > 0) printDeployedSkills(deployResult.deployedNames);
  deployResult.errors.forEach(e => console.log(chalk.red(`  Error: ${e}`)));

  console.log(chalk.cyan('[4/4] Finalizing...'));
  console.log(result.errors.length === 0
    ? chalk.green('\n✓ Profile applied successfully!')
    : chalk.yellow('\n⚠ Profile applied with some errors.'));
}

function handleClean(
  projectPath: string | undefined,
  options: { project?: string; dryRun?: boolean }
): void {
  const targetPath = projectPath || options.project || process.cwd();
  const claudeDir = path.join(targetPath, '.claude');

  if (!fs.existsSync(claudeDir)) {
    console.log(chalk.yellow('No .claude directory found. Nothing to clean.'));
    return;
  }

  const targets = [
    { path: path.join(claudeDir, 'skills'), label: '.claude/skills/', type: 'dir' as const },
    { path: path.join(claudeDir, 'canon-manifest.json'), label: '.claude/canon-manifest.json', type: 'file' as const },
    { path: path.join(claudeDir, 'ralph-config.yaml'), label: '.claude/ralph-config.yaml', type: 'file' as const },
    { path: path.join(claudeDir, 'config'), label: '.claude/config/', type: 'dir' as const },
    { path: path.join(targetPath, 'canon'), label: 'canon (symlink)', type: 'symlink' as const },
    { path: path.join(targetPath, 'workflow-skills'), label: 'workflow-skills (symlink)', type: 'symlink' as const },
  ];

  const found = targets.filter(t => fs.existsSync(t.path));

  if (found.length === 0) {
    console.log(chalk.yellow('No lens-managed files found. Nothing to clean.'));
    return;
  }

  if (options.dryRun) {
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
    return;
  }

  console.log(chalk.blue(`Cleaning lens files from ${targetPath}...\n`));
  let removed = 0;

  for (const t of found) {
    try {
      if (t.type === 'symlink') {
        const stat = fs.lstatSync(t.path);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(t.path);
          console.log(`  ${chalk.red('×')} ${t.label}`);
          removed++;
        }
      } else if (t.type === 'dir') {
        const count = fs.readdirSync(t.path).length;
        fs.rmSync(t.path, { recursive: true });
        console.log(`  ${chalk.red('×')} ${t.label} (${count} items)`);
        removed++;
      } else {
        fs.unlinkSync(t.path);
        console.log(`  ${chalk.red('×')} ${t.label}`);
        removed++;
      }
    } catch (err) {
      console.log(chalk.red(`  Failed to remove ${t.label}: ${err instanceof Error ? err.message : err}`));
    }
  }

  console.log(removed > 0
    ? chalk.green(`\n✓ Cleaned ${removed} items. Project is ready for a fresh apply.`)
    : chalk.yellow('\nNothing was removed.'));
}

// Helpers

function resolveProfile(names: string[], original: string): ComposableProfile | null {
  const available = listProfiles().map(p => p.name);
  const profile = names.length > 1 ? combineProfiles(names) : getProfile(names[0]);

  if (!profile) {
    printProfileNotFound(names.length > 1 ? original : names[0], available);
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
      skills.forEach(s => console.log(`  • ${s}`));
    }
  }
}

function printCommands(profile: ComposableProfile): void {
  if (profile.commands?.length) {
    console.log(chalk.cyan('\nCommands:'));
    profile.commands.forEach(c => console.log(`  • ${c}`));
  }
}

function printAutoInvoke(profile: ComposableProfile): void {
  if (profile.claudeMd?.autoInvoke?.length) {
    console.log(chalk.cyan('\nAuto-invoke rules:'));
    profile.claudeMd.autoInvoke.forEach(ai => console.log(`  ${ai.context} → ${ai.action}`));
  }
}
