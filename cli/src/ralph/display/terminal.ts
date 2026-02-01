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
import { parseAppliedSection } from './applied-parser.js';

// Re-export for backward compatibility
export { parseAppliedSection };

/** Stage icons - matches PHASE_ORDER in phases/index.ts */
const STAGE_ICONS: Record<string, string> = {
  'plan': '📝',
  'structure-first': '🏗️',
  'implement': '🛠️',
  'test': '🧪',
  'refactor-check': '🧹',
  'adversarial-review': '🔒',
  'static-analysis': '📊',
  'doc-code': '📚',
};

/**
 * Print the ralph header.
 */
export function printHeader(prdPath: string, remaining: number, projectType: string): void {
  console.log(`${chalk.cyan('Ralph')} — ${prdPath}`);
  console.log(chalk.dim(`${remaining} items remaining | ${projectType || 'Unknown project'}`));
  console.log(chalk.dim('Skills: from profile (.claude/ralph-config.yaml)'));
}

/** All pipeline stage names in execution order - matches PHASE_ORDER */
const PIPELINE_STAGES = [
  'plan', 'structure-first', 'implement', 'refactor-check',
  'adversarial-review', 'static-analysis', 'test', 'doc-code'
] as const;

/** Short display names for pipeline progress */
const STAGE_SHORT_NAMES: Record<string, string> = {
  'plan': 'plan',
  'structure-first': 'structure',
  'implement': 'implement',
  'test': 'test',
  'refactor-check': 'refactor',
  'adversarial-review': 'review',
  'static-analysis': 'scan',
  'doc-code': 'doc',
};

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
    const shortName = STAGE_SHORT_NAMES[name] || name;
    if (status === 'done') return chalk.green(`✓${shortName}`);
    if (status === 'failed') return chalk.red(`✗${shortName}`);
    if (status === 'skipped') return chalk.dim(`-${shortName}`);
    if (name === currentStage || status === 'running') return chalk.cyan(`▸${shortName}`);
    return chalk.dim(shortName);
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

/** External tool indicators for stages */
const EXTERNAL_TOOLS: Record<string, string> = {
  'adversarial-review': ' (+ Gemini)',
  'static-analysis': ' (+ Qodana)',
};

/** Format progress indicator */
function formatProgress(stageIndex?: number, totalStages?: number): string {
  return (stageIndex !== undefined && totalStages !== undefined)
    ? chalk.dim(` (${stageIndex + 1}/${totalStages})`)
    : '';
}

/** Print stage header with skills info */
export function printStageHeader(
  stage: string,
  detection: SkillDetection,
  stageIndex?: number,
  totalStages?: number
): void {
  const icon = STAGE_ICONS[stage] || '\u25cf';
  const progress = formatProgress(stageIndex, totalStages);
  const externalTools = EXTERNAL_TOOLS[stage] ? chalk.dim(EXTERNAL_TOOLS[stage]) : '';

  console.log('');
  console.log(chalk.dim('─'.repeat(84)));
  console.log(`  ${icon}  ${chalk.cyan(capitalize(stage))}${progress}${externalTools}`);

  if (detection.skills.length > 0) {
    console.log(`      ${chalk.dim('Skills:')} ${detection.skills.join(' ')}`);
    console.log(`      ${chalk.green('✓')} ${detection.skills.length} skills loaded`);
  }
  console.log('');
}


/**
 * Print how skills were actually applied (substantive usage).
 */
export function printAppliedSkills(rawOutput: string | undefined): void {
  if (!rawOutput) return;

  const applied = parseAppliedSection(rawOutput);
  if (applied.length === 0) return;

  console.log(`      ${chalk.dim('Principles Applied:')}`);
  for (const line of applied) {
    console.log(`        ${chalk.yellow('•')} ${line}`);
  }
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
 * Spinner for long-running operations with elapsed time display.
 */
export class Spinner {
  private frames = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];
  private current = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private message: string;
  private startTime: number = 0;
  private lastLineLength: number = 0;

  constructor(message: string = 'Working...') {
    this.message = message;
  }

  /** Format elapsed time as m:ss */
  private formatElapsed(): string {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  start(): void {
    this.startTime = Date.now();
    this.interval = setInterval(() => {
      const line = `\r  ${chalk.dim(this.frames[this.current])} ${chalk.dim(this.message)} ${chalk.dim(`(${this.formatElapsed()})`)}`;
      // Clear previous line if it was longer
      const clearPad = this.lastLineLength > line.length ? ' '.repeat(this.lastLineLength - line.length) : '';
      process.stdout.write(line + clearPad);
      this.lastLineLength = line.length;
      this.current = (this.current + 1) % this.frames.length;
    }, 80);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r' + ' '.repeat(this.lastLineLength + 10) + '\r');
    }
  }

  update(message: string): void {
    this.message = message;
  }

  /** Get elapsed time in seconds */
  getElapsedSeconds(): number {
    return (Date.now() - this.startTime) / 1000;
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
