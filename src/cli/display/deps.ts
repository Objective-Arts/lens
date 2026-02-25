/**
 * Dependency graph display
 */

import chalk from 'chalk';
import { formatTokens } from '../../utils/tokens.js';
import type { ScanResult } from '../../types.js';

function printClaudeMdDeps(claudeMds: ScanResult['claudeMds'], items: ScanResult['items']): void {
  for (const claudeMd of claudeMds) {
    console.log(`\n${chalk.cyan(claudeMd.path)}`);

    if (claudeMd.autoInvokes.length > 0) {
      console.log(chalk.gray('  Auto-invoke rules:'));
      for (const ai of claudeMd.autoInvokes) {
        const status = items.some(i => i.name === ai.skillName) ? chalk.green('✓') : chalk.red('✗');
        console.log(`    ${status} ${ai.context} → /${ai.skillName}`);
      }
    }

    if (claudeMd.skillReferences.length > 0) {
      console.log(chalk.gray('  Skill references:'));
      for (const skill of claudeMd.skillReferences) {
        const item = items.find(i => i.name === skill);
        const detail = item ? `${item.scope}, ${formatTokens(item.tokens)}` : 'not found';
        const icon = item ? chalk.green('✓') : chalk.red('✗');
        console.log(`    ${icon} ${skill} (${detail})`);
      }
    }
  }
}

function printItemDeps(items: ScanResult['items']): void {
  const withDeps = items.filter(i => i.dependencies.length > 0 || i.referencedBy.length > 0);
  if (withDeps.length === 0) return;

  console.log(`\n${chalk.cyan('Items with dependencies:')}`);
  for (const item of withDeps) {
    console.log(`\n  ${chalk.bold(item.name)} (${item.type})`);
    if (item.dependencies.length > 0) {
      console.log(`    depends on: ${item.dependencies.join(', ')}`);
    }
    if (item.referencedBy.length > 0) {
      console.log(`    used by: ${item.referencedBy.join(', ')}`);
    }
  }
}

export function printDependencies(result: ScanResult): void {
  console.log(chalk.bold('\nDependency Graph'));
  console.log(chalk.gray('═'.repeat(50)));
  printClaudeMdDeps(result.claudeMds, result.items);
  printItemDeps(result.items);
}
