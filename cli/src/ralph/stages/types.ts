/**
 * Stage interface and types.
 *
 * Following bloch: design for extension.
 * Following gang-of-four: Strategy pattern for stages.
 */

import { Session, StageResult, Skill, PrdItem } from '../types.js';

/**
 * Context passed to each stage.
 */
export interface StageContext {
  session: Session;
  item: PrdItem;
  skills: Skill[];
  projectPath: string;
  logsDir: string;
}

/**
 * Stage interface - implemented by each stage.
 * Following Strategy pattern: uniform interface, different implementations.
 */
export interface Stage {
  /** Stage name for display and logging */
  readonly name: string;

  /** Stage icon for terminal display */
  readonly icon: string;

  /**
   * Execute the stage.
   *
   * @param context - Execution context
   * @returns Promise resolving to stage result
   */
  execute(context: StageContext): Promise<StageResult>;

  /**
   * Check if this stage should run.
   * Some stages may be skipped based on context.
   */
  shouldRun(context: StageContext): boolean;
}

/**
 * Base class for stages with common functionality.
 * Following gang-of-four: Template Method pattern.
 */
export abstract class BaseStage implements Stage {
  abstract readonly name: string;
  abstract readonly icon: string;

  abstract execute(context: StageContext): Promise<StageResult>;

  shouldRun(_context: StageContext): boolean {
    return true;
  }

  /**
   * Build the log prefix for this stage.
   */
  protected getLogPrefix(context: StageContext): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    return `item${context.item.lineNumber}_${timestamp}.${this.name}`;
  }

  /**
   * Build skill guidance string for prompts.
   */
  protected buildSkillGuidance(skills: Skill[]): string {
    if (skills.length === 0) {
      return '';
    }

    const guidance = skills.map(s => `## ${s.name}\n\n${this.extractCore(s.content)}`);
    return '\n\n---\n\nCANON SKILLS:\n\n' + guidance.join('\n\n---\n\n');
  }

  /**
   * Extract core content from skill, skipping frontmatter.
   */
  private extractCore(content: string, maxLines: number = 50): string {
    const lines = content.split('\n');
    let start = 0;

    // Skip YAML frontmatter
    if (lines[0]?.trim() === '---') {
      const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
      if (endIdx > 0) {
        start = endIdx + 1;
      }
    }

    return lines.slice(start, start + maxLines).join('\n').trim();
  }
}

/**
 * Stage execution order.
 */
export const STAGE_ORDER = [
  'plan',
  'build',
  'refactor',
  'test',
  'review',
  'doc',
] as const;
