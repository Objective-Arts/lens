/**
 * Terminal display utilities.
 *
 * Following rams: less but better, minimal decoration.
 * Following ive: depth through position, not visual noise.
 * Following kruzeniski: type as interface, hierarchy through text weight/color.
 * Following norman: feedback and mental models, show system state clearly.
 */

import chalk from 'chalk';
import { SkillDetection, StageStatus } from '../types.js';

/** Stage icons */
const STAGE_ICONS: Record<string, string> = {
  plan: '\ud83d\udcdd',      // 📝
  build: '\ud83d\udee0\ufe0f', // 🛠️
  refactor: '\u2728',        // ✨
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

/** All pipeline stage names in execution order */
const PIPELINE_STAGES = ['plan', 'build', 'refactor', 'test', 'review', 'doc'] as const;

/**
 * Print pipeline progress showing current position in stage sequence.
 * Following duarte: motion is meaning, progress shows movement.
 */
export function printPipelineProgress(
  stageStatus: Map<string, StageStatus>,
  currentStage?: string
): void {
  const parts = PIPELINE_STAGES.map(name => {
    const status = stageStatus.get(name);
    if (status === 'done') return chalk.green(`✓ ${name}`);
    if (status === 'failed') return chalk.red(`✗ ${name}`);
    if (status === 'skipped') return chalk.dim(`- ${name}`);
    if (name === currentStage || status === 'running') return chalk.cyan(`▸ ${name}`);
    return chalk.dim(name);
  });

  console.log(`  ${parts.join(chalk.dim(' → '))}`);
}

/**
 * Print the item header (primary visual hierarchy).
 * Following kruzeniski: type hierarchy through weight and color alone.
 */
export function printItemHeader(
  itemNum: number,
  total: number,
  itemText: string,
  stageStatus?: Map<string, StageStatus>
): void {
  console.log('');
  console.log(chalk.cyan('━'.repeat(84)));
  console.log(chalk.cyan.bold(`  Item ${itemNum} of ${total}: ${itemText}`));
  if (stageStatus) {
    printPipelineProgress(stageStatus);
  }
  console.log(chalk.cyan('━'.repeat(84)));
}

/**
 * Print stage header (secondary visual hierarchy).
 * Minimal design following rams/ive principles.
 * Shows stage position and skill detection reasoning.
 */
export function printStageHeader(
  stage: string,
  detection: SkillDetection,
  stageIndex?: number,
  totalStages?: number
): void {
  const icon = STAGE_ICONS[stage] || '\u25cf'; // ●
  const progress = (stageIndex !== undefined && totalStages !== undefined)
    ? chalk.dim(` (${stageIndex + 1}/${totalStages})`)
    : '';

  console.log('');
  console.log(chalk.dim('─'.repeat(84)));
  // Add external tool indicator for review stage
  const externalTools = stage === 'review' ? chalk.dim(' (Gemini + Qodana)') : '';
  console.log(`  ${icon}  ${chalk.cyan(capitalize(stage))}${progress}${externalTools}`);

  if (detection.skills.length > 0) {
    const skillList = detection.skills.map(s => chalk.green(s)).join(' ');
    console.log(`      Canon: ${skillList}`);

    // Show detection keywords to explain WHY these skills were selected
    if (detection.keywords.length > 0) {
      const kwList = detection.keywords.slice(0, 5).join(', ');
      console.log(chalk.dim(`             (detected: ${kwList})`));
    }
  }

  console.log('');
}

/**
 * Legacy overload for backward compatibility.
 * @deprecated Use the SkillDetection overload instead
 */
export function printStageHeaderLegacy(stage: string, skills: string[]): void {
  printStageHeader(stage, { skills, keywords: [] });
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

/**
 * Print summary link at end of run.
 * Following norman: feedback, show what user can do next.
 */
export function printSummaryLink(summaryPath: string): void {
  console.log('');
  console.log(chalk.dim('─'.repeat(84)));
  console.log(`  ${chalk.cyan('📊')} Summary: ${chalk.underline(`file://${summaryPath}`)}`);
  console.log(chalk.dim('─'.repeat(84)));
}
