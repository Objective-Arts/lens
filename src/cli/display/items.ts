/**
 * Item list and detail display
 */

import chalk from 'chalk';
import { formatTokens, tokenPercentage } from '../../utils/tokens.js';
import type { ConfigItem, ConfigItemType, ConfigScope, ScanResult } from '../../types.js';

const scopeColors: Record<ConfigScope, typeof chalk.blue> = {
  global: chalk.blue,
  project: chalk.green,
  plugin: chalk.magenta
};

const typeIcons: Record<ConfigItemType, string> = {
  skill: '⚡',
  command: '/',
  agent: '🤖',
  memory: '📄',
  settings: '⚙️',
  mcp: '🔌'
};

export function printItemList(items: ConfigItem[], totalTokens: number): void {
  if (items.length === 0) {
    console.log(chalk.gray('No items found'));
    return;
  }

  console.log(chalk.bold(`\nFound ${items.length} items:\n`));

  for (const item of items) {
    const icon = typeIcons[item.type] || '•';
    const scopeColor = scopeColors[item.scope];
    const scopeLabel = scopeColor(`[${item.scope}]`.padEnd(10));
    const tokenPct = tokenPercentage(item.tokens, totalTokens);

    let name = item.name;
    if (item.isSymlink) {
      name += chalk.gray(' →');
    }

    console.log(
      `${icon} ${scopeLabel} ${name.padEnd(25)} ${chalk.magenta(formatTokens(item.tokens).padStart(6))} (${tokenPct})`
    );
  }
}

export function printItemDetails(configEntry: ConfigItem, scanReport: ScanResult): void {
  console.log(chalk.bold(`\n${configEntry.name}`));
  console.log(chalk.gray('─'.repeat(50)));

  console.log(`Type:     ${chalk.cyan(configEntry.type)}`);
  console.log(`Scope:    ${chalk.blue(configEntry.scope)}`);
  console.log(`Path:     ${chalk.gray(configEntry.path)}`);

  if (configEntry.isSymlink) {
    console.log(`Symlink:  ${chalk.yellow('→')} ${configEntry.symlinkTarget}`);
  }

  console.log(`Tokens:   ${chalk.magenta(formatTokens(configEntry.tokens))} (${tokenPercentage(configEntry.tokens, scanReport.summary.totalTokens)} of total)`);

  if (configEntry.metadata.description) {
    console.log(`\nDescription: ${configEntry.metadata.description}`);
  }

  if (configEntry.dependencies.length > 0) {
    console.log(`\n${chalk.cyan('Dependencies:')}`);
    configEntry.dependencies.forEach(dep => console.log(`  → ${dep}`));
  }

  if (configEntry.referencedBy.length > 0) {
    console.log(`\n${chalk.cyan('Referenced by:')}`);
    configEntry.referencedBy.forEach(ref => console.log(`  ← ${ref}`));
  }
}
