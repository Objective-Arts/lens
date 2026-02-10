/**
 * Profile display helpers
 *
 * Extracted from cli/index.ts for single responsibility (simplicity)
 * Pure display functions - no side effects except console output (correctness)
 */

import chalk from 'chalk';
import type { ComposableProfile } from '../../types.js';

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

/** Print dry-run preview of profile application */
export function printDryRun(profile: ComposableProfile, targetPath: string): void {
  console.log(chalk.yellow('DRY RUN - No changes will be made\n'));
  console.log(chalk.bold('Would apply:'));
  console.log(`  Profile: ${profile.name}`);
  console.log(`  Project: ${targetPath}`);

  if (profile.skills) {
    for (const [category, skills] of Object.entries(profile.skills)) {
      if (skills && skills.length > 0) {
        console.log(`  Skills (${category}): ${skills.join(', ')}`);
      }
    }
  }
  if (profile.claudeMd?.autoInvoke?.length) {
    console.log(`  Auto-invoke rules: ${profile.claudeMd.autoInvoke.length}`);
  }
}

export function printDeployedSkills(skillNames: string[], columns: number = 4): void {
  const sorted = skillNames.sort();
  for (let i = 0; i < sorted.length; i += columns) {
    const row = sorted.slice(i, i + columns).map(s => s.padEnd(20)).join('');
    console.log(chalk.gray(`    ${row}`));
  }
}

export function printApplyResults(
  result: { created: string[]; linked: string[]; skipped: string[]; errors: string[] }
): void {
  // Filter out skill copies from "Linked" since deployAllSkills will show them
  const nonSkillLinked = result.linked.filter(item => !item.includes('(copied from'));
  printList('Created', result.created, chalk.green, '+');
  printList('Linked', nonSkillLinked, chalk.cyan, '→');
  printList('Skipped', result.skipped, chalk.gray, '-');
  printList('Errors', result.errors, chalk.red, '✗');
}

export function printProfileNotFound(profileName: string, available: string[]): void {
  console.log(chalk.red(`Profile not found: ${profileName}`));
  console.log(chalk.gray(`Available: ${available.join(', ')}`));
}
