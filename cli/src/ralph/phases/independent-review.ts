/**
 * Code-review phase - hard-ass code review via Gemini.
 *
 * Split into two steps:
 * 1. IDENTIFY - Call Gemini, parse issues
 * 2. FIX - Fix issues one at a time
 *
 * This separation prevents cognitive overload and allows targeted retries.
 * Runs on security-relevant PRD items for extra scrutiny.
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude, StreamCallbacks } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';
import {
  hasNoCode, NO_CODE_INDICATORS, parseMcpPhaseOutput, buildPhaseMetrics,
  formatSuccessMessage, GEMINI_EVIDENCE,
} from './mcp-helpers.js';
import chalk from 'chalk';

/** Issue structure for passing between steps */
interface GeminiIssue {
  severity: string;
  description: string;
  file?: string;
  line?: number;
}

/** Keywords that trigger code review - broad to catch most real work */
const REVIEW_TRIGGER_KEYWORDS = [
  // Common Actions (triggers on most PRD items)
  'create', 'add', 'implement', 'build', 'make', 'write', 'develop',
  'update', 'modify', 'change', 'fix', 'refactor', 'improve', 'enhance',
  'function', 'method', 'class', 'module', 'component', 'service', 'handler',
  // Quality Keywords
  'test', 'validate', 'check', 'verify', 'ensure', 'handle', 'process',
  // Auth & Identity
  'auth', 'login', 'logout', 'password', 'credential', 'session', 'token', 'jwt', 'oauth', 'sso',
  'permission', 'role', 'access', 'privilege', 'admin', 'user',
  // Data Protection
  'secret', 'key', 'encrypt', 'decrypt', 'hash', 'salt', 'cipher', 'certificate', 'private',
  // Input/Output
  'input', 'sanitize', 'escape', 'encode', 'decode', 'parse', 'serialize',
  // Web Security
  'cookie', 'cors', 'csrf', 'xss', 'injection', 'sql', 'query', 'command',
  // External
  'api', 'webhook', 'external', 'third-party', 'integration', 'fetch', 'request',
  // Sensitive Operations
  'payment', 'credit', 'billing', 'pii', 'gdpr', 'hipaa', 'email', 'phone', 'address',
  'delete', 'remove', 'purge', 'reset', 'forgot',
];

const IDENTIFY_PROMPT = `## STEP 1: IDENTIFY ISSUES (DO NOT FIX YET)

You MUST call mcp__gemini-reviewer__gemini_review to find issues. DO NOT fix anything in this step.

PRD ITEM: {ITEM_TEXT}

## FIND CODE TO REVIEW (MANDATORY)

You MUST find and review code. Try these methods IN ORDER until you find files:

1. \`git diff HEAD~5 --name-only\` - files changed in last 5 commits
2. \`git diff --staged --name-only\` - staged files
3. \`git log --oneline -10 --name-only\` - recently touched files
4. Look for files matching the PRD item keywords in src/, lib/, app/

If method 1-3 return nothing, use Glob to find relevant source files based on the PRD item text.

IMPORTANT: You MUST find at least one file to review. Only output "no code to review" if the project is genuinely empty.

## READ THE FILES

For each file found:
1. Use Read tool to get the full source code
2. Collect all code into a single string for Gemini

## CALL GEMINI WITH THE CODE

This is MANDATORY. You must paste actual source code, not placeholders.

\`\`\`
mcp__gemini-reviewer__gemini_review
  code: <THE ACTUAL SOURCE CODE YOU READ - not a placeholder>
  focus: "general"
  context: "Hard-ass code review for: {ITEM_TEXT}. Be thorough and critical. Find: bugs, edge cases that crash, error handling gaps, race conditions, resource leaks, logic errors, poor error messages, missing validation, code that will break in production. No false praise - if it's wrong, say so."
\`\`\`

## OUTPUT FORMAT

GEMINI_RESULT: called - [N] issues

FILES_REVIEWED:
- path/to/file1.ts
- path/to/file2.ts

ISSUES_FOUND:
[SEVERITY] description (file:line)

INFO_NOTED:
[INFO] description (file:line)

REVIEW_ISSUES: N
IDENTIFICATION_COMPLETE: yes`;

const FIX_PROMPT = `## STEP 2: FIX ISSUES

Fix the following issues found by Gemini. Fix them ONE AT A TIME.

{ISSUES_LIST}

## For EACH issue:
1. Read the file
2. Understand the issue
3. Use Edit tool to fix
4. Verify fix compiles: run \`npm run build\` or \`npx tsc --noEmit\`
5. Mark as FIXED

## INFO items
INFO-level items are observations - acknowledge but don't fix unless trivial.

## If you cannot fix an issue:
Document in CANNOT_FIX with specific reason (e.g., "requires architectural change", "in third-party code")

## OUTPUT FORMAT

ISSUES_FIXED:
[SEVERITY] description - FIXED

CANNOT_FIX:
[SEVERITY] description - REASON: <specific reason>

UNFIXED: N
FIX_COMPLETE: yes`;

export class IndependentReviewPhase extends BasePhase {
  readonly name = 'independent-review' as const;
  readonly icon = '🔍';
  readonly description = 'Independent code review via Gemini, fix issues found';

  /**
   * Run on items matching trigger keywords (broad list catches most real work).
   */
  shouldRun(context: PhaseContext): boolean {
    const itemText = context.item.text.toLowerCase();
    return REVIEW_TRIGGER_KEYWORDS.some(keyword => itemText.includes(keyword));
  }

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, projectPath, logsDir } = context;

    // Step 1: Identify issues
    process.stdout.write(`      ${chalk.magenta('○')} ${chalk.dim('Step 1: Identifying issues...')}\n`);
    const identifyResult = await this.runIdentifyStep(context);

    if (identifyResult.skip) {
      return this.skipped(identifyResult.reason || 'No code to review');
    }
    if (identifyResult.error) {
      return this.failed(identifyResult.error);
    }

    const issues = identifyResult.issues || [];
    const actionableIssues = issues.filter(i => i.severity !== 'INFO');
    const infoCount = issues.length - actionableIssues.length;

    // Show breakdown if there are INFO items
    if (infoCount > 0) {
      process.stdout.write(`      ${chalk.dim(`(${infoCount} INFO items noted, ${actionableIssues.length} actionable)`)}\n`);
    }

    // If no actionable issues, we're done
    if (actionableIssues.length === 0) {
      process.stdout.write(`      ${chalk.green('✓')} ${chalk.dim('No issues to fix')}\n`);
      return this.success(
        `Gemini review clean - ${issues.length} INFO items noted`,
        { toolCalled: 1, issuesFound: issues.length, issuesFixed: 0 },
        identifyResult.rawOutput
      );
    }

    // Step 2: Fix issues
    process.stdout.write(`      ${chalk.magenta('○')} ${chalk.dim(`Step 2: Fixing ${actionableIssues.length} issues...`)}\n`);
    const fixResult = await this.runFixStep(context, actionableIssues);

    if (fixResult.error) {
      return this.failed(fixResult.error);
    }

    // Validate results
    const unfixedCriticalHigh = fixResult.unfixed.filter(
      i => i.severity === 'CRITICAL' || i.severity === 'HIGH'
    );

    if (unfixedCriticalHigh.length > 0) {
      const list = unfixedCriticalHigh.slice(0, 3).map(i => `[${i.severity}] ${i.description}`).join(', ');
      return this.failed(`${unfixedCriticalHigh.length} CRITICAL/HIGH issues unfixed: ${list}`);
    }

    const unfixedModerateLow = fixResult.unfixed.filter(
      i => i.severity === 'MODERATE' || i.severity === 'LOW'
    );
    if (unfixedModerateLow.length > 2) {
      const list = unfixedModerateLow.slice(0, 3).map(i => `[${i.severity}] ${i.description}`).join(', ');
      return this.failed(`${unfixedModerateLow.length} MODERATE/LOW unfixed (max 2): ${list}`);
    }

    const suffix = unfixedModerateLow.length > 0 ? ` (${unfixedModerateLow.length} noted)` : '';
    return this.success(
      `Fixed ${fixResult.fixed.length}/${actionableIssues.length} issues${suffix}`,
      {
        toolCalled: 1,
        issuesFound: issues.length,
        issuesFixed: fixResult.fixed.length,
        cannotFix: fixResult.cannotFix.length,
      },
      fixResult.rawOutput
    );
  }

  /** Step 1: Call Gemini and identify issues */
  private async runIdentifyStep(context: PhaseContext): Promise<{
    issues?: GeminiIssue[];
    skip?: boolean;
    reason?: string;
    error?: string;
    rawOutput?: string;
  }> {
    const { item, projectPath, logsDir } = context;
    const prompt = IDENTIFY_PROMPT.replace(/{ITEM_TEXT}/g, item.text);

    // Dedupe repeated Gemini calls
    let geminiShown = false;
    const stream: StreamCallbacks = {
      onToolCall: (name) => {
        if (name.includes('gemini') && !geminiShown) {
          process.stdout.write(`      ${chalk.magenta('◆')} ${chalk.dim('Calling Gemini...')}\n`);
          geminiShown = true;
        }
      },
    };

    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix: `${this.getLogPrefix(context)}-identify`,
      allowedTools: ['Bash', 'Read', 'Glob', 'Grep', 'mcp__gemini-reviewer__gemini_review'],
      stream,
    });

    if (hasNoCode(output.result, NO_CODE_INDICATORS)) {
      return { skip: true, reason: 'No code to review' };
    }

    if (!output.success) {
      return { error: `Identify step failed: ${extractError(output.result)}` };
    }

    // Check Gemini was called
    const parsed = parseMcpPhaseOutput(output.result, 'GEMINI_RESULT', 'REVIEW_ISSUES', GEMINI_EVIDENCE);
    if (parsed.toolStatus !== 'called' && !parsed.wasInvoked) {
      return { error: 'Gemini was not called' };
    }

    // Debug: show files reviewed
    const filesMatch = output.result.match(/FILES_REVIEWED:\s*([\s\S]*?)(?=\n\n|\nISSUES|\nGEMINI|\n[A-Z_]+:)/i);
    if (filesMatch) {
      const files = filesMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
      if (files.length > 0) {
        process.stdout.write(`      ${chalk.magenta('◆')} ${chalk.dim(`Reviewed: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` +${files.length - 3} more` : ''}`)}\n`);
      }
    }

    // Parse issues from output
    const issues = this.parseIssuesFromOutput(output.result);

    // Debug: show if Gemini returned content but parsing found nothing
    const rawIssueLines = output.result.split('\n').filter(l =>
      /\b(CRITICAL|HIGH|MEDIUM|MODERATE|LOW|WARNING|ERROR)\b/i.test(l)
    ).length;

    if (issues.length === 0 && rawIssueLines > 0) {
      process.stdout.write(`      ${chalk.yellow('⚠')} ${chalk.dim(`Parsing mismatch: ${rawIssueLines} severity lines but ${issues.length} parsed`)}\n`);
    }

    process.stdout.write(`      ${chalk.magenta('◆')} ${chalk.dim(`Found ${issues.length} issues`)}\n`);

    return { issues, rawOutput: output.result };
  }

  /** Step 2: Fix the identified issues */
  private async runFixStep(context: PhaseContext, issues: GeminiIssue[]): Promise<{
    fixed: GeminiIssue[];
    unfixed: GeminiIssue[];
    cannotFix: GeminiIssue[];
    error?: string;
    rawOutput?: string;
  }> {
    const { projectPath, logsDir } = context;

    // Format issues for the prompt with explicit numbering
    const issuesList = issues.map((issue, i) =>
      `${i + 1}. [${issue.severity}] ${issue.description}${issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : ''}`
    ).join('\n');

    // Ask Claude to reference issues by number when reporting fixes
    const prompt = FIX_PROMPT.replace('{ISSUES_LIST}', issuesList) +
      '\n\nIMPORTANT: When reporting fixed issues, include the issue number: "#N [SEVERITY] description - FIXED"';

    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix: `${this.getLogPrefix(context)}-fix`,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return {
        fixed: [],
        unfixed: issues,
        cannotFix: [],
        error: `Fix step failed: ${extractError(output.result)}`,
      };
    }

    // Track which issues were addressed by index
    const fixedIndices = new Set<number>();
    const cannotFixIndices = new Set<number>();

    // Parse by issue number first (most reliable)
    const numberPattern = /#(\d+)\s*\[.*?\].*?-\s*(FIXED|REASON:)/gmi;
    let match;
    while ((match = numberPattern.exec(output.result)) !== null) {
      const idx = parseInt(match[1], 10) - 1; // Convert to 0-indexed
      if (idx >= 0 && idx < issues.length) {
        if (match[2].toUpperCase() === 'FIXED') {
          fixedIndices.add(idx);
        } else {
          cannotFixIndices.add(idx);
        }
      }
    }

    // Fallback: fuzzy match if no numbers found
    if (fixedIndices.size === 0 && cannotFixIndices.size === 0) {
      const fixedParsed = this.parseFixedFromOutput(output.result, issues);
      const cannotFixParsed = this.parseCannotFixFromOutput(output.result, issues);
      for (const f of fixedParsed) {
        const idx = issues.findIndex(i => i === f);
        if (idx >= 0) fixedIndices.add(idx);
      }
      for (const c of cannotFixParsed) {
        const idx = issues.findIndex(i => i === c);
        if (idx >= 0) cannotFixIndices.add(idx);
      }
    }

    const fixed = issues.filter((_, i) => fixedIndices.has(i));
    const cannotFix = issues.filter((_, i) => cannotFixIndices.has(i));
    const unfixed = issues.filter((_, i) => !fixedIndices.has(i) && !cannotFixIndices.has(i));

    process.stdout.write(`      ${chalk.green('◆')} ${chalk.dim(`Fixed ${fixed.length}, cannot fix ${cannotFix.length}, unfixed ${unfixed.length}`)}\n`);

    // Print the fixed issues for visibility
    if (fixed.length > 0) {
      process.stdout.write(`      ${chalk.dim(`Issues Fixed (${fixed.length}):`)}\n`);
      for (const issue of fixed) {
        process.stdout.write(`        ${chalk.green('✓')} ${issue.description}\n`);
      }
    }

    return { fixed, unfixed, cannotFix, rawOutput: output.result };
  }

  /** Parse issues from identify step output */
  private parseIssuesFromOutput(output: string): GeminiIssue[] {
    const issues: GeminiIssue[] = [];
    // Standard severities only - ERROR/WARNING can appear in descriptions and cause false matches
    const severities = 'CRITICAL|HIGH|MEDIUM|MODERATE|LOW|INFO';

    // Patterns ordered from most specific to most general
    const patterns = [
      // [SEVERITY] description (file:line) - brackets are unambiguous
      new RegExp(`\\[(${severities})\\]\\s+(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
      // **SEVERITY**: description or **SEVERITY** description
      new RegExp(`\\*\\*(${severities})\\*\\*[:\\s]+(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
      // - [SEVERITY] or - **SEVERITY**: list items with clear markers
      new RegExp(`^[-*•]\\s*(?:\\[|\\*\\*)(${severities})(?:\\]|\\*\\*)[:\\s]+(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
      // Numbered: 1. [SEVERITY] or 1. **SEVERITY**
      new RegExp(`^\\d+\\.\\s*(?:\\[|\\*\\*)(${severities})(?:\\]|\\*\\*)[:\\s]+(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
      // Gemini markdown: - **SEVERITY:** description (colon inside bold)
      new RegExp(`^[-*•]\\s*\\*\\*(${severities}):\\*\\*\\s*(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
      // Severity in backticks: `SEVERITY` description
      new RegExp(`\`(${severities})\`[:\\s]+(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
      // Start of line only: SEVERITY: description (requires colon, no loose dash matching)
      new RegExp(`^(${severities}):\\s+(.+?)(?:\\s+\\(([^:)]+)(?::(\\d+))?\\))?$`, 'gmi'),
    ];

    const seen = new Set<string>();

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(output)) !== null) {
        const rawSeverity = match[1].toUpperCase();
        const severity = rawSeverity === 'MEDIUM' ? 'MODERATE' :
                        rawSeverity === 'WARNING' ? 'LOW' :
                        rawSeverity === 'ERROR' ? 'HIGH' : rawSeverity;
        const description = match[2].trim();

        const key = `${severity}:${description.toLowerCase().slice(0, 50)}`;
        if (!seen.has(key)) {
          seen.add(key);
          issues.push({
            severity,
            description,
            file: match[3],
            line: match[4] ? parseInt(match[4], 10) : undefined,
          });
        }
      }
    }

    return issues;
  }

  /** Parse fixed issues from fix step output */
  private parseFixedFromOutput(output: string, original: GeminiIssue[]): GeminiIssue[] {
    const fixed: GeminiIssue[] = [];
    const pattern = /\[(CRITICAL|HIGH|MEDIUM|MODERATE|LOW)\]\s+(.+?)\s*-\s*FIXED/gmi;

    let match;
    while ((match = pattern.exec(output)) !== null) {
      const desc = match[2].trim().toLowerCase();
      const orig = original.find(i => i.description.toLowerCase().includes(desc) || desc.includes(i.description.toLowerCase()));
      if (orig) {
        fixed.push(orig);
      } else {
        fixed.push({
          severity: match[1] === 'MEDIUM' ? 'MODERATE' : match[1],
          description: match[2].trim(),
        });
      }
    }

    return fixed;
  }

  /** Parse cannot-fix issues from fix step output */
  private parseCannotFixFromOutput(output: string, original: GeminiIssue[]): GeminiIssue[] {
    const cannotFix: GeminiIssue[] = [];
    const pattern = /\[(CRITICAL|HIGH|MEDIUM|MODERATE|LOW)\]\s+(.+?)\s*-\s*REASON:/gmi;

    let match;
    while ((match = pattern.exec(output)) !== null) {
      const desc = match[2].trim().toLowerCase();
      const orig = original.find(i => i.description.toLowerCase().includes(desc) || desc.includes(i.description.toLowerCase()));
      if (orig) {
        cannotFix.push(orig);
      } else {
        cannotFix.push({
          severity: match[1] === 'MEDIUM' ? 'MODERATE' : match[1],
          description: match[2].trim(),
        });
      }
    }

    return cannotFix;
  }
}
