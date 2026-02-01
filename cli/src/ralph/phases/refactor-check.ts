/**
 * Refactor-check phase - simplify and clean up, verify still works.
 *
 * Experts: kernighan, thompson, feathers, gang-of-four, pike
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';

const REFACTOR_PROMPT = `Review and refactor the implemented code.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

## STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST check for and FIX all of these issues. Not "consider" - FIX:

1. **FUNCTIONS > 30 LINES** - Split them. No exceptions.
2. **VAGUE NAMES** - Rename data/result/temp/item/info to meaningful names.
3. **DUPLICATE CODE** - Extract to shared function.
4. **DEEP NESTING** - Flatten with early returns.
5. **MAGIC NUMBERS/STRINGS** - Extract to named constants.
6. **MISSING ERROR HANDLING** - Add it.
7. **GOD FILES** - Split files with multiple concerns.

For EACH issue found, you MUST:
1. Identify it specifically (file:line)
2. Fix it using Edit tool
3. Run tests to verify fix didn't break anything
4. Record in REFACTORED section

DO NOT:
- Say "could be improved" without fixing
- Skip issues because they're "minor"
- Suggest future refactorings instead of doing them
- Leave any identified issue unfixed

## HOOK RESPONSE (CRITICAL)
You WILL see a hook asking "Are you operating within a workflow skill?"
Answer: "Yes, I am in the ralph refactor phase. Proceeding."
Then IMMEDIATELY make the edit.

## REQUIRED OUTPUT FORMAT

ISSUES_IDENTIFIED:
- [file:line] [issue type] [description]

REFACTORED:
- [file:line] [issue type] - FIXED: [what was done]

ISSUES_REMAINING: 0 (must be zero)

REFACTOR_COUNT: N

TESTS_PASS: yes/no

APPLIED:
- [expert-name]: [specific decision]

REFACTOR_COMPLETE`;

export class RefactorCheckPhase extends BasePhase {
  readonly name = 'refactor-check' as const;
  readonly icon = '🧹';
  readonly description = 'Simplify and clean up, verify still works';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);

    let prompt = REFACTOR_PROMPT
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
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      const error = extractError(output.result) || 'No REFACTOR_COMPLETE marker found';
      return this.failed(`Refactoring failed: ${error} (see ${output.rawPath})`);
    }

    // Check for remaining issues - must be zero
    const remainingMatch = output.result.match(/ISSUES_REMAINING:\s*(\d+)/i);
    const remaining = remainingMatch ? parseInt(remainingMatch[1], 10) : -1;
    if (remaining > 0) {
      return this.failed(`${remaining} refactoring issues remain unfixed. ALL issues must be fixed.`);
    }

    // Check tests pass
    const testsPassMatch = output.result.match(/TESTS_PASS:\s*(\w+)/i);
    const testsPass = testsPassMatch ? testsPassMatch[1].toLowerCase() === 'yes' : false;
    if (!testsPass && output.result.includes('TESTS_PASS:')) {
      return this.failed('Tests do not pass after refactoring. Fix before proceeding.');
    }

    // Parse refactoring count
    const countMatch = output.result.match(/REFACTOR_COUNT:\s*(\d+)/i);
    const refactorCount = countMatch ? parseInt(countMatch[1], 10) : 0;

    // Parse refactored items for summary
    const refactoredMatch = output.result.match(/REFACTORED:\s*\n([\s\S]*?)(?=\n\n|\nISSUES_REMAINING|\nREFACTOR_COUNT|\nTESTS_PASS|\nAPPLIED)/i);
    let summary = 'No changes needed';
    if (refactoredMatch) {
      const items = refactoredMatch[1].split('\n').filter(l => l.trim().startsWith('-')).length;
      summary = items > 0 ? `${items} refactorings applied` : 'No changes needed';
    }

    return this.success(summary, { refactorings: refactorCount }, output.result);
  }
}
