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

/** Stage icons - matches PHASE_ORDER in phases/index.ts */
const STAGE_ICONS: Record<string, string> = {
  'plan': '📝',
  'structure-first': '🏗️',
  'implement': '🛠️',
  'build-tests': '🧪',
  'refactor-check': '🧹',
  'adversarial-review': '🔒',
  'static-analysis': '📊',
  'doc-code': '📚',
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

/** All pipeline stage names in execution order - matches PHASE_ORDER */
const PIPELINE_STAGES = [
  'plan', 'structure-first', 'implement', 'build-tests',
  'refactor-check', 'adversarial-review', 'static-analysis', 'doc-code'
] as const;

/** Short display names for pipeline progress */
const STAGE_SHORT_NAMES: Record<string, string> = {
  'plan': 'plan',
  'structure-first': 'structure',
  'implement': 'build',
  'build-tests': 'test',
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

/**
 * Print stage header with three-part structure:
 * 1. Canon - principles listed horizontally
 * 2. Skills - loaded skills
 * 3. (Usage printed at stage end via printStageUsage)
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
  // Add external tool indicator for review stages
  const externalTools = (stage === 'adversarial-review' || stage === 'static-analysis')
    ? chalk.dim(' (self-review)')
    : '';
  console.log(`  ${icon}  ${chalk.cyan(capitalize(stage))}${progress}${externalTools}`);

  if (detection.skills.length > 0) {
    // 1. Skills listed horizontally
    const skillList = detection.skills.join(' ');
    console.log(`      ${chalk.dim('Skills:')} ${skillList}`);

    // 2. Loaded confirmation
    console.log(`      ${chalk.green('✓')} ${detection.skills.length} skills loaded`);
  }

  console.log('');
}

/**
 * Parse APPLIED section from Claude's output.
 * Handles:
 * - Standard format: "- expert: description"
 * - Bold format: "- **expert**: description"
 * - Multi-line descriptions (continued lines don't start with - or •)
 */
export function parseAppliedSection(rawOutput: string): string[] {
  const lines: string[] = [];

  // Find APPLIED section - stop at next section marker or double newline
  const appliedMatch = rawOutput.match(/APPLIED:\s*([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z_]+:|\n```|$)/);
  if (!appliedMatch) return lines;

  const appliedBlock = appliedMatch[1].trim();
  let currentLine = '';

  for (const line of appliedBlock.split('\n')) {
    const trimmed = line.trim();

    // Skip empty lines and section markers
    if (!trimmed || /^[A-Z_]+:/.test(trimmed) || trimmed.startsWith('```')) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      continue;
    }

    // New bullet point
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (currentLine) {
        lines.push(currentLine);
      }
      // Remove bullet, normalize **bold** markers
      currentLine = trimmed.slice(1).trim().replace(/\*\*/g, '');
    } else if (currentLine) {
      // Continuation of previous line - append with space
      currentLine += ' ' + trimmed;
    }
  }

  // Don't forget the last line
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Print how skills were actually applied (substantive usage).
 * Wraps long lines to fit terminal width.
 */
export function printAppliedSkills(rawOutput: string | undefined): void {
  if (!rawOutput) return;

  const applied = parseAppliedSection(rawOutput);
  if (applied.length === 0) return;

  const maxWidth = Math.min(process.stdout.columns || 80, 100) - 12; // 12 = indent

  console.log(`      ${chalk.dim('Applied:')}`);
  for (const line of applied) {
    // Wrap long lines
    if (line.length <= maxWidth) {
      console.log(`        ${chalk.yellow('•')} ${line}`);
    } else {
      // First line with bullet
      const words = line.split(' ');
      let currentLine = '';
      let isFirst = true;

      for (const word of words) {
        if (currentLine.length + word.length + 1 <= maxWidth) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          // Print current line and start new one
          const prefix = isFirst ? `        ${chalk.yellow('•')} ` : '          ';
          console.log(prefix + currentLine);
          currentLine = word;
          isFirst = false;
        }
      }
      // Print remaining
      if (currentLine) {
        const prefix = isFirst ? `        ${chalk.yellow('•')} ` : '          ';
        console.log(prefix + currentLine);
      }
    }
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
