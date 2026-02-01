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

    // Dedupe repeated Gemini calls (runner spinner shows elapsed time)
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

    // Parse actual findings with descriptions
    const findings = this.parseFindings(output.result);

    if (findings.length === 0) {
      process.stdout.write(`\n  ${chalk.green('✓')} No vulnerabilities found\n`);
      return this.success('Security review passed - no vulnerabilities found');
    }

    // Print each finding
    process.stdout.write(`\n${chalk.bold('Vulnerabilities Found:')}\n`);
    for (const finding of findings) {
      const color = finding.severity === 'CRITICAL' ? chalk.red.bold :
                    finding.severity === 'HIGH' ? chalk.red :
                    finding.severity === 'MEDIUM' ? chalk.yellow : chalk.blue;
      process.stdout.write(`  ${color(`[${finding.severity}]`)} ${finding.description}\n`);
      if (finding.file) {
        process.stdout.write(`    ${chalk.dim(`→ ${finding.file}${finding.line ? `:${finding.line}` : ''}`)}\n`);
      }
    }

    const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = findings.filter(f => f.severity === 'LOW').length;

    // Fix CRITICAL, HIGH, and MEDIUM issues (note LOW)
    const fixableFindings = findings.filter(f =>
      f.severity === 'CRITICAL' || f.severity === 'HIGH' || f.severity === 'MEDIUM'
    );

    if (fixableFindings.length > 0) {
      process.stdout.write(`\n${chalk.bold('Fixing CRITICAL/HIGH/MEDIUM vulnerabilities...')}\n`);
      if (lowCount > 0) {
        process.stdout.write(`${chalk.dim(`(${lowCount} LOW issues noted but not fixed)`)}\n`);
      }

      const fixPrompt = `## FIX SECURITY VULNERABILITIES

The security review found these issues that MUST be fixed:

${output.result}

For each CRITICAL, HIGH, and MEDIUM issue:
1. Read the vulnerable file
2. Use Edit tool to fix the vulnerability
3. Verify the fix doesn't break functionality

LOW issues are informational - note them but don't fix.

After fixing, report EXACTLY what you changed:

FIXES_APPLIED:
[SEVERITY] description
  File: path/to/file.ts
  Change: What you changed (e.g., "Added parameterized query", "Added CSRF token check")

SECURITY_FIXES_COMPLETE`;

      const fixOutput = await runClaude({
        prompt: fixPrompt,
        projectPath,
        logDir: logsDir,
        logPrefix: 'security-review-fix',
        allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
      });

      // Parse and display actual fixes
      const fixes = this.parseFixes(fixOutput.result);
      if (fixes.length > 0) {
        process.stdout.write(`\n${chalk.bold('Fixes Applied:')}\n`);
        for (const fix of fixes) {
          process.stdout.write(`  ${chalk.green('✓')} ${chalk.dim(`[${fix.severity}]`)} ${fix.description}\n`);
          if (fix.file) {
            process.stdout.write(`    ${chalk.dim(`→ ${fix.file}`)}\n`);
          }
          if (fix.change) {
            process.stdout.write(`    ${chalk.green(fix.change)}\n`);
          }
        }
      } else {
        process.stdout.write(`  ${chalk.yellow('⚠')} No fixes reported in expected format\n`);
      }

      // If CRITICAL issues remain unfixed, fail
      const fixedCritical = fixes.filter(f => f.severity === 'CRITICAL').length;
      const unfixedCritical = criticalCount - fixedCritical;
      if (unfixedCritical > 0) {
        return this.failed(`${unfixedCritical} CRITICAL vulnerabilities remain unfixed`);
      }

      // Count what was fixed
      const fixedHigh = fixes.filter(f => f.severity === 'HIGH').length;
      const fixedMedium = fixes.filter(f => f.severity === 'MEDIUM').length;

      return this.success(
        `Fixed ${fixes.length} vulnerabilities (${criticalCount}C/${fixedHigh}H/${fixedMedium}M), ${lowCount} LOW noted`,
        { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount, fixed: fixes.length },
        fixOutput.result
      );
    }

    // Only LOW findings - note but don't fix
    if (lowCount > 0) {
      return this.success(
        `Security review complete - ${lowCount} LOW issues noted`,
        { critical: 0, high: 0, medium: 0, low: lowCount, fixed: 0 },
        output.result
      );
    }

    return this.success(
      'Security review complete - no issues found',
      { critical: 0, high: 0, medium: 0, low: 0, fixed: 0 },
      output.result
    );
  }

  /** Parse vulnerability findings from Gemini output */
  private parseFindings(output: string): Array<{
    severity: string;
    description: string;
    file?: string;
    line?: number;
  }> {
    const findings: Array<{ severity: string; description: string; file?: string; line?: number }> = [];
    const pattern = /\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s+(.+?)(?:\n|$)/gi;

    let match;
    while ((match = pattern.exec(output)) !== null) {
      const finding: { severity: string; description: string; file?: string; line?: number } = {
        severity: match[1].toUpperCase(),
        description: match[2].trim(),
      };

      // Look for Evidence: line after this match
      const afterMatch = output.slice(match.index + match[0].length, match.index + match[0].length + 200);
      const evidenceMatch = afterMatch.match(/Evidence:\s*([^:]+):(\d+)/i);
      if (evidenceMatch) {
        finding.file = evidenceMatch[1].trim();
        finding.line = parseInt(evidenceMatch[2], 10);
      }

      findings.push(finding);
    }

    return findings;
  }

  /** Parse applied fixes from fix step output */
  private parseFixes(output: string): Array<{
    severity: string;
    description: string;
    file?: string;
    change?: string;
  }> {
    const fixes: Array<{ severity: string; description: string; file?: string; change?: string }> = [];

    // Look for FIXES_APPLIED section
    const fixSection = output.match(/FIXES_APPLIED:([\s\S]*?)(?:SECURITY_FIXES_COMPLETE|$)/i);
    if (!fixSection) return fixes;

    const lines = fixSection[1].split('\n');
    let current: { severity: string; description: string; file?: string; change?: string } | null = null;

    for (const line of lines) {
      const severityMatch = line.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s+(.+)/i);
      if (severityMatch) {
        if (current) fixes.push(current);
        current = {
          severity: severityMatch[1].toUpperCase(),
          description: severityMatch[2].trim(),
        };
        continue;
      }

      if (current) {
        const fileMatch = line.match(/File:\s*(.+)/i);
        if (fileMatch) {
          current.file = fileMatch[1].trim();
          continue;
        }
        const changeMatch = line.match(/Change:\s*(.+)/i);
        if (changeMatch) {
          current.change = changeMatch[1].trim();
        }
      }
    }

    if (current) fixes.push(current);
    return fixes;
  }
}
