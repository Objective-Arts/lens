/**
 * Scan commands - discover Claude Code configuration
 * Following clarity: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { scan } from '../../scanner/index.js';
import {
  printScanSummary,
  printItemList,
  printItemDetails,
  printAuditReport,
  printTokenBreakdown,
  printDependencies
} from '../display/index.js';

export function registerScanCommands(program: Command): void {
  program
    .command('scan')
    .description('Scan and discover all Claude Code configuration')
    .option('-p, --project <path>', 'Project path to scan', process.cwd())
    .option('--no-plugins', 'Skip scanning plugins')
    .action(async (options) => {
      console.log(chalk.blue('Scanning Claude Code configuration...\n'));
      const result = await scan({
        projectPath: options.project,
        includePlugins: options.plugins
      });
      printScanSummary(result);
    });

  program
    .command('list [type]')
    .description('List configuration items')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-s, --scope <scope>', 'Filter by scope (global, project, plugin)')
    .option('--tokens', 'Sort by token count')
    .action(async (type, options) => {
      const result = await scan({ projectPath: options.project });
      let items = result.items;

      if (type) items = items.filter(i => i.type === type);
      if (options.scope) items = items.filter(i => i.scope === options.scope);

      items.sort(options.tokens
        ? (a, b) => b.tokens - a.tokens
        : (a, b) => a.name.localeCompare(b.name));

      printItemList(items, result.summary.totalTokens);
    });

  program
    .command('show <name>')
    .description('Show details of a configuration item')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (name, options) => {
      const result = await scan({ projectPath: options.project });
      const item = result.items.find(i => i.name === name);

      if (!item) {
        console.log(chalk.red(`Item not found: ${name}`));
        console.log(chalk.gray('Available items:'));
        result.items.forEach(i => console.log(chalk.gray(`  - ${i.name} (${i.type})`)));
        return;
      }
      printItemDetails(item, result);
    });

  program
    .command('audit')
    .description('Run configuration audit')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (options) => {
      const result = await scan({ projectPath: options.project });
      printAuditReport(result);
    });

  program
    .command('tokens')
    .description('Show token usage breakdown')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (options) => {
      const result = await scan({ projectPath: options.project });
      printTokenBreakdown(result);
    });

  program
    .command('deps')
    .description('Show dependency graph')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .action(async (options) => {
      const result = await scan({ projectPath: options.project });
      printDependencies(result);
    });
}
