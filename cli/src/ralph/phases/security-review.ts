/**
 * Security-review phase - adversarial security analysis via Gemini.
 *
 * Post-loop phase that runs once at the end of the PRD.
 * Think like an attacker: find vulnerabilities, auth bypasses, injection vectors.
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude, StreamCallbacks } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import {
  hasNoCode, NO_CODE_INDICATORS, parseMcpPhaseOutput, GEMINI_EVIDENCE,
} from './mcp-helpers.js';
import chalk from 'chalk';

const SECURITY_REVIEW_PROMPT = `## ADVERSARIAL SECURITY REVIEW

You are a security researcher performing a penetration test. Your goal is to find vulnerabilities before attackers do.

MINDSET: Think like an attacker. What would you exploit? Where are the weaknesses?

## STEP 1: FIND ALL SECURITY-SENSITIVE CODE

Search for files handling:
1. Authentication (login, logout, session, JWT, OAuth)
2. Authorization (permissions, roles, access control)
3. User input (forms, API endpoints, file uploads)
4. Database queries (SQL, ORM calls)
5. External APIs (webhooks, third-party integrations)
6. Secrets (env vars, credentials, keys)
7. Cryptography (hashing, encryption, tokens)

Use: \`git diff HEAD~10 --name-only\` and Glob to find relevant files.

## STEP 2: CALL GEMINI FOR SECURITY ANALYSIS

For each security-sensitive file, read the code and call Gemini:

\`\`\`
mcp__gemini-reviewer__gemini_review
  code: <THE ACTUAL SOURCE CODE>
  focus: "security"
  context: "Adversarial security review. Think like an attacker. Find: authentication bypasses, authorization flaws, injection vulnerabilities (SQL, command, XSS), insecure cryptography, secrets exposure, race conditions, IDOR, SSRF, path traversal, insecure deserialization, missing rate limiting, session fixation. Every finding must have evidence."
\`\`\`

## STEP 3: CLASSIFY FINDINGS

For each vulnerability found:

**CRITICAL**: Remote code execution, auth bypass, SQL injection, exposed secrets
**HIGH**: XSS, CSRF, privilege escalation, IDOR, weak crypto
**MEDIUM**: Missing rate limiting, verbose errors, weak session handling
**LOW**: Missing security headers, information disclosure

## OUTPUT FORMAT

GEMINI_RESULT: called - [N] security issues

FILES_REVIEWED:
- path/to/auth.ts
- path/to/api/routes.ts

VULNERABILITIES:

[CRITICAL] Description with attack scenario
Evidence: file.ts:123 - \`vulnerable code\`
Attack: How an attacker would exploit this
Fix: How to remediate

[HIGH] Description with attack scenario
Evidence: file.ts:456 - \`vulnerable code\`
Attack: How an attacker would exploit this
Fix: How to remediate

ATTACK_SURFACE:
- Entry points identified
- Trust boundaries crossed
- Data flows analyzed

SUMMARY:
- CRITICAL: N
- HIGH: N
- MEDIUM: N
- LOW: N

SECURITY_REVIEW_COMPLETE`;

export class SecurityReviewPhase extends BasePhase {
  readonly name = 'security-review' as const;
  readonly icon = '🔒';
  readonly description = 'Adversarial security review - think like an attacker';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { projectPath, logsDir } = context;

    process.stdout.write(`\n${chalk.red('━'.repeat(60))}\n`);
    process.stdout.write(`${chalk.red('🔒')} ${chalk.bold('Security Review')} ${chalk.dim('(adversarial)')}\n`);
    process.stdout.write(`${chalk.red('━'.repeat(60))}\n\n`);

    // Dedupe repeated Gemini calls
    let geminiShown = false;
    const stream: StreamCallbacks = {
      onToolCall: (name) => {
        if (name.includes('gemini') && !geminiShown) {
          process.stdout.write(`      ${chalk.red('◆')} ${chalk.dim('Calling Gemini for security analysis...')}\n`);
          geminiShown = true;
        }
      },
    };

    const output = await runClaude({
      prompt: SECURITY_REVIEW_PROMPT,
      projectPath,
      logDir: logsDir,
      logPrefix: 'security-review',
      allowedTools: ['Bash', 'Read', 'Glob', 'Grep', 'mcp__gemini-reviewer__gemini_review'],
      stream,
    });

    if (hasNoCode(output.result, NO_CODE_INDICATORS)) {
      return this.skipped('No security-sensitive code found');
    }

    if (!output.success) {
      return this.failed(`Security review failed: ${extractError(output.result)}`);
    }

    // Check Gemini was called
    const parsed = parseMcpPhaseOutput(output.result, 'GEMINI_RESULT', 'SECURITY_REVIEW', GEMINI_EVIDENCE);
    if (parsed.toolStatus !== 'called' && !parsed.wasInvoked) {
      return this.failed('Gemini was not called for security review');
    }

    // Parse findings by severity
    const criticalCount = (output.result.match(/\[CRITICAL\]/gi) || []).length;
    const highCount = (output.result.match(/\[HIGH\]/gi) || []).length;
    const mediumCount = (output.result.match(/\[MEDIUM\]/gi) || []).length;
    const lowCount = (output.result.match(/\[LOW\]/gi) || []).length;

    // Print summary
    process.stdout.write(`\n${chalk.bold('Security Findings:')}\n`);
    if (criticalCount > 0) process.stdout.write(`  ${chalk.red.bold(`CRITICAL: ${criticalCount}`)}\n`);
    if (highCount > 0) process.stdout.write(`  ${chalk.red(`HIGH: ${highCount}`)}\n`);
    if (mediumCount > 0) process.stdout.write(`  ${chalk.yellow(`MEDIUM: ${mediumCount}`)}\n`);
    if (lowCount > 0) process.stdout.write(`  ${chalk.blue(`LOW: ${lowCount}`)}\n`);

    const total = criticalCount + highCount + mediumCount + lowCount;

    if (total === 0) {
      process.stdout.write(`  ${chalk.green('No vulnerabilities found')}\n`);
      return this.success('Security review passed - no vulnerabilities found');
    }

    // Fix CRITICAL and HIGH issues
    if (criticalCount > 0 || highCount > 0) {
      process.stdout.write(`\n      ${chalk.red('○')} ${chalk.dim('Fixing CRITICAL/HIGH vulnerabilities...')}\n`);

      const fixPrompt = `## FIX SECURITY VULNERABILITIES

The security review found these issues that MUST be fixed:

${output.result}

For each CRITICAL and HIGH issue:
1. Read the vulnerable file
2. Use Edit tool to fix the vulnerability
3. Verify the fix doesn't break functionality

After fixing, report:

FIXES_APPLIED:
[SEVERITY] Brief description - FIXED

SECURITY_FIXES_COMPLETE`;

      const fixOutput = await runClaude({
        prompt: fixPrompt,
        projectPath,
        logDir: logsDir,
        logPrefix: 'security-review-fix',
        allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
      });

      // Count fixes
      const fixedCount = (fixOutput.result.match(/- FIXED/gi) || []).length;
      process.stdout.write(`      ${chalk.green('◆')} ${chalk.dim(`Fixed ${fixedCount} vulnerabilities`)}\n`);

      // If CRITICAL issues remain unfixed, fail
      const unfixedCritical = criticalCount - (fixOutput.result.match(/\[CRITICAL\].*FIXED/gi) || []).length;
      if (unfixedCritical > 0) {
        return this.failed(`${unfixedCritical} CRITICAL vulnerabilities remain unfixed`);
      }
    }

    return this.success(
      `Security review complete - ${criticalCount} CRITICAL, ${highCount} HIGH fixed, ${mediumCount + lowCount} minor noted`,
      { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
      output.result
    );
  }
}
