/**
 * Doc-code phase - document the completed work.
 *
 * Experts: procida, strunk-white, zinsser, king
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';

const DOC_PROMPT = `Document the implemented feature.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

## STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST do these documentation tasks. Not "consider" - DO:

1. **PUBLIC FUNCTIONS** - Add JSDoc/TSDoc to every exported function
2. **COMPLEX LOGIC** - Add inline comments for non-obvious code
3. **README** - Update if feature adds new usage/commands
4. **TYPES** - Document non-obvious type fields

DO NOT:
- Over-document obvious code
- Add comments that just repeat the code
- Say "documentation would help" without writing it
- Skip JSDoc on public APIs
- Write vague descriptions ("handles the thing")

## REQUIRED OUTPUT FORMAT

DOCUMENTED:
- [file:line] [what was documented]

PUBLIC_APIS_DOCUMENTED: N (count of exported functions with JSDoc)
README_UPDATED: yes/no
COMMENTS_ADDED: N

APPLIED:
- [expert-name]: [specific decision]

DOC_COMPLETE`;

export class DocCodePhase extends BasePhase {
  readonly name = 'doc-code' as const;
  readonly icon = '📚';
  readonly description = 'Document the completed work';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);

    let prompt = DOC_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', expertGuidance || 'No expert guidance available.');

    // Append corrective prompt for retry attempts
    if (context.correctivePrompt) {
      prompt = `${prompt}\n\n${context.correctivePrompt}`;
    }

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      const error = extractError(output.result) || 'No DOC_COMPLETE marker found';
      return this.failed(`Documentation failed: ${error} (see ${output.rawPath})`);
    }

    // Check for DOCUMENTED section
    if (!output.result.includes('DOCUMENTED:')) {
      return this.failed('No DOCUMENTED section found. Must document what was done.');
    }

    // Check public APIs were documented
    const apisMatch = output.result.match(/PUBLIC_APIS_DOCUMENTED:\s*(\d+)/i);
    const apisDocumented = apisMatch ? parseInt(apisMatch[1], 10) : 0;

    // Parse documented items
    const docMatch = output.result.match(/DOCUMENTED:\s*\n([\s\S]*?)(?=\n\n|\nPUBLIC_APIS|\nREADME|\nCOMMENTS|\nAPPLIED)/i);
    const docCount = docMatch ? docMatch[1].split('\n').filter(l => l.trim().startsWith('-')).length : 0;

    const summary = `${docCount} items documented, ${apisDocumented} public APIs`;
    return this.success(summary, { documented: docCount, publicApis: apisDocumented }, output.result);
  }
}
