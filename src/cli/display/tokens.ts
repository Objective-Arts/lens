/**
 * Token breakdown display
 */

import chalk from 'chalk';
import { formatTokens, tokenPercentage } from '../../utils/tokens.js';
import type { ConfigScope, ScanResult } from '../../types.js';

function createBar(value: number, max: number, width: number): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return chalk.magenta('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

export function printTokenBreakdown(scanReport: ScanResult): void {
  const { summary, items } = scanReport;

  console.log(chalk.bold('\nToken Usage Breakdown'));
  console.log(chalk.gray('═'.repeat(50)));

  console.log(`\nTotal: ${chalk.bold.magenta(formatTokens(summary.totalTokens))} tokens\n`);

  // By scope
  console.log(chalk.cyan('By Scope:'));
  const scopes: ConfigScope[] = ['global', 'project', 'plugin'];
  for (const scope of scopes) {
    const tokens = summary.tokensByScope[scope];
    if (tokens > 0) {
      const bar = createBar(tokens, summary.totalTokens, 30);
      console.log(`  ${scope.padEnd(10)} ${bar} ${formatTokens(tokens).padStart(6)} (${tokenPercentage(tokens, summary.totalTokens)})`);
    }
  }

  // By type
  console.log(`\n${chalk.cyan('By Type:')}`);
  const tokensByType: Record<string, number> = {};
  for (const item of items) tokensByType[item.type] = (tokensByType[item.type] || 0) + item.tokens;
  const sortedTypes = Object.entries(tokensByType).sort((a, b) => b[1] - a[1]);
  for (const [type, tokens] of sortedTypes) {
    const bar = createBar(tokens, summary.totalTokens, 30);
    console.log(`  ${type.padEnd(10)} ${bar} ${formatTokens(tokens).padStart(6)} (${tokenPercentage(tokens, summary.totalTokens)})`);
  }

  // Top items
  console.log(`\n${chalk.cyan('Top 10 Items by Token Count:')}`);
  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens).slice(0, 10);
  for (const item of sortedItems) {
    const bar = createBar(item.tokens, summary.totalTokens, 20);
    console.log(`  ${item.name.padEnd(20)} ${bar} ${formatTokens(item.tokens).padStart(6)} (${tokenPercentage(item.tokens, summary.totalTokens)})`);
  }
}
