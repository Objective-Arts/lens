/**
 * Adversarial-review phase - hard-ass code review via Gemini.
 *
 * Uses Gemini MCP tool for comprehensive review. No Claude experts needed.
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import {
  hasNoCode, NO_CODE_INDICATORS, parseMcpPhaseOutput, buildPhaseMetrics,
  formatSuccessMessage, GEMINI_EVIDENCE,
} from './mcp-helpers.js';

const ADVERSARIAL_PROMPT = `## CRITICAL: THIS PHASE REQUIRES GEMINI MCP TOOL

You MUST call mcp__gemini-reviewer__gemini_review. The phase FAILS without it.

PRD ITEM: {ITEM_TEXT}

## STEP 1: Find code to review
Find recently modified files using git diff or git log.
Look in: src/, lib/, app/, migrations/, db/, and project root.
If NO code exists, output "no code to review" and stop.

## STEP 2: CALL GEMINI IMMEDIATELY
THIS IS MANDATORY. Call the tool NOW:
\`\`\`
mcp__gemini-reviewer__gemini_review
  code: <paste the source code>
  focus: "adversarial"
  context: "Adversarial code review. Think like an attacker. Find: security vulnerabilities, race conditions, edge cases that crash, input validation bypasses, resource exhaustion, privilege escalation. Be hostile and thorough."
\`\`\`
If tool unavailable, output: GEMINI_ERROR: tool not available

## STEP 3: FIX ALL ISSUES (MANDATORY - NO EXCEPTIONS)

You MUST fix EVERY issue Gemini identifies. ALL of them. No exceptions.

DO NOT:
- Mark issues as "application-level concern"
- Say "requires application code"
- Punt issues to "future work"
- Skip issues because they're "operational" or "architectural"
- Make judgment calls about what's worth fixing
- Leave ANY issue unfixed

If Gemini found it, YOU FIX IT. Period.

For EACH issue:
1. Use Edit tool to fix the code NOW
2. Verify the fix compiles/runs
3. Record in ISSUES_FIXED

If you truly cannot fix an issue (tool limitation, etc), the phase FAILS.
Do not proceed with unfixed issues.

## REQUIRED OUTPUT FORMAT

GEMINI_RESULT: called - [N] issues
(or: GEMINI_RESULT: error - <reason>)

ISSUES_FOUND:
[SEVERITY] description (file:line)

ISSUES_FIXED:
[SEVERITY] description - FIXED

UNFIXED: 0 (must be zero or phase fails)

REVIEW_ISSUES: N
VERIFIED_CLEAN: yes/no`;

export class AdversarialReviewPhase extends BasePhase {
  readonly name = 'adversarial-review' as const;
  readonly icon = '🔒';
  readonly description = 'Attack your own code, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, projectPath, logsDir } = context;

    let prompt = ADVERSARIAL_PROMPT.replace('{ITEM_TEXT}', item.text);

    // Append corrective prompt for retry attempts
    if (context.correctivePrompt) {
      prompt = `${prompt}\n\n${context.correctivePrompt}`;
    }

    const output = await runClaude({
      prompt, projectPath, logDir: logsDir, logPrefix: this.getLogPrefix(context),
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'mcp__gemini-reviewer__gemini_review'],
    });

    if (hasNoCode(output.result, NO_CODE_INDICATORS)) {
      return this.skipped('No code to review');
    }
    if (!output.success) {
      return this.failed(`Review failed: ${extractError(output.result) || 'Review did not complete'} (see ${output.rawPath})`);
    }

    const parsed = parseMcpPhaseOutput(output.result, 'GEMINI_RESULT', 'REVIEW_ISSUES', GEMINI_EVIDENCE);
    if (parsed.toolStatus !== 'called' && !parsed.wasInvoked) {
      return this.failed('Gemini review was not called - phase requires mcp__gemini-reviewer__gemini_review');
    }

    // Check for unfixed issues - phase MUST fix ALL issues
    const unfixedMatch = output.result.match(/UNFIXED:\s*(\d+)/i);
    const unfixedCount = unfixedMatch ? parseInt(unfixedMatch[1], 10) : parsed.phaseOutput.remaining;

    // Also check for "NOT FIXED" or "Application-Level" sections which indicate skipped fixes
    const hasSkippedFixes = /NOT\s*FIXED|Application-Level|application\s*concern/i.test(output.result);

    if (unfixedCount > 0 || hasSkippedFixes) {
      const issueCount = unfixedCount || 'some';
      return this.failed(`${issueCount} issues not fixed. ALL Gemini issues must be fixed. No exceptions.`);
    }

    const metrics = buildPhaseMetrics(parsed.phaseOutput, parsed.toolStatus === 'called');
    return this.success(
      formatSuccessMessage(parsed.summary, 'Gemini', parsed.toolStatus),
      { ...metrics, geminiCalled: metrics.toolCalled },
      output.result
    );
  }
}
