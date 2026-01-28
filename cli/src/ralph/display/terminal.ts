/**
 * Terminal display utilities.
 *
 * Following rams: less but better, minimal decoration.
 * Following ive: depth through position, not visual noise.
 */

import chalk from 'chalk';

/** Stage icons */
const STAGE_ICONS: Record<string, string> = {
  scaffold: '\u2699\ufe0f',  // ⚙️
  plan: '\ud83d\udcdd',      // 📝
  build: '\ud83d\udee0\ufe0f', // 🛠️
  clean: '\u2728',           // ✨
  test: '\ud83e\uddea',      // 🧪
  review: '\ud83d\udc41\ufe0f', // 👁️
  doc: '\ud83d\udcda',       // 📚
};

/** ANSI escape for dim text */
const DIM = '\x1b[2m';
const NC = '\x1b[0m';

/**
 * Print the ralph header.
 */
export function printHeader(prdPath: string, remaining: number, projectType: string): void {
  console.log(`${chalk.cyan('Ralph')} — ${prdPath}`);
  console.log(chalk.dim(`${remaining} items remaining | ${projectType || 'Unknown project'}`));
  console.log(chalk.dim('Skills: from profile (.claude/ralph-config.yaml)'));
}

/**
 * Print the item header (primary visual hierarchy).
 */
export function printItemHeader(itemNum: number, total: number, itemText: string): void {
  console.log('');
  console.log(chalk.cyan('━'.repeat(84)));
  console.log(chalk.cyan.bold(`  Item ${itemNum} of ${total}: ${itemText}`));
  console.log(chalk.cyan('━'.repeat(84)));
}

/**
 * Print stage header (secondary visual hierarchy).
 * Minimal design following rams/ive principles.
 */
export function printStageHeader(stage: string, skills: string[]): void {
  const icon = STAGE_ICONS[stage] || '\u25cf'; // ●

  console.log('');
  console.log(chalk.dim('─'.repeat(84)));
  console.log(`  ${icon}  ${chalk.cyan(capitalize(stage))}`);

  if (skills.length > 0) {
    const skillList = skills.map(s => chalk.green(s)).join(' ');
    console.log(`      Canon: ${skillList}`);
  }

  console.log('');
}

/**
 * Print stage completion.
 */
export function printStageComplete(stage: string, durationSec: number, message?: string): void {
  const icon = STAGE_ICONS[stage] || '\u2713';
  const time = formatDuration(durationSec);
  const suffix = message ? ` - ${message}` : '';
  console.log(`  ${chalk.green('\u2713')} ${capitalize(stage)} done (${time})${suffix}`);
}

/**
 * Print stage failure.
 */
export function printStageFailed(stage: string, error: string): void {
  console.log(`  ${chalk.red('\u2717')} ${capitalize(stage)} failed: ${error}`);
}

/**
 * Print stage skipped.
 */
export function printStageSkipped(stage: string, reason: string): void {
  console.log(`  ${chalk.yellow('\u25cb')} ${capitalize(stage)} skipped: ${reason}`);
}

/**
 * Print item completion.
 */
export function printItemComplete(itemNum: number, remaining: number): void {
  console.log('');
  console.log(chalk.green(`  \u2713 Item ${itemNum} complete. ${remaining} remaining.`));
}

/**
 * Print final completion message.
 */
export function printAllComplete(): void {
  console.log('');
  console.log(chalk.green.bold('\u2713 All PRD items complete!'));
}

/**
 * Print error message.
 */
export function printError(message: string): void {
  console.error(chalk.red(`Error: ${message}`));
}

/**
 * Print warning message.
 */
export function printWarning(message: string): void {
  console.warn(chalk.yellow(`Warning: ${message}`));
}

/**
 * Print info message.
 */
export function printInfo(message: string): void {
  console.log(chalk.dim(message));
}

/**
 * Format duration in mm:ss.
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Capitalize first letter.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Spinner for long-running operations.
 */
export class Spinner {
  private frames = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];
  private current = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private message: string;

  constructor(message: string = 'Working...') {
    this.message = message;
  }

  start(): void {
    this.interval = setInterval(() => {
      process.stdout.write(`\r  ${chalk.dim(this.frames[this.current])} ${chalk.dim(this.message)}`);
      this.current = (this.current + 1) % this.frames.length;
    }, 80);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r' + ' '.repeat(this.message.length + 10) + '\r');
    }
  }

  update(message: string): void {
    this.message = message;
  }
}
