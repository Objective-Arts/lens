/**
 * Static-analysis phase - run analyzers, fix issues found.
 *
 * Experts: bloch, liskov, owasp, crockford
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';

const STATIC_ANALYSIS_PROMPT = `Run static analysis and fix issues found.

PRD ITEM: {ITEM_TEXT}

Apply expert guidance from: {EXPERT_NAMES}

Analysis principles:
- API correctness, contracts honored (bloch)
- Type contract violations, substitutability (liskov)
- Security rule violations (owasp)
- Language-specific pitfalls (crockford for JS/TS)

Steps:
1. Run linter (eslint/tsc for TS, pylint for Python, etc.)
2. Run type checker in strict mode
3. Check for common security issues
4. Fix all errors and warnings
5. Re-run until clean

Note: Qodana/Gemini external validation runs separately post-loop.
This phase focuses on built-in project tooling.

Output ANALYSIS_ISSUES: N when done, where N is issues fixed.`;

export class StaticAnalysisPhase extends BasePhase {
  readonly name = 'static-analysis' as const;
  readonly icon = '📊';
  readonly description = 'Run analyzers, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertNames = experts.map(s => s.name).join(', ');

    const prompt = STATIC_ANALYSIS_PROMPT
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
      return this.failed('Static-analysis phase did not complete successfully');
    }

    // Parse issue count from output
    const issueMatch = output.result.match(/ANALYSIS_ISSUES:\s*(\d+)/);
    const issueCount = issueMatch ? parseInt(issueMatch[1], 10) : 0;

    return this.success(`${issueCount} issues fixed`, { fixed: issueCount });
  }
}
