/**
 * Canon commands - manage canon skills
 * Following clarity: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  listCanonSkills,
  checkSkillStatus,
  upgradeSkills,
  diffSkill,
  getCanonSourceInfo,
  deployAllSkills,
  verifySkillsMatch
} from '../../canon/index.js';
import { loadSkills } from '../../canon/skill-loader.js';
import { printList, printCanonSkillsByCategory, printSkillStatuses, printVerifyResults, printSkillInspection } from '../display/index.js';
import { validateProjectPath, getPathValidationError } from '../../utils/validation.js';

export function registerCanonCommands(program: Command): void {
  const canonCmd = program.command('canon').description('Manage canon skills');

  canonCmd.command('list').description('List available skills')
    .option('--category <category>', 'Filter by category')
    .action(handleList);

  canonCmd.command('status').description('Show installed skill status')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleStatus);

  canonCmd.command('upgrade').description('Upgrade outdated skills')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-f, --force', 'Overwrite modified')
    .option('-s, --skills <skills>', 'Specific skills')
    .action(handleUpgrade);

  canonCmd.command('diff <skill>').description('Show diff')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleDiff);

  canonCmd.command('source').description('Show source info')
    .action(handleSource);

  canonCmd.command('deploy').description('Deploy all skills')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-f, --force', 'Overwrite existing')
    .action(handleDeploy);

  canonCmd.command('verify').description('Verify skills match source')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-v, --verbose', 'Show all matches')
    .action(handleVerify);

  canonCmd.command('inspect <skill...>').description('Show what ralph sees when loading a skill')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleInspect);
}

function validatePath(path: string): string | null {
  const validated = validateProjectPath(path);
  if (!validated) {
    console.log(chalk.red(`Invalid path: ${getPathValidationError(path)}`));
    return null;
  }
  return validated;
}

// Handlers
function handleList(options: { category?: string }): void {
  const skills = listCanonSkills();
  const sourceInfo = getCanonSourceInfo();

  if (skills.length === 0) {
    console.log(chalk.gray('No canon skills found.'));
    console.log(chalk.gray(`Source: ${sourceInfo.path}`));
    return;
  }

  const filtered = options.category ? skills.filter(s => s.category === options.category) : skills;
  printCanonSkillsByCategory(filtered, sourceInfo);
}

function handleStatus(options: { project: string }): void {
  const statuses = checkSkillStatus(options.project);

  if (statuses.length === 0) {
    console.log(chalk.gray('No skills installed.'));
    return;
  }

  printSkillStatuses(statuses, getCanonSourceInfo(), options.project);
}

function handleUpgrade(options: { project: string; force?: boolean; skills?: string }): void {
  const skillList = options.skills?.split(',').map(s => s.trim());
  const result = upgradeSkills(options.project, { force: options.force, skills: skillList });

  printList('Upgraded', result.upgraded, chalk.green, '✓');
  printList('Skipped', result.skipped, chalk.yellow, '-');
  printList('Errors', result.errors, chalk.red, '✗');

  if (result.upgraded.length === 0 && result.errors.length === 0) {
    console.log(chalk.gray('All skills are current.'));
  }
}

function handleDiff(skill: string, options: { project: string }): void {
  const diff = diffSkill(skill, options.project);

  if (!diff) {
    console.log(chalk.gray('Could not generate diff'));
    return;
  }

  console.log(chalk.bold(`\nDiff: ${skill}`));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(diff);
}

function handleSource(): void {
  const info = getCanonSourceInfo();
  console.log(chalk.bold('\nCanon Source'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Path:   ${chalk.cyan(info.path)}`);
  console.log(`Commit: ${info.commit ? chalk.yellow(info.commit) : chalk.gray('unknown')}`);
  console.log(`Remote: ${info.remote || chalk.gray('none')}`);
}

function handleDeploy(options: { project: string; force?: boolean }): void {
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  console.log(chalk.bold('\nDeploying Canon Skills'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Target: ${chalk.cyan(projectPath)}`);

  const result = deployAllSkills(projectPath, { force: options.force });

  console.log(chalk.green(`Deployed: ${result.deployed} skills`));
  if (result.deployedNames.length > 0) {
    const names = result.deployedNames.sort();
    for (let i = 0; i < names.length; i += 4) {
      console.log(chalk.gray(`  ${names.slice(i, i + 4).map(s => s.padEnd(20)).join('')}`));
    }
  }
  if (result.skipped > 0) console.log(chalk.yellow(`Skipped: ${result.skipped}`));
  result.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
}

function handleVerify(options: { project: string; verbose?: boolean }): void {
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  const sourceInfo = getCanonSourceInfo();
  console.log(chalk.bold('\nVerifying Canon Skills'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Source:  ${chalk.cyan(sourceInfo.path)}`);
  console.log(`Project: ${chalk.cyan(projectPath)}\n`);

  const result = verifySkillsMatch(projectPath);
  printVerifyResults(result, !!options.verbose);

  if (!result.allMatch) process.exit(1);
}

function handleInspect(skillNames: string[], options: { project: string }): void {
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  const skills = loadSkills(projectPath, skillNames);

  const notFound = skillNames.filter(name => !skills.some(s => s.name === name));
  for (const name of notFound) {
    console.log(chalk.red(`Skill not found: ${name}`));
  }

  for (const skill of skills) {
    printSkillInspection(skill);
  }
}
