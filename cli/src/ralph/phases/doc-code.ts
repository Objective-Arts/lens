/**
 * Doc-code phase - document the completed work.
 *
 * Experts: procida, strunk-white, zinsser, king
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';

const DOC_PROMPT = `Document the implemented feature.

PRD ITEM: {ITEM_TEXT}

Apply expert guidance from: {EXPERT_NAMES}

Documentation principles:
- Diátaxis framework: tutorial/how-to/reference/explanation (procida)
- Omit needless words (strunk-white)
- Clarity and simplicity (zinsser)
- Kill your darlings - remove fluff (king)

Documentation to create/update:
1. Code comments - only where logic isn't self-evident
2. README updates - if feature affects usage
3. API docs - for public interfaces (JSDoc/TSDoc)
4. CHANGELOG entry - if significant

Do NOT over-document. Good code is self-documenting.
Only add docs where they provide value.

Output DOC_COMPLETE when done.`;

export class DocCodePhase extends BasePhase {
  readonly name = 'doc-code' as const;
  readonly icon = '📚';
  readonly description = 'Document the completed work';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertNames = experts.map(s => s.name).join(', ');

    const prompt = DOC_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_NAMES}', expertNames || 'none');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed('Doc-code phase did not complete successfully');
    }

    return this.success('Documentation complete');
  }
}
