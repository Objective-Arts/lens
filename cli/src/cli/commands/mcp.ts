/**
 * MCP commands - manage MCP server registry
 * Following kernighan: single responsibility module
 */

import * as fs from 'fs';
import { Command } from 'commander';
import chalk from 'chalk';
import {
  listServers,
  listCategories,
  getServer,
  installServer,
  uninstallServer,
  enableServer,
  disableServer,
  checkServer,
  checkAllServers,
  listInstalledServers,
  isServerInstalled,
  isServerEnabled,
  addServerToRegistry,
  ensureRegistryDir,
  getMcpConfigPath
} from '../../mcp/index.js';
import {
  printInstalledServers,
  printRegistryServers,
  printServerDetails,
  printEnvCheckResults
} from '../display/index.js';
import type { MCPServerDefinition, MCPServerCategory } from '../../mcp/types.js';
import { isValidName, validateProjectPath, getNameValidationError, getPathValidationError } from '../../utils/validation.js';

export function registerMcpCommands(program: Command): void {
  const mcpCmd = program.command('mcp').description('Manage MCP server registry');

  mcpCmd.command('list').description('List servers')
    .option('-p, --project <path>', 'Project path')
    .option('--installed', 'Show only installed')
    .option('--category <category>', 'Filter by category')
    .option('--enabled', 'Show only enabled')
    .action(handleList);

  mcpCmd.command('show <server>').description('Show server details')
    .option('-p, --project <path>', 'Project path')
    .action(handleShow);

  mcpCmd.command('install <server>').description('Install a server')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('--category <category>', 'Install all in category')
    .option('--skip-env-check', 'Skip env validation')
    .action(handleInstall);

  mcpCmd.command('uninstall <server>').description('Remove a server')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleUninstall);

  mcpCmd.command('enable <server>').description('Enable a server')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleEnable);

  mcpCmd.command('disable <server>').description('Disable a server')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(handleDisable);

  mcpCmd.command('check [server]').description('Check env vars')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('--all', 'Check all installed')
    .action(handleCheck);

  mcpCmd.command('add <name> <command>').description('Add custom server')
    .option('-a, --args <args>', 'Arguments (comma-separated)')
    .option('-c, --category <category>', 'Category', 'other')
    .option('-d, --description <description>', 'Description')
    .option('-e, --env <env>', 'Env vars (KEY=${VAR})')
    .option('-r, --required-env <vars>', 'Required env vars')
    .action(handleAdd);

  mcpCmd.command('setup').description('Setup ralph MCP servers')
    .option('-p, --project <path>', 'Project path')
    .action(handleSetup);
}

// Validation helpers
function validateName(name: string, field: string): boolean {
  if (!isValidName(name)) {
    console.log(chalk.red(`Invalid ${field}: ${getNameValidationError(name, field)}`));
    return false;
  }
  return true;
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
function handleList(options: { project?: string; installed?: boolean; category?: string; enabled?: boolean }): void {
  const projectPath = options.project;

  if (options.installed || options.enabled) {
    const installed = listInstalledServers(projectPath);
    if (installed.length === 0) {
      console.log(chalk.gray('No MCP servers installed.'));
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

function handleShow(serverName: string, options: { project?: string }): void {
  const server = getServer(serverName);
  if (!server) {
    console.log(chalk.red(`Server not found: ${serverName}`));
    return;
  }
  printServerDetails(
    server,
    isServerInstalled(server.name, options.project),
    isServerEnabled(server.name, options.project),
    getMcpConfigPath(options.project)
  );
}

function handleInstall(serverName: string, options: { project: string; category?: string; skipEnvCheck?: boolean }): void {
  if (!validateName(serverName, 'server name')) return;
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  if (options.category) {
    const servers = listServers({ category: options.category as MCPServerCategory });
    if (servers.length === 0) {
      console.log(chalk.red(`No servers in category: ${options.category}`));
      return;
    }
    console.log(chalk.blue(`Installing ${servers.length} servers...\n`));
    for (const server of servers) {
      const result = installServer(server.name, { skipEnvCheck: options.skipEnvCheck, projectPath });
      console.log(result.success ? chalk.green(`  ✓ ${server.name}`) : chalk.red(`  ✗ ${server.name}`));
    }
  } else {
    const result = installServer(serverName, { skipEnvCheck: options.skipEnvCheck, projectPath });
    console.log(result.success ? chalk.green(result.message) : chalk.red(result.message));
  }
}

function handleUninstall(serverName: string, options: { project: string }): void {
  if (!validateName(serverName, 'server name')) return;
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  const result = uninstallServer(serverName, projectPath);
  console.log(result.success ? chalk.green(result.message) : chalk.red(result.message));
}

function handleEnable(serverName: string, options: { project: string }): void {
  if (!validateName(serverName, 'server name')) return;
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  const result = enableServer(serverName, projectPath);
  console.log(result.success ? chalk.green(result.message) : chalk.red(result.message));
}

function handleDisable(serverName: string, options: { project: string }): void {
  if (!validateName(serverName, 'server name')) return;
  const projectPath = validatePath(options.project);
  if (!projectPath) return;

  const result = disableServer(serverName, projectPath);
  console.log(result.success ? chalk.green(result.message) : chalk.red(result.message));
}

function handleCheck(serverName: string | undefined, options: { project: string; all?: boolean }): void {
  if (options.all || !serverName) {
    const results = checkAllServers(options.project);
    if (results.length === 0) {
      console.log(chalk.gray('No installed servers to check.'));
      return;
    }
    printEnvCheckResults(results);
  } else {
    const result = checkServer(serverName);
    if (result.ok) {
      console.log(chalk.green(`✓ ${serverName}: All env vars set`));
    } else {
      console.log(chalk.red(`✗ ${serverName}: Missing ${result.missing.join(', ')}`));
    }
  }
}

function handleAdd(name: string, command: string, options: {
  args?: string; category: string; description?: string; env?: string; requiredEnv?: string;
}): void {
  ensureRegistryDir();

  const server: MCPServerDefinition = {
    name, command, type: 'stdio',
    category: options.category as MCPServerCategory,
    source: 'custom',
    description: options.description
  };

  if (options.args) server.args = options.args.split(',').map(a => a.trim());
  if (options.env) {
    server.env = {};
    for (const pair of options.env.split(',')) {
      const [key, value] = pair.split('=');
      if (key && value) server.env[key.trim()] = value.trim();
    }
  }
  if (options.requiredEnv) server.requiredEnv = options.requiredEnv.split(',').map(v => v.trim());

  addServerToRegistry(server);
  console.log(chalk.green(`Added server: ${name}`));
}

async function handleSetup(options: { project?: string }): Promise<void> {
  const path = await import('path');
  const projectDir = options.project || process.cwd();
  const mcpPath = path.join(projectDir, '.mcp.json');

  let mcpConfig: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };
  if (fs.existsSync(mcpPath)) {
    try {
      mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
    } catch { mcpConfig = { mcpServers: {} }; }
  }

  const currentFileUrl = new URL(import.meta.url);
  const currentDir = new URL('.', currentFileUrl).pathname;
  const baseDir = path.resolve(currentDir, '..', '..', '..', '..');

  const geminiPath = path.join(baseDir, 'mcp-servers', 'gemini-reviewer', 'index.js');
  if (fs.existsSync(geminiPath)) {
    mcpConfig.mcpServers!['gemini-reviewer'] = {
      type: 'stdio', command: 'node', args: [geminiPath],
      env: { GEMINI_API_KEY: process.env.GEMINI_API_KEY || '' }
    };
    console.log(chalk.green(`  ✓ Added: gemini-reviewer`));
  }

  const qodanaPath = path.join(baseDir, 'mcp-servers', 'qodana', 'dist', 'index.js');
  if (fs.existsSync(qodanaPath)) {
    mcpConfig.mcpServers!['qodana'] = { type: 'stdio', command: 'node', args: [qodanaPath] };
    console.log(chalk.green(`  ✓ Added: qodana`));
  }

  fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));
  console.log(chalk.green(`\nCreated: ${mcpPath}`));
}
