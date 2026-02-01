/**
 * Phase interface and types.
 *
 * Following bloch: design for extension.
 * Following gang-of-four: Strategy pattern for phases.
 * Following liskov: substitutable phase implementations.
 */

import type { Session, PhaseName, Skill, PrdItem } from '../types.js';

/**
 * Result of phase execution.
 * Following cherny: discriminated union for exhaustive handling.
 */
export type PhaseResult =
  | { readonly status: 'success'; readonly message: string; readonly metrics?: Readonly<Record<string, number>>; readonly rawOutput?: string }
  | { readonly status: 'failed'; readonly error: string }
  | { readonly status: 'skipped'; readonly reason: string };

/**
 * Context passed to each phase.
 * Following pike: minimal interface, only what's needed.
 */
export interface PhaseContext {
  readonly session: Session;
  readonly item: PrdItem;
  readonly experts: readonly Skill[];
  readonly projectPath: string;
  readonly logsDir: string;
  /** Corrective prompt for retry attempts after validation failure. Mutable for retry logic. */
  correctivePrompt?: string;
}

/**
 * Phase interface - implemented by each phase.
 * Following Strategy pattern: uniform interface, different implementations.
 * Following liskov: any Phase can be substituted for another.
 */
export interface Phase {
  /** Phase name matching PhaseName type */
  readonly name: PhaseName;

  /** Phase icon for terminal display */
  readonly icon: string;

  /** Human-readable description */
  readonly description: string;

  /**
   * Execute the phase.
   *
   * @param context - Execution context
   * @returns Promise resolving to phase result
   */
  execute(context: PhaseContext): Promise<PhaseResult>;

  /**
   * Check if this phase should run.
   * Some phases may be skipped based on context.
   */
  shouldRun(context: PhaseContext): boolean;
}

/**
 * Base class for phases with common functionality.
 * Following gang-of-four: Template Method pattern.
 */
export abstract class BasePhase implements Phase {
  abstract readonly name: PhaseName;
  abstract readonly icon: string;
  abstract readonly description: string;

  abstract execute(context: PhaseContext): Promise<PhaseResult>;

  shouldRun(_context: PhaseContext): boolean {
    return true;
  }

  /**
   * Build the log prefix for this phase.
   */
  protected getLogPrefix(context: PhaseContext): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    return `item${context.item.lineNumber}_${timestamp}.${this.name}`;
  }

  /**
   * Build expert guidance string for prompts.
   * Each phase adds its own output format - this just provides the expert content.
   */
  protected buildExpertGuidance(experts: readonly Skill[]): string {
    if (experts.length === 0) {
      return '';
    }

    const expertNames = experts.map(s => s.name).join(', ');
    const guidance = experts.map(s => `## ${s.name}\n\n${this.extractCore(s.content)}`);

    return `\n\n---\n\nEXPERT GUIDANCE (${expertNames}):\n\n` + guidance.join('\n\n---\n\n');
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

  /**
   * Create a success result.
   */
  protected success(message: string, metrics?: Record<string, number>, rawOutput?: string): PhaseResult {
    return { status: 'success', message, metrics, rawOutput };
  }

  /**
   * Create a failed result.
   */
  protected failed(error: string): PhaseResult {
    return { status: 'failed', error };
  }

  /**
   * Create a skipped result.
   */
  protected skipped(reason: string): PhaseResult {
    return { status: 'skipped', reason };
  }
}

/**
 * Phase status for pipeline progress display.
 */
export type PhaseStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';
