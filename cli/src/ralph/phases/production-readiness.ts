/**
 * Production-readiness phase - final check before deployment.
 *
 * Runs once at the end of the PRD, not per-item.
 * Checks for common production issues that slip through other phases.
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import chalk from 'chalk';

const PRODUCTION_READINESS_PROMPT = `## PRODUCTION READINESS CHECK

You are performing a final production readiness review. This runs once at the end of a PRD implementation.

Be hard-ass and evidence-based. Every finding must have a file:line reference.

## CHECKS TO PERFORM

### 1. Error Handling
- No swallowed errors (empty catch blocks)
- All async operations have error handling
- Errors are logged before being thrown/returned
- User-facing errors don't leak internal details

### 2. Configuration
- Environment variables validated on startup
- No hardcoded secrets, URLs, or credentials
- Config has sensible defaults or fails fast
- Feature flags properly implemented

### 3. Resilience
- External API calls have timeouts
- Retries with backoff for transient failures
- Circuit breakers where appropriate
- Graceful degradation when dependencies fail

### 4. Observability
- Logging at appropriate levels (info, warn, error)
- Request IDs or correlation IDs propagated
- Health check endpoints exist
- Key operations are instrumented

### 5. Data Safety
- Database migrations are idempotent
- Rollback path exists
- No data loss on restart
- Sensitive data is not logged

### 6. Rate Limiting & Abuse Prevention
- Rate limiting on public endpoints
- Input size limits enforced
- Expensive operations protected

### 7. Security Basics
- HTTPS enforced
- Security headers set (CSP, HSTS, etc.)
- Session management is secure
- CORS configured correctly

## HOW TO CHECK

1. Use Glob to find relevant files (routes, services, config, middleware)
2. Use Grep to find patterns (catch blocks, env vars, setTimeout, etc.)
3. Use Read to examine suspicious files
4. Document each finding with evidence

## OUTPUT FORMAT

CHECKS_PERFORMED:
- [x] Error handling
- [x] Configuration
- etc.

FINDINGS:

[CRITICAL] Description of critical issue
Evidence: file.ts:123 - \`code snippet\`
Fix: What should be done

[HIGH] Description of high severity issue
Evidence: file.ts:456 - \`code snippet\`
Fix: What should be done

[MEDIUM] Description of medium issue
Evidence: file.ts:789 - \`code snippet\`
Fix: What should be done

[LOW] Description of low severity issue
Evidence: file.ts:101 - \`code snippet\`

SUMMARY:
- CRITICAL: N
- HIGH: N
- MEDIUM: N
- LOW: N

PRODUCTION_READY: yes/no (no if any CRITICAL/HIGH unfixed)

PRODUCTION_CHECK_COMPLETE`;

export class ProductionReadinessPhase extends BasePhase {
  readonly name = 'production-readiness' as const;
  readonly icon = '🚀';
  readonly description = 'Final production readiness check';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { projectPath, logsDir } = context;

    process.stdout.write(`\n${chalk.cyan('━'.repeat(60))}\n`);
    process.stdout.write(`${chalk.cyan('🚀')} ${chalk.bold('Production Readiness Check')}\n`);
    process.stdout.write(`${chalk.cyan('━'.repeat(60))}\n\n`);

    const output = await runClaude({
      prompt: PRODUCTION_READINESS_PROMPT,
      projectPath,
      logDir: logsDir,
      logPrefix: 'production-readiness',
      allowedTools: ['Bash', 'Read', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed(`Production readiness check failed: ${extractError(output.result)}`);
    }

    // Parse findings
    const criticalCount = (output.result.match(/\[CRITICAL\]/gi) || []).length;
    const highCount = (output.result.match(/\[HIGH\]/gi) || []).length;
    const mediumCount = (output.result.match(/\[MEDIUM\]/gi) || []).length;
    const lowCount = (output.result.match(/\[LOW\]/gi) || []).length;

    // Check if marked as production ready
    const readyMatch = output.result.match(/PRODUCTION_READY:\s*(yes|no)/i);
    const isReady = readyMatch ? readyMatch[1].toLowerCase() === 'yes' : false;

    // Print summary
    process.stdout.write(`\n${chalk.bold('Findings:')}\n`);
    if (criticalCount > 0) process.stdout.write(`  ${chalk.red(`CRITICAL: ${criticalCount}`)}\n`);
    if (highCount > 0) process.stdout.write(`  ${chalk.red(`HIGH: ${highCount}`)}\n`);
    if (mediumCount > 0) process.stdout.write(`  ${chalk.yellow(`MEDIUM: ${mediumCount}`)}\n`);
    if (lowCount > 0) process.stdout.write(`  ${chalk.blue(`LOW: ${lowCount}`)}\n`);
    if (criticalCount + highCount + mediumCount + lowCount === 0) {
      process.stdout.write(`  ${chalk.green('No issues found')}\n`);
    }

    const total = criticalCount + highCount + mediumCount + lowCount;

    if (criticalCount > 0 || highCount > 0) {
      return this.failed(
        `Not production ready: ${criticalCount} CRITICAL, ${highCount} HIGH issues found`
      );
    }

    if (mediumCount > 0) {
      return this.success(
        `Production check passed with ${mediumCount} MEDIUM, ${lowCount} LOW issues noted`,
        { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
        output.result
      );
    }

    return this.success(
      `Production ready - ${total === 0 ? 'no issues' : `${lowCount} LOW issues noted`}`,
      { critical: 0, high: 0, medium: mediumCount, low: lowCount },
      output.result
    );
  }
}
