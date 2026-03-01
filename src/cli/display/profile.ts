/**
 * Profile display helpers
 */

import chalk from 'chalk';

export function printList(
  title: string,
  items: string[],
  color: typeof chalk.green,
  icon: string
): void {
  if (items.length === 0) return;
  console.log(color(`\n${title}:`));
  items.forEach(item => console.log(color(`  ${icon} ${item}`)));
}

export function printProfileNotFound(profileName: string, available: string[]): void {
  console.log(chalk.red(`Profile not found: ${profileName}`));
  console.log(chalk.gray(`Available: ${available.join(', ')}`));
}
