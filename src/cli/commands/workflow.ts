/**
 * Workflow commands - manage workflow skills
 * Following clarity: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  listWorkflowSkills,
  checkWorkflowStatus,
  upgradeWorkflowSkills,
  getWorkflowSourceInfo
} from '../../workflow/index.js';
import { printList } from '../display/index.js';

export function registerWorkflowCommands(program: Command): void {
  const workflowCmd = program.command('workflow').description('Manage workflow skills');

  workflowCmd.command('list').description('List available skills').action(handleList);

  workflowCmd.command('status').description('Show status')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleStatus);

  workflowCmd.command('upgrade').description('Upgrade skills')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-f, --force', 'Overwrite modified')
    .option('-s, --skills <skills>', 'Specific skills')
    .action(handleUpgrade);

  workflowCmd.command('source').description('Show source info').action(handleSource);
}

function handleList(): void {
  const skills = listWorkflowSkills();
  const sourceInfo = getWorkflowSourceInfo();

  if (skills.length === 0) {
    console.log(chalk.gray('No workflow skills found.'));
    console.log(chalk.gray(`Source: ${sourceInfo.path}`));
    return;
  }

  console.log(chalk.bold('\nAvailable Workflow Skills'));
  console.log(chalk.gray(`Source: ${sourceInfo.path}`));
  if (sourceInfo.commit) console.log(chalk.gray(`Commit: ${sourceInfo.commit}`));
  console.log(chalk.gray('─'.repeat(50)));

  for (const skill of skills) {
    console.log(`  ${chalk.cyan(skill.name)}`);
    if (skill.description) console.log(chalk.gray(`    ${skill.description}`));
  }
  console.log(chalk.gray(`\nTotal: ${skills.length} skills`));
}

function handleStatus(options: { project: string }): void {
  const statuses = checkWorkflowStatus(options.project);
  const sourceInfo = getWorkflowSourceInfo();

  if (statuses.length === 0) {
    console.log(chalk.gray('No workflow skills installed.'));
    return;
  }

  console.log(chalk.bold('\nWorkflow Skills Status'));
  console.log(chalk.gray(`Source: ${sourceInfo.path} @ ${sourceInfo.commit || 'unknown'}`));
  console.log(chalk.gray('─'.repeat(60)));

  const icons: Record<string, string> = {
    current: chalk.green('✓ current'),
    outdated: chalk.yellow('⚠ outdated'),
    modified: chalk.blue('✎ modified'),
    missing: chalk.red('✗ missing')
  };

  for (const status of statuses) {
    const icon = icons[status.status] || status.status;
    const commit = status.installedCommit ? chalk.gray(`(${status.installedCommit})`) : '';
    console.log(`  ${status.name.padEnd(20)} ${icon} ${commit}`);
  }

  const outdated = statuses.filter(s => s.status === 'outdated').length;
  if (outdated > 0) {
    console.log(chalk.yellow(`\nRun 'lns workflow upgrade' to update ${outdated} skill(s)`));
  }
}

function handleUpgrade(options: { project: string; force?: boolean; skills?: string }): void {
  const skillList = options.skills?.split(',').map(s => s.trim());
  const result = upgradeWorkflowSkills(options.project, { force: options.force, skills: skillList });

  printList('Upgraded', result.upgraded, chalk.green, '✓');
  printList('Skipped', result.skipped, chalk.yellow, '-');
  printList('Errors', result.errors, chalk.red, '✗');

  if (result.upgraded.length === 0 && result.errors.length === 0) {
    console.log(chalk.gray('All workflow skills are current.'));
  }
}

function handleSource(): void {
  const info = getWorkflowSourceInfo();
  console.log(chalk.bold('\nWorkflow Skills Source'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Path:   ${chalk.cyan(info.path)}`);
  console.log(`Commit: ${info.commit ? chalk.yellow(info.commit) : chalk.gray('unknown')}`);
  console.log(`Remote: ${info.remote || chalk.gray('none')}`);
}
