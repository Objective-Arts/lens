/**
 * Canon display helpers
 *
 * Extracted from cli/index.ts for single responsibility (Pike)
 * Pure display functions - no side effects except console output (Dijkstra)
 */

import chalk from 'chalk';
import type { CanonListItem, SkillStatusInfo } from '../../canon/types.js';

/** Print canon skills grouped by category */
export function printCanonSkillsByCategory(
  skills: CanonListItem[],
  sourceInfo: { path: string; commit?: string }
): void {
  console.log(chalk.bold('\nAvailable Canon Skills'));
  console.log(chalk.gray(`Source: ${sourceInfo.path}`));
  if (sourceInfo.commit) {
    console.log(chalk.gray(`Commit: ${sourceInfo.commit}`));
  }
  console.log(chalk.gray('─'.repeat(50)));

  const byCategory = groupByCategory(skills);

  for (const [category, categorySkills] of byCategory) {
    console.log(chalk.yellow(`\n  ${category.toUpperCase()}`));
    for (const skill of categorySkills) {
      console.log(`    ${chalk.cyan(skill.name)}`);
    }
  }

  console.log(chalk.gray(`\nTotal: ${skills.length} skills`));
}

/** Group skills by category */
function groupByCategory(skills: CanonListItem[]): Map<string, CanonListItem[]> {
  const byCategory = new Map<string, CanonListItem[]>();
  for (const skill of skills) {
    const cat = skill.category || 'root';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(skill);
  }
  return byCategory;
}

/** Status icons for skill statuses */
const STATUS_ICONS: Record<string, (text: string) => string> = {
  current: (t: string) => chalk.green(t),
  outdated: (t: string) => chalk.yellow(t),
  modified: (t: string) => chalk.blue(t),
  missing: (t: string) => chalk.red(t),
  unknown: (t: string) => chalk.gray(t)
};

const STATUS_LABELS: Record<string, string> = {
  current: '✓ current',
  outdated: '⚠ outdated',
  modified: '✎ modified',
  missing: '✗ missing',
  unknown: '? unknown'
};

/** Print skill status list */
export function printSkillStatuses(
  statuses: SkillStatusInfo[],
  sourceInfo: { path: string; commit?: string },
  projectPath: string
): void {
  console.log(chalk.bold('\nCanon Skills Status'));
  console.log(chalk.gray(`Source: ${sourceInfo.path} @ ${sourceInfo.commit || 'unknown'}`));
  console.log(chalk.gray('─'.repeat(60)));

  for (const status of statuses) {
    const colorFn = STATUS_ICONS[status.status] || STATUS_ICONS.unknown;
    const label = STATUS_LABELS[status.status] || status.status;
    const commit = status.installedCommit ? chalk.gray(`(${status.installedCommit})`) : '';
    const arrow = status.status === 'outdated' && status.sourceCommit
      ? chalk.gray(` → ${status.sourceCommit}`)
      : '';
    console.log(`  ${status.name.padEnd(20)} ${colorFn(label)} ${commit}${arrow}`);
  }

  printStatusSummary(statuses, projectPath);
}

/** Print status summary with upgrade hints */
function printStatusSummary(statuses: SkillStatusInfo[], projectPath: string): void {
  const outdated = statuses.filter(s => s.status === 'outdated').length;
  const modified = statuses.filter(s => s.status === 'modified').length;

  if (outdated > 0) {
    console.log(chalk.yellow(`\nRun 'cc-config canon upgrade -p ${projectPath}' to update ${outdated} skill(s)`));
  }
  if (modified > 0) {
    console.log(chalk.blue(`\n${modified} skill(s) have local modifications`));
  }
}

/** Print verification results */
export function printVerifyResults(
  result: {
    matches: string[];
    differs: Array<{ name: string; reason: string }>;
    missingInProject: string[];
    extraInProject: string[];
    allMatch: boolean;
  },
  verbose: boolean
): void {
  if (result.differs.length > 0) {
    console.log(chalk.red(`Differs (${result.differs.length}):`));
    result.differs.forEach(d => console.log(chalk.red(`  ✗ ${d.name}: ${d.reason}`)));
    console.log();
  }

  if (result.missingInProject.length > 0) {
    console.log(chalk.yellow(`Missing in project (${result.missingInProject.length}):`));
    result.missingInProject.forEach(m => console.log(chalk.yellow(`  ? ${m}`)));
    console.log();
  }

  if (result.extraInProject.length > 0 && verbose) {
    console.log(chalk.gray(`Extra in project (${result.extraInProject.length} non-canon skills):`));
    result.extraInProject.forEach(e => console.log(chalk.gray(`  + ${e}`)));
    console.log();
  }

  if (verbose && result.matches.length > 0) {
    console.log(chalk.green(`Matches (${result.matches.length}):`));
    result.matches.forEach(m => console.log(chalk.green(`  ✓ ${m}`)));
    console.log();
  }

  printVerifySummary(result);
}

/** Print verification summary */
function printVerifySummary(result: {
  matches: string[];
  differs: Array<{ name: string; reason: string }>;
  missingInProject: string[];
  allMatch: boolean;
}): void {
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Matches:  ${chalk.green(result.matches.length.toString())}`);
  console.log(`Differs:  ${result.differs.length > 0 ? chalk.red(result.differs.length.toString()) : '0'}`);
  console.log(`Missing:  ${result.missingInProject.length > 0 ? chalk.yellow(result.missingInProject.length.toString()) : '0'}`);

  if (result.allMatch) {
    console.log(chalk.green('\n✓ All canon skills are identical to source!'));
  } else {
    console.log(chalk.yellow('\n⚠ Some skills differ from source. Run `cc-config canon deploy --force` to sync.'));
  }
}
