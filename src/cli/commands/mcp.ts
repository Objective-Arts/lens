/**
 * MCP commands - view MCP server status
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  listServers,
  listCategories,
  checkAllServers,
  listInstalledServers,
  isServerInstalled,
  isServerEnabled,
  getMcpConfigPath
} from '../../mcp/index.js';
import { printInstalledServers, printRegistryServers, printEnvCheckResults } from '../display/index.js';
import type { MCPServerCategory } from '../../mcp/types.js';

export function registerMcpCommands(program: Command): void {
  const mcpCmd = program.command('mcp').description('View MCP server status');

  mcpCmd.command('list').description('List servers')
    .option('-p, --project <path>', 'Project path')
    .option('--installed', 'Show only installed')
    .option('--category <category>', 'Filter by category')
    .option('--enabled', 'Show only enabled')
    .action(handleList);

  mcpCmd.command('check').description('Check env vars for installed servers')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleCheck);
}

function handleList(options: { project?: string; installed?: boolean; category?: string; enabled?: boolean }): void {
  const projectPath = options.project;

  if (options.installed || options.enabled) {
    const installed = listInstalledServers(projectPath);
    if (installed.length === 0) {
      console.log(chalk.gray('No MCP servers installed.'));
      console.log(chalk.gray(`\nRun 'lns profile apply <profile>' to install servers.`));
      return;
    }
    printInstalledServers(installed, !!options.enabled);
  } else {
    const filters = options.category ? { category: options.category as MCPServerCategory } : undefined;
    const servers = listServers(filters);
    if (servers.length === 0) {
      console.log(chalk.gray('No servers found.'));
      return;
    }
    printRegistryServers(
      servers,
      (name) => isServerInstalled(name, projectPath),
      (name) => isServerEnabled(name, projectPath),
      listCategories()
    );
  }
}

function handleCheck(options: { project: string }): void {
  const results = checkAllServers(options.project);
  if (results.length === 0) {
    console.log(chalk.gray('No installed servers to check.'));
    console.log(chalk.gray(`Config: ${getMcpConfigPath(options.project)}`));
    return;
  }
  printEnvCheckResults(results);
}
