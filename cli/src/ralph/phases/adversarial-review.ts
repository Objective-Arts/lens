/**
 * Adversarial-review phase - attack your own code, fix issues found.
 *
 * Experts: schneier, owasp, tanya-janca, troy-hunt, petroski, leveson, taleb
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { parsePhaseOutput, getPhaseResultSummary } from '../display/phase-output.js';

const ADVERSARIAL_PROMPT = `Perform adversarial review of the implemented code.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

Review checklist:
1. Input validation - can malicious input cause harm?
2. Authentication/authorization - can it be bypassed?
3. Data exposure - is sensitive data protected?
4. Error handling - do errors leak information?
5. Dependencies - are there known vulnerabilities?
6. Edge cases - what happens at boundaries?
7. Failure modes - what if dependencies fail?

For each issue found:
1. Describe the vulnerability/issue
2. Explain the attack/failure scenario
3. Fix it immediately

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
REVIEW_ISSUES: N
ISSUES_FIXED: M
REMAINING: R
VERIFIED_CLEAN: yes/no

APPLIED:
- [expert-name]: [how you applied their guidance]

Severity levels:
- CRITICAL: Security vulnerabilities, data exposure, auth bypass
- HIGH: Input validation, error handling that leaks info
- MODERATE: Edge cases, missing defensive checks
- LOW: Code style issues, minor improvements`;

export class AdversarialReviewPhase extends BasePhase {
  readonly name = 'adversarial-review' as const;
  readonly icon = '🔒';
  readonly description = 'Attack your own code, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);

    const prompt = ADVERSARIAL_PROMPT
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
      return this.failed('Adversarial-review phase did not complete successfully');
    }

    // Parse structured output
    const phaseOutput = parsePhaseOutput(output.result);

    // Legacy count extraction for backwards compatibility
    const issueMatch = output.result.match(/REVIEW_ISSUES:\s*(\d+)/);
    const issueCount = issueMatch ? parseInt(issueMatch[1], 10) : phaseOutput.issues.length + phaseOutput.fixed.length;

    return this.success(getPhaseResultSummary(phaseOutput), {
      issues: issueCount,
      fixed: phaseOutput.fixed.length,
      remaining: phaseOutput.remaining,
      verifiedClean: phaseOutput.verifiedClean ? 1 : 0,
    }, output.result);
  }
}
