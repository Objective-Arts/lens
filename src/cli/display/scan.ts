/**
 * Scan summary display
 */

import chalk from 'chalk';
import { formatTokens } from '../../utils/tokens.js';
import type { ConfigItemType, ConfigScope, ScanResult } from '../../types.js';

function printScanLocations(result: ScanResult): void {
  console.log(`\n${chalk.cyan('Locations:')}`);
  console.log(`  Global: ${result.globalPath}`);
  if (result.projectPath) {
    console.log(`  Project: ${result.projectPath}`);
  }
}

function printScanCounts(summary: ScanResult['summary']): void {
  console.log(`\n${chalk.cyan('Items by Type:')}`);
  const types: ConfigItemType[] = ['skill', 'command', 'agent', 'memory', 'settings'];
  for (const type of types) {
    const count = summary.byType[type];
    if (count > 0) console.log(`  ${type.padEnd(10)} ${chalk.yellow(count.toString())}`);
  }

  console.log(`\n${chalk.cyan('Items by Scope:')}`);
  const scopes: ConfigScope[] = ['global', 'project', 'plugin'];
  for (const scope of scopes) {
    const count = summary.byScope[scope];
    const tokens = summary.tokensByScope[scope];
    if (count > 0) {
      console.log(`  ${scope.padEnd(10)} ${chalk.yellow(count.toString().padStart(3))} items, ${chalk.magenta(formatTokens(tokens).padStart(6))} tokens`);
    }
  }

  console.log(`\n${chalk.cyan('Total Tokens:')} ${chalk.bold.magenta(formatTokens(summary.totalTokens))}`);
}

function printScanWarnings(summary: ScanResult['summary']): void {
  if (summary.conflicts.length > 0) {
    console.log(`\n${chalk.yellow('⚠ Conflicts:')} ${summary.conflicts.length} items with same name in multiple scopes`);
  }
  if (summary.missingReferences.length > 0) {
    console.log(`${chalk.red('✗ Missing:')} ${summary.missingReferences.length} referenced items not found`);
  }
  if (summary.unusedItems.length > 0) {
    console.log(`${chalk.gray('○ Unused:')} ${summary.unusedItems.length} skills not referenced anywhere`);
  }
}

export function printScanSummary(result: ScanResult): void {
  console.log(chalk.bold('Configuration Summary'));
  console.log(chalk.gray('─'.repeat(50)));
  printScanLocations(result);
  printScanCounts(result.summary);
  printScanWarnings(result.summary);
}
