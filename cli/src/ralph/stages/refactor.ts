/**
 * Refactor stage - structural improvements to changed files.
 */

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

Output REFACTOR_COMPLETE with count of improvements.
Output REFACTOR_SKIPPED if no improvements needed.`;

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

    return {
      status: 'success',
      message: 'Structural improvements applied',
    };
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
