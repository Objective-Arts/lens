/**
 * Refactor-check phase - simplify and clean up, verify still works.
 *
 * Experts: kernighan, thompson, feathers, gang-of-four, pike
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';

const REFACTOR_PROMPT = `Review and refactor the implemented code.

PRD ITEM: {ITEM_TEXT}

Apply expert guidance from: {EXPERT_NAMES}

Refactoring principles:
- Simplify, remove unnecessary complexity (kernighan)
- Delete code that isn't needed (thompson)
- Safe refactoring through seams (feathers)
- Apply patterns where they clarify, not for their own sake (gang-of-four)
- Reduce interface size (pike)

Steps:
1. Review implemented code for clarity
2. Identify refactoring opportunities
3. Apply refactorings (one at a time, verify tests pass)
4. Run tests after each change

Do NOT add features. Only improve existing code clarity.

Output REFACTOR_COMPLETE when done, listing changes made.`;

export class RefactorCheckPhase extends BasePhase {
  readonly name = 'refactor-check' as const;
  readonly icon = '🧹';
  readonly description = 'Simplify and clean up, verify still works';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertNames = experts.map(s => s.name).join(', ');

    const prompt = REFACTOR_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_NAMES}', expertNames || 'none');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed('Refactor-check phase did not complete successfully');
    }

    return this.success('Refactoring complete');
  }
}
