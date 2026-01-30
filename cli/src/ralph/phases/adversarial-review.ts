/**
 * Adversarial-review phase - attack your own code, fix issues found.
 *
 * Experts: schneier, owasp, tanya-janca, troy-hunt, petroski, leveson, taleb
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';

const ADVERSARIAL_PROMPT = `Perform adversarial review of the implemented code.

PRD ITEM: {ITEM_TEXT}

Apply expert guidance from: {EXPERT_NAMES}

Security mindset:
- Think like an attacker, not a defender (schneier)
- Check OWASP Top 10 vulnerabilities (owasp)
- Security in the SDLC, shift left (tanya-janca)
- Learn from real breaches (troy-hunt)
- Analyze potential failure modes (petroski)
- System safety, hazard analysis (leveson)
- Consider black swan events, fragility (taleb)

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

Output REVIEW_ISSUES: N when done, where N is issues found and fixed.`;

export class AdversarialReviewPhase extends BasePhase {
  readonly name = 'adversarial-review' as const;
  readonly icon = '🔒';
  readonly description = 'Attack your own code, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertNames = experts.map(s => s.name).join(', ');

    const prompt = ADVERSARIAL_PROMPT
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
      return this.failed('Adversarial-review phase did not complete successfully');
    }

    // Parse issue count from output
    const issueMatch = output.result.match(/REVIEW_ISSUES:\s*(\d+)/);
    const issueCount = issueMatch ? parseInt(issueMatch[1], 10) : 0;

    return this.success(`${issueCount} issues found and fixed`, { issues: issueCount });
  }
}
