/**
 * Tools commands - manage companion CLI tools
 * Following kernighan: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { listTools, installTool, uninstallTool, getBinDir } from '../../tools/index.js';

export function registerToolsCommands(program: Command): void {
  const toolsCmd = program.command('tools').description('Manage companion CLI tools');

  toolsCmd.command('list').description('List available tools').action(handleList);

  toolsCmd.command('install <tool>').description('Install a tool')
    .option('-f, --force', 'Overwrite existing')
    .option('-p, --project <path>', 'Project for MCP config')
    .action(handleInstall);

  toolsCmd.command('uninstall <tool>').description('Remove a tool').action(handleUninstall);
}

function handleList(): void {
  const tools = listTools();

  console.log(chalk.bold('\nAvailable Tools'));
  console.log(chalk.gray(`Install location: ${getBinDir()}`));
  console.log(chalk.gray('─'.repeat(50)));

  for (const tool of tools) {
    const status = tool.installed ? chalk.green('✓ installed') : chalk.gray('○ not installed');
    console.log(`\n  ${chalk.cyan(tool.name)} ${status}`);
    console.log(chalk.gray(`    ${tool.description}`));
    if (tool.path) console.log(chalk.gray(`    Path: ${tool.path}`));
  }

  console.log(chalk.gray('\nInstall with: cc-config tools install <name>'));
}

function handleInstall(toolName: string, options: { force?: boolean; project?: string }): void {
  const result = installTool(toolName, { force: options.force, projectDir: options.project });

  if (result.success) {
    console.log(chalk.green(result.message));
    if (result.path) {
      console.log(chalk.gray(`\nMake sure ${getBinDir()} is in your PATH:`));
      console.log(chalk.gray(`  export PATH="$PATH:${getBinDir()}"`));
    }
    if (toolName === 'ralph') {
      console.log(chalk.cyan('\nUsage:'));
      console.log(chalk.gray('  ralph PRD.md        # Run with default 50 iterations'));
      console.log(chalk.gray('  ralph PRD.md 100    # Run with 100 max iterations'));
    }
  } else {
    console.log(chalk.red(result.message));
  }
}

function handleUninstall(toolName: string): void {
  const result = uninstallTool(toolName);
  console.log(result.success ? chalk.green(result.message) : chalk.red(result.message));
}
