/**
 * Phase interface and types.
 *
 * Following java: design for extension.
 * Following design-patterns: Strategy pattern for phases.
 * Following abstraction: substitutable phase implementations.
 */

import type { Session, PhaseName, Skill, PrdItem } from '../types.js';

/**
 * Result of phase execution.
 * Following typescript: discriminated union for exhaustive handling.
 */
export type PhaseResult =
  | { readonly status: 'success'; readonly message: string; readonly metrics?: Readonly<Record<string, number>>; readonly rawOutput?: string }
  | { readonly status: 'failed'; readonly error: string }
  | { readonly status: 'skipped'; readonly reason: string };

/**
 * Context passed to each phase.
 * Following simplicity: minimal interface, only what's needed.
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
 * Following abstraction: any Phase can be substituted for another.
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
 * Following design-patterns: Template Method pattern.
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
   * Build expert guidance from SUMMARY.md content with enforcement checklists.
   */
  protected buildExpertGuidance(experts: readonly Skill[]): string {
    if (experts.length === 0) {
      return '';
    }

    const expertNames = experts.map(s => s.name).join(', ');

    const guidance = experts.map(s => {
      const body = s.summary || this.stripFrontmatter(s.content);
      return `## ${s.name}\n\n${body}`;
    });

    const checklistSection = this.buildEnforcementChecklist(experts);

    return `\n\n---\n\nEXPERT GUIDANCE (${expertNames}):\n\n`
      + guidance.join('\n\n---\n\n')
      + checklistSection;
  }

  /**
   * Build enforcement checklist — hard pass/fail gates from expert checklists.
   */
  private buildEnforcementChecklist(experts: readonly Skill[]): string {
    const allItems: string[] = [];

    for (const expert of experts) {
      if (expert.checklist.length > 0) {
        for (const item of expert.checklist) {
          allItems.push(`- [${expert.name}] ${item}`);
        }
      }
    }

    if (allItems.length === 0) return '';

    return `\n\n---\n\n## ENFORCEMENT CHECKLIST (PASS/FAIL — NOT OPTIONAL)\n\n`
      + `Your code MUST pass ALL of these checks. If any check fails, your output is rejected.\n\n`
      + allItems.join('\n')
      + `\n\nFor each item in APPLIED:, cite the specific checklist item it satisfies.`
      + ` Generic claims like "applied clarity principles" will be rejected.\n`;
  }

  /** Strip YAML frontmatter. */
  private stripFrontmatter(content: string): string {
    const lines = content.split('\n');
    if (lines[0]?.trim() === '---') {
      const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
      if (endIdx > 0) {
        return lines.slice(endIdx + 1).join('\n').trim();
      }
    }
    return content.trim();
  }

  /** Validate APPLIED section has concrete, per-expert decisions. Returns error or null. */
  protected validateAppliedPrinciples(output: string, experts: readonly Skill[]): string | null {
    if (experts.length === 0) return null;

    const appliedMatch = output.match(/APPLIED:\s*\n([\s\S]*?)(?=\n[A-Z_]+(?:_COMPLETE)?|\s*$)/i);
    if (!appliedMatch) {
      return 'Missing APPLIED section. You must cite which expert principles you applied.';
    }

    const appliedText = appliedMatch[1];
    const appliedLines = appliedText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim());

    if (appliedLines.length === 0) {
      return 'APPLIED section is empty. Each loaded expert must have a specific decision cited.';
    }

    const expertNames = experts.map(s => s.name);
    const missingExperts = expertNames.filter(name =>
      !appliedLines.some(line => line.toLowerCase().includes(name.toLowerCase()))
    );

    if (missingExperts.length > 0) {
      return `APPLIED section missing decisions for: ${missingExperts.join(', ')}. `
        + `Each expert must have a specific decision (not generic claims).`;
    }

    const genericPatterns = [
      /applied .* principles?$/i,
      /followed .* guidance$/i,
      /used .* best practices$/i,
      /considered .* approach$/i,
    ];
    const genericLines = appliedLines.filter(line =>
      genericPatterns.some(p => p.test(line))
    );
    if (genericLines.length > 0) {
      return `APPLIED section contains generic claims: "${genericLines[0]}". `
        + `Cite specific decisions (e.g., "clarity: used early returns to flatten nesting in parseConfig").`;
    }

    return null;
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
