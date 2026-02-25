/**
 * Scan commands - discover Claude Code configuration
 * Following clarity: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { scan } from '../../scanner/index.js';
import { validateProjectPath } from '../../utils/validation.js';
import {
  printScanSummary,
  printItemList,
  printItemDetails,
  printAuditReport,
  printTokenBreakdown,
  printDependencies
} from '../display/index.js';

function resolveProjectPath(rawPath: string): string | null {
  return validateProjectPath(rawPath);
}

function withValidProject(options: {project: string}, action: (projectPath: string) => Promise<void>): Promise<void> | undefined {
  const projectPath = resolveProjectPath(options.project);
  if (!projectPath) {
    console.error(chalk.red(`Invalid project path: ${options.project}`));
    process.exitCode = 1;
    return;
  }
  return action(projectPath);
}

export function registerScanCommands(program: Command): void {
  registerScanCommand(program);
  registerListCommand(program);
  registerShowCommand(program);
  registerAuditCommand(program);
  registerTokensCommand(program);
  registerDepsCommand(program);
}

function registerScanCommand(program: Command): void {
  program
    .command('scan')
    .description('Scan and discover all Claude Code configuration')
    .option('-p, --project <path>', 'Project path to scan', process.cwd())
    .option('--no-plugins', 'Skip scanning plugins')
    .action(async (options) => withValidProject(options, async (projectPath) => {
      console.log(chalk.blue('Scanning Claude Code configuration...\n'));
      const result = await scan({ projectPath, includePlugins: options.plugins });
      printScanSummary(result);
    }));
}

function registerListCommand(program: Command): void {
  program
    .command('list [type]')
    .description('List configuration items')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-s, --scope <scope>', 'Filter by scope (global, project, plugin)')
    .option('--tokens', 'Sort by token count')
    .action(async (type, options) => withValidProject(options, async (projectPath) => {
      const validTypes = ['skill', 'command', 'agent', 'memory', 'settings', 'hook', 'mcp'];
      const validScopes = ['global', 'project', 'plugin'];

      if (type && !validTypes.includes(type)) {
        console.error(chalk.red(`Unknown type: ${type}. Valid types: ${validTypes.join(', ')}`));
        process.exitCode = 1;
        return;
      }
      if (options.scope && !validScopes.includes(options.scope)) {
        console.error(chalk.red(`Unknown scope: ${options.scope}. Valid scopes: ${validScopes.join(', ')}`));
        process.exitCode = 1;
        return;
      }

      const result = await scan({ projectPath });
      let items = result.items;

      if (type) items = items.filter(i => i.type === type);
      if (options.scope) items = items.filter(i => i.scope === options.scope);

      items.sort(options.tokens
        ? (a, b) => b.tokens - a.tokens
        : (a, b) => a.name.localeCompare(b.name));

      printItemList(items, result.summary.totalTokens);
    }));
}

function registerShowCommand(program: Command): void {
  program
    .command('show <name>')
    .description('Show details of a configuration item')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (name, options) => withValidProject(options, async (projectPath) => {
      const result = await scan({ projectPath });
      const item = result.items.find(i => i.name === name);

      if (!item) {
        console.error(chalk.red(`Item not found: ${name}`));
        console.error(chalk.gray('Available items:'));
        result.items.forEach(i => console.error(chalk.gray(`  - ${i.name} (${i.type})`)));
        process.exitCode = 1;
        return;
      }
      printItemDetails(item, result);
    }));
}

function registerAuditCommand(program: Command): void {
  program
    .command('audit')
    .description('Run configuration audit')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (options) => withValidProject(options, async (projectPath) => {
      const result = await scan({ projectPath });
      printAuditReport(result);
    }));
}

function registerTokensCommand(program: Command): void {
  program
    .command('tokens')
    .description('Show token usage breakdown')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (options) => withValidProject(options, async (projectPath) => {
      const result = await scan({ projectPath });
      printTokenBreakdown(result);
    }));
}

function registerDepsCommand(program: Command): void {
  program
    .command('deps')
    .description('Show dependency graph')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (options) => withValidProject(options, async (projectPath) => {
      const result = await scan({ projectPath });
      printDependencies(result);
    }));
}
