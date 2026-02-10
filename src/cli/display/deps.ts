/**
 * Dependency graph display
 */

import chalk from 'chalk';
import { formatTokens } from '../../utils/tokens.js';
import type { ScanResult } from '../../types.js';

export function printDependencies(result: ScanResult): void {
  console.log(chalk.bold('\nDependency Graph'));
  console.log(chalk.gray('═'.repeat(50)));

  for (const claudeMd of result.claudeMds) {
    console.log(`\n${chalk.cyan(claudeMd.path)}`);

    if (claudeMd.autoInvokes.length > 0) {
      console.log(chalk.gray('  Auto-invoke rules:'));
      for (const ai of claudeMd.autoInvokes) {
        const skillExists = result.items.some(i => i.name === ai.skillName);
        const status = skillExists ? chalk.green('✓') : chalk.red('✗');
        console.log(`    ${status} ${ai.context} → /${ai.skillName}`);
      }
    }

    if (claudeMd.skillReferences.length > 0) {
      console.log(chalk.gray('  Skill references:'));
      for (const skill of claudeMd.skillReferences) {
        const item = result.items.find(i => i.name === skill);
        if (item) {
          console.log(`    ${chalk.green('✓')} ${skill} (${item.scope}, ${formatTokens(item.tokens)})`);
        } else {
          console.log(`    ${chalk.red('✗')} ${skill} (not found)`);
        }
      }
    }
  }

  // Show items with dependencies
  const itemsWithDeps = result.items.filter(i => i.dependencies.length > 0 || i.referencedBy.length > 0);
  if (itemsWithDeps.length > 0) {
    console.log(`\n${chalk.cyan('Items with dependencies:')}`);
    for (const item of itemsWithDeps) {
      console.log(`\n  ${chalk.bold(item.name)} (${item.type})`);
      if (item.dependencies.length > 0) {
        console.log(`    depends on: ${item.dependencies.join(', ')}`);
      }
      if (item.referencedBy.length > 0) {
        console.log(`    used by: ${item.referencedBy.join(', ')}`);
      }
    }
  }
}
