/**
 * Static-analysis phase - run analyzers, fix issues found.
 *
 * Experts: bloch, liskov, owasp, crockford
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { parsePhaseOutput, getPhaseResultSummary } from '../display/phase-output.js';

const STATIC_ANALYSIS_PROMPT = `Run static analysis and fix issues found.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

Steps:
1. Run linter (eslint/tsc for TS, pylint for Python, etc.)
2. Run type checker in strict mode
3. Check for common security issues
4. Fix all errors and warnings
5. Re-run until clean

Note: Qodana/Gemini external validation runs separately post-loop.
This phase focuses on built-in project tooling.

## OUTPUT FORMAT (Required)

Output your findings in this exact structured format:

ISSUES_FOUND:
[CRITICAL] description here (file/path.ts:line)
[HIGH] description here (file/path.ts:line)
[MODERATE] description here (file/path.ts:line)
[LOW] description here (file/path.ts:line)

ISSUES_FIXED:
[CRITICAL] description here (file/path.ts:line) - FIXED
[HIGH] description here (file/path.ts:line) - FIXED

SUMMARY:
ANALYSIS_ISSUES: N
ISSUES_FIXED: M
REMAINING: R
VERIFIED_CLEAN: yes/no

APPLIED:
- [expert-name]: [how you applied their guidance]

Severity levels:
- CRITICAL: Type errors, security issues, broken contracts
- HIGH: Linter errors, strict mode violations
- MODERATE: Warnings, style issues
- LOW: Informational, suggestions`;

export class StaticAnalysisPhase extends BasePhase {
  readonly name = 'static-analysis' as const;
  readonly icon = '📊';
  readonly description = 'Run analyzers, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);

    const prompt = STATIC_ANALYSIS_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', expertGuidance || 'No expert guidance available.');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed('Static-analysis phase did not complete successfully');
    }

    // Parse structured output
    const phaseOutput = parsePhaseOutput(output.result);

    // Legacy count extraction for backwards compatibility
    const issueMatch = output.result.match(/ANALYSIS_ISSUES:\s*(\d+)/);
    const issueCount = issueMatch ? parseInt(issueMatch[1], 10) : phaseOutput.fixed.length;

    return this.success(getPhaseResultSummary(phaseOutput), {
      issues: issueCount,
      fixed: phaseOutput.fixed.length,
      remaining: phaseOutput.remaining,
      verifiedClean: phaseOutput.verifiedClean ? 1 : 0,
    }, output.result);
  }
}
