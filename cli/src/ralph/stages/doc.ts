/**
 * Doc stage - adds documentation to changed code.
 */

import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';
import { execSync } from 'child_process';

const DOC_PROMPT = `Add documentation to recently changed code.

Changed files:
{CHANGED_FILES}

{SKILL_GUIDANCE}

Documentation to add:
1. JSDoc/docstrings for exported functions
2. Brief module-level comments explaining purpose
3. Update CHANGELOG.md with changes
4. Update README.md usage section if API changed

Rules:
- Don't over-document (no comments for obvious code)
- Focus on "why" not "what"
- Keep docstrings concise
- Follow existing documentation style

Output DOC_COMPLETE when done.
Output DOC_SKIPPED if no documentation needed.`;

export class DocStage extends BaseStage {
  readonly name = 'doc';
  readonly icon = '\ud83d\udcda'; // 📚

  async execute(context: StageContext): Promise<StageResult> {
    const { skills, projectPath, logsDir } = context;

    // Get changed files
    const changedFiles = this.getChangedFiles(projectPath);
    const codeFiles = changedFiles.filter(f => this.isCodeFile(f));

    if (codeFiles.length === 0) {
      return {
        status: 'skipped',
        reason: 'No code files changed',
      };
    }

    const skillGuidance = this.buildSkillGuidance(skills);
    const prompt = DOC_PROMPT
      .replace('{CHANGED_FILES}', codeFiles.join('\n'))
      .replace('{SKILL_GUIDANCE}', skillGuidance);

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Read', 'Edit', 'Write'],
    });

    if (output.result.includes('DOC_SKIPPED')) {
      return {
        status: 'skipped',
        reason: 'No documentation needed',
      };
    }

    return {
      status: 'success',
      message: 'Documentation added',
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

  private isCodeFile(filepath: string): boolean {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.go', '.rs', '.java',
      '.c', '.cpp', '.h', '.hpp',
    ];
    return codeExtensions.some(ext => filepath.endsWith(ext));
  }
}
