/**
 * Static-analysis phase - run Qodana analyzer, fix issues found.
 *
 * Uses Qodana MCP tool for static analysis. No Claude experts needed.
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import {
  hasNoCode, NO_ANALYSIS_INDICATORS, parseMcpPhaseOutput, buildPhaseMetrics,
  formatSuccessMessage, QODANA_EVIDENCE,
} from './mcp-helpers.js';

const STATIC_ANALYSIS_PROMPT = `## CRITICAL: THIS PHASE REQUIRES QODANA MCP TOOL

You MUST call mcp__qodana__qodana_scan. The phase FAILS without it.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

## STEP 1: CALL QODANA IMMEDIATELY
THIS IS MANDATORY. Call the tool NOW:
\`\`\`
mcp__qodana__qodana_scan
  projectDir: "."
\`\`\`
Then get issues:
\`\`\`
mcp__qodana__qodana_problems
  projectDir: "."
\`\`\`
If tool unavailable, output: QODANA_ERROR: tool not available

## STEP 2: Run Project Linting
Also run: \`npx tsc --noEmit\` and \`npm run lint\` (if available)

## STEP 3: FIX ALL ISSUES (MANDATORY - NO EXCEPTIONS)

You MUST fix EVERY issue found by Qodana, tsc, and lint. ALL of them. No exceptions.

DO NOT:
- Mark issues as "false positive" without proof
- Say "this is by design"
- Skip issues because they're LOW severity
- Punt issues to "future work"
- Make judgment calls about what's worth fixing
- Leave ANY issue unfixed

If an analyzer found it, YOU FIX IT. Period.

For EACH issue:
1. Use Edit tool to fix the code NOW
2. Verify the fix compiles/passes lint
3. Record in ISSUES_FIXED

The ONLY valid exception: if Qodana reports an issue that literally cannot be fixed
(e.g., third-party library code), document WHY with specific evidence.

## REQUIRED OUTPUT FORMAT

QODANA_RESULT: called - [N] issues
(or: QODANA_RESULT: error - <reason>)

ISSUES_FOUND:
[SEVERITY] description (file:line) [source: lint/qodana]

ISSUES_FIXED:
[SEVERITY] description - FIXED

UNFIXED: 0 (must be zero or phase fails)

ANALYSIS_ISSUES: N
VERIFIED_CLEAN: yes/no`;

export class StaticAnalysisPhase extends BasePhase {
  readonly name = 'static-analysis' as const;
  readonly icon = '📊';
  readonly description = 'Run analyzers, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);
    const prompt = STATIC_ANALYSIS_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', expertGuidance || '');
    const output = await runClaude({
      prompt, projectPath, logDir: logsDir, logPrefix: this.getLogPrefix(context),
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'mcp__qodana__qodana_scan', 'mcp__qodana__qodana_problems'],
    });

    if (hasNoCode(output.result, NO_ANALYSIS_INDICATORS)) {
      return this.skipped('No code to analyze');
    }
    if (!output.success) {
      return this.failed(`Analysis failed: ${extractError(output.result) || 'Analysis did not complete'} (see ${output.rawPath})`);
    }

    const parsed = parseMcpPhaseOutput(output.result, 'QODANA_RESULT', 'ANALYSIS_ISSUES', QODANA_EVIDENCE);
    let { toolStatus } = parsed;

    // Handle unsupported project types (expected for SQL-only projects)
    const unsupportedProject = ['could not detect project type', 'no supported linter', 'sql-only project']
      .some(s => output.result.toLowerCase().includes(s));
    if (unsupportedProject && toolStatus === 'error') {
      toolStatus = 'n/a (no supported linter)';
    }

    // Qodana must be called (unless unsupported project type)
    if (toolStatus === 'not called' && !parsed.wasInvoked && !unsupportedProject) {
      return this.failed('Qodana scan was not called - phase requires mcp__qodana__qodana_scan');
    }

    // Check for unfixed issues - phase MUST fix ALL issues
    const unfixedMatch = output.result.match(/UNFIXED:\s*(\d+)/i);
    const unfixedCount = unfixedMatch ? parseInt(unfixedMatch[1], 10) : parsed.phaseOutput.remaining;

    // Also check for "NOT FIXED" or "false positive" excuses without evidence
    const hasSkippedFixes = /NOT\s*FIXED|false\s*positive|by\s*design|won't\s*fix/i.test(output.result) &&
      !/cannot be fixed.*third-party|library code/i.test(output.result);

    if (unfixedCount > 0 || hasSkippedFixes) {
      const issueCount = unfixedCount || 'some';
      return this.failed(`${issueCount} issues not fixed. ALL analysis issues must be fixed. No exceptions.`);
    }

    const metrics = buildPhaseMetrics(parsed.phaseOutput, toolStatus === 'called');
    return this.success(
      formatSuccessMessage(parsed.summary, 'Qodana', toolStatus),
      { ...metrics, qodanaCalled: metrics.toolCalled },
      output.result
    );
  }
}
