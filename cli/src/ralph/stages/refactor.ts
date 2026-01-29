/**
 * Refactor stage - structural improvements to changed files.
 */

import chalk from 'chalk';
import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';
import { execSync } from 'child_process';

const REFACTOR_PROMPT = `Apply structural improvements to recently changed files.

Changed files:
{CHANGED_FILES}

{SKILL_GUIDANCE}

Improvements to make:
1. Extract long functions (>30 lines) into smaller functions
2. Remove dead code
3. Improve variable names where unclear
4. Add missing error handling
5. Simplify complex conditionals

Rules:
- Don't change functionality
- Don't add new features
- Keep changes minimal and focused
- Commit improvements separately from feature changes

When complete, output in this EXACT format:
REFACTOR_COMPLETE
IMPROVEMENTS:
- <brief description of improvement 1>
- <brief description of improvement 2>
...
IMPROVEMENT_COUNT: <number>

If no improvements needed, output:
REFACTOR_SKIPPED`;

export class RefactorStage extends BaseStage {
  readonly name = 'refactor';
  readonly icon = '\u2728'; // ✨

  async execute(context: StageContext): Promise<StageResult> {
    const { skills, projectPath, logsDir } = context;

    // Get changed files from git
    const changedFiles = this.getChangedFiles(projectPath);
    if (changedFiles.length === 0) {
      return {
        status: 'skipped',
        reason: 'No changed files to refactor',
      };
    }

    const skillGuidance = this.buildSkillGuidance(skills);
    const prompt = REFACTOR_PROMPT
      .replace('{CHANGED_FILES}', changedFiles.join('\n'))
      .replace('{SKILL_GUIDANCE}', skillGuidance);

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Read', 'Edit', 'Bash'],
    });

    if (output.result.includes('REFACTOR_SKIPPED')) {
      return {
        status: 'skipped',
        reason: 'No improvements needed',
      };
    }

    // Parse improvements from output
    const improvements = this.parseImprovements(output.result);

    // Display improvements
    if (improvements.length > 0) {
      console.log(chalk.dim('      Improvements applied:'));
      for (const improvement of improvements.slice(0, 5)) {
        console.log(chalk.dim(`        • ${improvement}`));
      }
      if (improvements.length > 5) {
        console.log(chalk.dim(`        ... and ${improvements.length - 5} more`));
      }
    }

    return {
      status: 'success',
      message: `${improvements.length} improvements applied`,
      metrics: { improvements: improvements.length },
    };
  }

  private parseImprovements(output: string): string[] {
    const improvements: string[] = [];

    // Look for lines starting with "- " after "IMPROVEMENTS:"
    const improvementsMatch = output.match(/IMPROVEMENTS:\s*([\s\S]*?)(?:IMPROVEMENT_COUNT:|$)/);
    if (improvementsMatch) {
      const lines = improvementsMatch[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
          improvements.push(trimmed.slice(2).trim());
        }
      }
    }

    return improvements;
  }

  private getChangedFiles(projectPath: string): string[] {
    try {
      const output = execSync('git diff --name-only HEAD~1', {
        cwd: projectPath,
        encoding: 'utf-8',
      });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }
}
