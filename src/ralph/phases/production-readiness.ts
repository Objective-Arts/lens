/**
 * Production-readiness phase - final check before deployment.
 *
 * Runs once at the end of the PRD, not per-item.
 * Checks for operational concerns that slip through other phases.
 * Fixes what it finds and updates documentation.
 *
 * Experts: distributed (handle failure), safety (system safety), failure (learn from failures)
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import { parseFindings, parseDocIssues, parseFixes, parseDocsUpdated } from './readiness-parsers.js';
import chalk from 'chalk';

const AUDIT_PROMPT = `## PRODUCTION READINESS AUDIT

You are performing a final production readiness review. Focus on OPERATIONAL concerns
that other phases miss (security-review handles security, static-analysis handles code quality).

Experts guiding this review:
- distributed: "Handle failure explicitly" - every failure path must be covered
- safety: System safety - what failure modes exist? What constraints prevent accidents?
- failure: Learn from failures - what has gone wrong before? What could go wrong?

## CHECKS TO PERFORM (operational focus)

### 1. Resilience (distributed)
- External API calls have timeouts (find fetch/axios without timeout)
- Retries with exponential backoff for transient failures
- Graceful degradation when dependencies fail
- No unbounded queues or memory growth

### 2. Error Recovery (safety)
- No swallowed errors (empty catch blocks)
- Errors logged with context before re-throwing
- Graceful shutdown handlers exist
- Partial failure doesn't corrupt state

### 3. Observability (failure - learn from failures)
- Logging at appropriate levels
- Health check endpoints exist
- Key operations have timing/metrics
- Errors include enough context to debug

### 4. Configuration
- Environment variables validated on startup (fail fast)
- No hardcoded URLs, ports, or credentials
- Sensible defaults OR explicit failure

### 5. Documentation Accuracy
- README reflects current state
- API endpoints documented
- Environment variables documented
- Setup instructions work

## HOW TO CHECK

1. Use Grep to find patterns:
   - \`fetch|axios|http\\.get\` without timeout
   - \`catch\\s*\\{\\s*\\}\` empty catch blocks
   - \`process\\.env\\.\` without validation
   - \`console\\.log\` instead of proper logging

2. Use Glob to find config/health/middleware files
3. Use Read to examine suspicious files
4. Check README.md against reality

## OUTPUT FORMAT

CHECKS_PERFORMED:
- [x] Resilience patterns
- [x] Error recovery
- [x] Observability
- [x] Configuration
- [x] Documentation

FINDINGS:

[CRITICAL] Description
  File: path/to/file.ts:123
  Evidence: \`code snippet\`
  Fix needed: What should be done

[HIGH] Description
  File: path/to/file.ts:456
  Evidence: \`code snippet\`
  Fix needed: What should be done

[MEDIUM] Description
  File: path/to/file.ts:789
  Evidence: \`code snippet\`

[LOW] Description
  File: path/to/file.ts:101

DOC_ISSUES:
- README missing X section
- API docs don't mention Y endpoint

AUDIT_COMPLETE`;

const FIX_PROMPT = `## FIX PRODUCTION READINESS ISSUES

Fix these issues found during the production readiness audit:

{FINDINGS}

## For each CRITICAL/HIGH issue:
1. Read the file
2. Use Edit tool to fix
3. Verify the fix works

## For documentation issues:
1. Update README.md or relevant docs
2. Ensure accuracy

Report what you fixed:

FIXES_APPLIED:
[SEVERITY] description
  File: path/to/file.ts
  Change: What you changed

DOCS_UPDATED:
- README.md: Added X section
- Updated Y documentation

FIX_COMPLETE`;

export class ProductionReadinessPhase extends BasePhase {
  readonly name = 'production-readiness' as const;
  readonly icon = '🚀';
  readonly description = 'Final production readiness check - fix operational issues, update docs';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { projectPath, logsDir } = context;

    process.stdout.write(`\n${chalk.cyan('━'.repeat(60))}\n`);
    process.stdout.write(`${chalk.cyan('🚀')} ${chalk.bold('Production Readiness Check')}\n`);
    process.stdout.write(`${chalk.cyan('━'.repeat(60))}\n\n`);

    // Step 1: Audit
    process.stdout.write(`${chalk.bold('Auditing...')}\n`);
    const auditOutput = await runClaude({
      prompt: AUDIT_PROMPT,
      projectPath,
      logDir: logsDir,
      logPrefix: 'production-readiness-audit',
      allowedTools: ['Bash', 'Read', 'Glob', 'Grep'],
    });

    if (!auditOutput.success) {
      return this.failed(`Audit failed: ${extractError(auditOutput.result)}`);
    }

    // Parse findings
    const findings = parseFindings(auditOutput.result);
    const docIssues = parseDocIssues(auditOutput.result);

    if (findings.length === 0 && docIssues.length === 0) {
      process.stdout.write(`\n  ${chalk.green('✓')} No issues found - production ready\n`);
      return this.success('Production ready - no issues', { issuesFound: 0, issuesFixed: 0, docsUpdated: 0 });
    }

    // Show findings
    process.stdout.write(`\n${chalk.bold('Issues Found:')}\n`);
    for (const finding of findings) {
      const color = finding.severity === 'CRITICAL' ? chalk.red.bold :
                    finding.severity === 'HIGH' ? chalk.red :
                    finding.severity === 'MEDIUM' ? chalk.yellow : chalk.blue;
      process.stdout.write(`  ${color(`[${finding.severity}]`)} ${finding.description}\n`);
      if (finding.file) {
        process.stdout.write(`    ${chalk.dim(`→ ${finding.file}`)}\n`);
      }
    }

    if (docIssues.length > 0) {
      process.stdout.write(`\n${chalk.bold('Documentation Issues:')}\n`);
      for (const issue of docIssues) {
        process.stdout.write(`  ${chalk.yellow('○')} ${issue}\n`);
      }
    }

    // Step 2: Fix CRITICAL/HIGH and doc issues
    const criticalHigh = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    if (criticalHigh.length > 0 || docIssues.length > 0) {
      process.stdout.write(`\n${chalk.bold('Fixing issues...')}\n`);

      const fixPrompt = FIX_PROMPT.replace('{FINDINGS}', auditOutput.result);
      const fixOutput = await runClaude({
        prompt: fixPrompt,
        projectPath,
        logDir: logsDir,
        logPrefix: 'production-readiness-fix',
        allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
      });

      // Parse and display fixes
      const fixes = parseFixes(fixOutput.result);
      const docsUpdated = parseDocsUpdated(fixOutput.result);

      if (fixes.length > 0) {
        process.stdout.write(`\n${chalk.bold('Fixes Applied:')}\n`);
        for (const fix of fixes) {
          process.stdout.write(`  ${chalk.green('✓')} ${chalk.dim(`[${fix.severity}]`)} ${fix.description}\n`);
          if (fix.change) {
            process.stdout.write(`    ${chalk.green(fix.change)}\n`);
          }
        }
      }

      if (docsUpdated.length > 0) {
        process.stdout.write(`\n${chalk.bold('Documentation Updated:')}\n`);
        for (const doc of docsUpdated) {
          process.stdout.write(`  ${chalk.green('✓')} ${doc}\n`);
        }
      }

      // Check if CRITICAL issues remain
      const fixedCritical = fixes.filter(f => f.severity === 'CRITICAL').length;
      const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
      if (fixedCritical < criticalCount) {
        return this.failed(`${criticalCount - fixedCritical} CRITICAL issues remain unfixed`);
      }

      const metrics = {
        issuesFound: findings.length,
        issuesFixed: fixes.length,
        docsUpdated: docsUpdated.length,
        critical: criticalCount,
        high: findings.filter(f => f.severity === 'HIGH').length,
        medium: findings.filter(f => f.severity === 'MEDIUM').length,
        low: findings.filter(f => f.severity === 'LOW').length,
      };

      return this.success(
        `Fixed ${fixes.length} issues, updated ${docsUpdated.length} docs`,
        metrics,
        fixOutput.result
      );
    }

    // Only MEDIUM/LOW - note but don't fix
    const metrics = {
      issuesFound: findings.length,
      issuesFixed: 0,
      docsUpdated: 0,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
    };

    return this.success(
      `Production ready - ${findings.length} minor issues noted`,
      metrics,
      auditOutput.result
    );
  }
}
