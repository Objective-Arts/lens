/**
 * Static-analysis phase - run Qodana analyzer, fix issues found.
 *
 * Uses Qodana MCP tool for static analysis. No Claude experts needed.
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude, StreamCallbacks } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import {
  hasNoCode, NO_ANALYSIS_INDICATORS, parseMcpPhaseOutput, buildPhaseMetrics,
  QODANA_EVIDENCE,
} from './mcp-helpers.js';
import chalk from 'chalk';

const STATIC_ANALYSIS_PROMPT = `## NON-NEGOTIABLE: FIX EVERY CRITICAL/HIGH/MEDIUM/LOW ISSUE

THIS PHASE FAILS IF:
- Any CRITICAL issue unfixed
- Any HIGH issue unfixed
- More than 2 MODERATE/LOW unfixed

TO PASS THIS PHASE YOU MUST:
1. Call mcp__qodana__qodana_scan with projectDir: "."
2. For each CRITICAL/HIGH issue: use Edit tool to fix, then verify
3. Report ISSUES_FIXED section with each fix

---

## CRITICAL: THIS PHASE REQUIRES QODANA MCP TOOL

You MUST call mcp__qodana__qodana_scan. The phase FAILS without it.

## HOW TO FIX AN ISSUE

1. Read the file at the line number
2. Use Edit tool to fix the specific problem
3. Run: npx tsc --noEmit to verify
4. Add to ISSUES_FIXED section

EXAMPLE FIX:
Issue: [HIGH] TS6133: 'afterEach' is declared but never read (test.ts:5)
Action: Remove the unused import using Edit tool
Verify: npx tsc --noEmit shows no errors
Report: [HIGH] TS6133 afterEach unused - FIXED (removed import)

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

## STEP 1: DETECT PROJECT TYPE AND CALL QODANA

First check what linters are available:
\`\`\`
mcp__qodana__qodana_detect
  projectDir: "."
\`\`\`

Qodana supports: JavaScript/TypeScript, Python, Java, Go, Rust, PHP, C#, Ruby, C++
Qodana does NOT support: SQL, Shell scripts, Markdown, YAML, plain text

If project is unsupported, output: QODANA_RESULT: unsupported - [project type]
Then SKIP to Step 2 (linting) - do not fail.

If supported, run scan:
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

## STEP 3: FIX ALL ACTIONABLE ISSUES (MANDATORY)

Fix ALL issues with severity CRITICAL, HIGH, MEDIUM (MODERATE), or LOW.

INFO-level items are suggestions that don't require fixes:
- Code style preferences
- Informational warnings
- Optimization hints

DO NOT skip CRITICAL/HIGH/MEDIUM/LOW issues by relabeling them as INFO.
If Qodana marks it HIGH, you fix it. Period.

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

INFO_NOTED: (INFO-level suggestions - no fix required)

CANNOT_FIX: (issues in third-party code or requiring architectural changes - must justify)
- [SEVERITY] description - REASON: in node_modules / requires X outside scope

UNFIXED: 0 (only issues that COULD be fixed but weren't - must be zero)

ANALYSIS_ISSUES: N
SECURITY_REVIEW_COMPLETE: yes/no`;

export class StaticAnalysisPhase extends BasePhase {
  readonly name = 'static-analysis' as const;
  readonly icon = '📊';
  readonly description = 'Run analyzers, fix issues found';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);
    let prompt = STATIC_ANALYSIS_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', expertGuidance || '');

    // Append corrective prompt for retry attempts
    if (context.correctivePrompt) {
      prompt = `${prompt}\n\n${context.correctivePrompt}`;
    }

    // Stream callbacks to show Qodana progress (runner spinner shows elapsed time)
    let scanShown = false;
    let problemsShown = false;
    const stream: StreamCallbacks = {
      onToolCall: (name) => {
        if (name.includes('qodana_scan') && !scanShown) {
          process.stdout.write(`\n      ${chalk.blue('◆')} ${chalk.dim('Running Qodana scan...')}`);
          scanShown = true;
        } else if (name.includes('qodana_scan') && scanShown) {
          process.stdout.write(`\n      ${chalk.blue('◆')} ${chalk.dim('Verifying fixes...')}`);
        } else if (name.includes('qodana_problems') && !problemsShown) {
          process.stdout.write(`\n      ${chalk.blue('◆')} ${chalk.dim('Checking issues...')}`);
          problemsShown = true;
        }
      },
    };

    const output = await runClaude({
      prompt, projectPath, logDir: logsDir, logPrefix: this.getLogPrefix(context),
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'mcp__qodana__qodana_scan', 'mcp__qodana__qodana_problems'],
      stream,
    });

    if (hasNoCode(output.result, NO_ANALYSIS_INDICATORS)) {
      return this.skipped('No code to analyze');
    }
    if (!output.success) {
      return this.failed(`Analysis failed: ${extractError(output.result) || 'Analysis did not complete'} (see ${output.rawPath})`);
    }

    const parsed = parseMcpPhaseOutput(output.result, 'QODANA_RESULT', 'ANALYSIS_ISSUES', QODANA_EVIDENCE);
    let { toolStatus } = parsed;

    // Show what was actually found and fixed
    const issuesFound = parsed.phaseOutput.issues.filter(i => i.severity !== 'INFO');
    const issuesFixed = parsed.phaseOutput.issues.filter(i => i.fixed);

    if (issuesFound.length > 0) {
      process.stdout.write(`\n${chalk.bold('Issues Found:')}\n`);
      for (const issue of issuesFound.slice(0, 5)) {
        const color = issue.severity === 'CRITICAL' ? chalk.red.bold :
                      issue.severity === 'HIGH' ? chalk.red :
                      issue.severity === 'MODERATE' ? chalk.yellow : chalk.blue;
        const status = issue.fixed ? chalk.green(' ✓') : '';
        process.stdout.write(`  ${color(`[${issue.severity}]`)} ${issue.description}${status}\n`);
        if (issue.file) {
          process.stdout.write(`    ${chalk.dim(`→ ${issue.file}${issue.line ? `:${issue.line}` : ''}`)}\n`);
        }
      }
      if (issuesFound.length > 5) {
        process.stdout.write(`  ${chalk.dim(`... and ${issuesFound.length - 5} more`)}\n`);
      }

      if (issuesFixed.length > 0) {
        process.stdout.write(`\n${chalk.green(`Fixed ${issuesFixed.length}/${issuesFound.length} issues`)}\n`);
      }
    }

    // Handle unsupported project types (expected for SQL-only projects)
    const unsupportedProject = ['could not detect project type', 'no supported linter', 'sql-only project']
      .some(s => output.result.toLowerCase().includes(s));
    if (unsupportedProject && toolStatus === 'error') {
      toolStatus = 'n/a (no supported linter)';
      process.stdout.write(`      ${chalk.yellow('⚠')} ${chalk.dim('Project type not supported by Qodana')}\n`);
    }

    // Qodana must be called (unless unsupported project type)
    if (toolStatus === 'not called' && !parsed.wasInvoked && !unsupportedProject) {
      return this.failed('Qodana scan was not called - phase requires mcp__qodana__qodana_scan');
    }

    // Check for unfixed issues by severity
    // CRITICAL/HIGH must ALL be fixed
    // MODERATE/LOW can have up to 2 unfixed (often style/quality issues)
    const unfixedIssues = parsed.phaseOutput.issues.filter(i => i.severity !== 'INFO');
    const criticalHigh = unfixedIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    const moderateLow = unfixedIssues.filter(i => i.severity === 'MODERATE' || i.severity === 'LOW');

    // Fail if any CRITICAL/HIGH unfixed - provide specific fix guidance
    if (criticalHigh.length > 0) {
      const fixCommands = criticalHigh.slice(0, 3).map(i => {
        const loc = i.file ? ` at ${i.file}${i.line ? `:${i.line}` : ''}` : '';
        if (i.description.includes('TS6133') || i.description.includes('unused') || i.description.includes('never read')) {
          return `[${i.severity}] Remove unused import/variable${loc}`;
        }
        if (i.description.includes('TS2769') || i.description.includes('type')) {
          return `[${i.severity}] Fix type mismatch${loc}`;
        }
        return `[${i.severity}] ${i.description.slice(0, 60)}${loc}`;
      });
      const more = criticalHigh.length > 3 ? `\n(+${criticalHigh.length - 3} more)` : '';
      return this.failed(
        `${criticalHigh.length} CRITICAL/HIGH issues must be fixed:\n` +
        fixCommands.join('\n') + more +
        '\n\nUse Edit tool to fix each, then re-run tsc --noEmit'
      );
    }

    // Allow up to 2 MODERATE/LOW unfixed
    const MAX_MODERATE_LOW_UNFIXED = 2;
    if (moderateLow.length > MAX_MODERATE_LOW_UNFIXED) {
      const unfixedList = moderateLow.slice(0, 3).map(i => `[${i.severity}] ${i.description}`).join(', ');
      return this.failed(`${moderateLow.length} MODERATE/LOW issues unfixed (max ${MAX_MODERATE_LOW_UNFIXED} allowed): ${unfixedList}`);
    }

    const metrics = buildPhaseMetrics(parsed.phaseOutput, toolStatus === 'called');
    const suffix = moderateLow.length > 0 ? ` (${moderateLow.length} MODERATE/LOW noted)` : '';

    // If this is a retry (correctivePrompt exists) and no issues remain, say "resolved" not "no issues found"
    let message: string;
    if (context.correctivePrompt && issuesFound.length === 0) {
      message = 'Issues resolved';
    } else if (issuesFixed.length > 0) {
      message = `${issuesFixed.length} issue${issuesFixed.length > 1 ? 's' : ''} fixed`;
    } else {
      message = parsed.summary || 'No issues found';
    }

    return this.success(
      `${message}${suffix} [Qodana: ${toolStatus}]`,
      { ...metrics, qodanaCalled: metrics.toolCalled },
      output.result
    );
  }
}
