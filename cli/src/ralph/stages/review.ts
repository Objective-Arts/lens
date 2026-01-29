/**
 * Review stage - adversarial code review with Gemini + Qodana.
 *
 * Following schneier: assume code has vulnerabilities.
 * Two-phase review: LLM (Gemini) then static analysis (Qodana).
 */

import chalk from 'chalk';
import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';
import { parseGeminiOutput, getGeminiSummary } from '../parsers/gemini.js';

/** Print phase indicator for multi-phase stages */
function printPhase(phase: string, description: string): void {
  console.log(`\n      ${chalk.cyan('▸')} ${chalk.cyan(phase)}: ${chalk.dim(description)}`);
}

const GEMINI_REVIEW_PROMPT = `You are conducting an adversarial code review with Gemini.

PRD ITEM IMPLEMENTED:
{ITEM_TEXT}

{SKILL_GUIDANCE}

REVIEW PROCESS:
1. Use the gemini_review MCP tool on each changed file with focus="adversarial"
2. Count ALL issues reported - do NOT dismiss any as false positives
3. For each Critical or High severity issue:
   - Attempt to fix it
   - Re-run gemini_review to verify the fix
4. Continue until all Critical/High issues are addressed

CRITICAL RULES:
- Every Gemini issue counts. Do not dismiss issues.
- Do not argue with Gemini's assessment.
- Fix first, explain later.
- If you cannot fix an issue, document why.

When complete, output a summary in this EXACT format:
GEMINI_ISSUES: <total count>
CRITICAL_HIGH: <critical + high count>
ISSUES_FIXED: <number fixed>
VERIFIED_CLEAN: <yes/no>
REVIEW_COMPLETE`;

const QODANA_REVIEW_PROMPT = `You are conducting static analysis with Qodana after Gemini review.

PRD ITEM IMPLEMENTED:
{ITEM_TEXT}

QODANA REVIEW PROCESS:
1. Run qodana_scan on the project directory to find code quality issues
2. Use qodana_problems to list all CRITICAL and HIGH severity issues
3. For each Critical or High severity issue:
   - Read the file and understand the issue
   - Fix the issue using Edit tool
   - Document what you fixed
4. Re-run qodana_scan to verify fixes
5. Continue until no Critical/High issues remain

CRITICAL RULES:
- Fix all CRITICAL and HIGH severity issues
- Do not dismiss issues as false positives
- If you cannot fix an issue, document why clearly

When complete, output a summary in this EXACT format:
QODANA_ISSUES: <total count>
QODANA_CRITICAL_HIGH: <critical + high count>
QODANA_FIXED: <number fixed>
QODANA_VERIFIED_CLEAN: <yes/no>
QODANA_COMPLETE`;

export class ReviewStage extends BaseStage {
  readonly name = 'review';
  readonly icon = '\ud83d\udc41\ufe0f'; // 👁️

  async execute(context: StageContext): Promise<StageResult> {
    const { item, skills, projectPath, logsDir } = context;

    // Phase 1: Gemini review
    printPhase('Gemini', 'Adversarial code review');

    const skillGuidance = this.buildSkillGuidance(skills);
    const geminiPrompt = GEMINI_REVIEW_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{SKILL_GUIDANCE}', skillGuidance);

    const logPrefix = this.getLogPrefix(context);
    const geminiOutput = await runClaude({
      prompt: geminiPrompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['mcp__gemini-reviewer__gemini_review', 'Read', 'Edit', 'Bash'],
      timeout: 900000, // 15 minutes for Gemini review
    });

    // Parse Gemini results
    const geminiResult = parseGeminiOutput(geminiOutput.result);
    const geminiSummary = getGeminiSummary(geminiResult);
    console.log(chalk.dim(`      ${geminiSummary}`));

    if (geminiResult.criticalHigh > 0 && !geminiResult.verifiedClean) {
      return {
        status: 'failed',
        error: `Gemini: Unresolved critical/high issues: ${geminiSummary}`,
      };
    }

    // Phase 2: Qodana static analysis
    printPhase('Qodana', 'Static code analysis');

    const qodanaPrompt = QODANA_REVIEW_PROMPT
      .replace('{ITEM_TEXT}', item.text);

    const qodanaLogPrefix = `${logPrefix}-qodana`;
    const qodanaOutput = await runClaude({
      prompt: qodanaPrompt,
      projectPath,
      logDir: logsDir,
      logPrefix: qodanaLogPrefix,
      allowedTools: [
        'mcp__qodana__qodana_scan',
        'mcp__qodana__qodana_problems',
        'mcp__qodana__qodana_results',
        'Read',
        'Edit',
        'Bash',
      ],
      timeout: 900000, // 15 minutes for Qodana review
    });

    // Parse Qodana results from output
    const qodanaResult = parseQodanaOutput(qodanaOutput.result);
    console.log(chalk.dim(`      ${qodanaResult.totalIssues} issues, ${qodanaResult.fixed} fixed`));

    if (qodanaResult.criticalHigh > 0 && !qodanaResult.verifiedClean) {
      return {
        status: 'failed',
        error: `Qodana: Unresolved critical/high issues: ${qodanaResult.criticalHigh} remaining`,
      };
    }

    // Combine summaries
    const combinedSummary = `Gemini: ${geminiSummary} | Qodana: ${qodanaResult.totalIssues} issues, ${qodanaResult.fixed} fixed`;

    return {
      status: 'success',
      message: combinedSummary,
      metrics: {
        geminiTotal: geminiResult.totalIssues,
        geminiCriticalHigh: geminiResult.criticalHigh,
        geminiFixed: geminiResult.issuesFixed,
        qodanaTotal: qodanaResult.totalIssues,
        qodanaCriticalHigh: qodanaResult.criticalHigh,
        qodanaFixed: qodanaResult.fixed,
      },
    };
  }
}

/** Parse Qodana output markers from Claude's response */
function parseQodanaOutput(output: string): {
  totalIssues: number;
  criticalHigh: number;
  fixed: number;
  verifiedClean: boolean;
} {
  const totalMatch = output.match(/QODANA_ISSUES:\s*(\d+)/);
  const criticalHighMatch = output.match(/QODANA_CRITICAL_HIGH:\s*(\d+)/);
  const fixedMatch = output.match(/QODANA_FIXED:\s*(\d+)/);
  const verifiedMatch = output.match(/QODANA_VERIFIED_CLEAN:\s*(yes|no)/i);

  return {
    totalIssues: totalMatch ? parseInt(totalMatch[1], 10) : 0,
    criticalHigh: criticalHighMatch ? parseInt(criticalHighMatch[1], 10) : 0,
    fixed: fixedMatch ? parseInt(fixedMatch[1], 10) : 0,
    verifiedClean: verifiedMatch ? verifiedMatch[1].toLowerCase() === 'yes' : true,
  };
}
