/**
 * Build stage - implements the plan.
 *
 * Following kernighan: implementation follows plan.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';

const BUILD_PROMPT = `Implement this PRD item following the plan.

PRD ITEM: {ITEM_TEXT}

PLAN:
{PLAN_CONTENT}

Apply skills: {SKILL_NAMES}

Steps: Create files, write tests, commit changes.
Output BUILD_COMPLETE when done.`;

export class BuildStage extends BaseStage {
  readonly name = 'build';
  readonly icon = '\ud83d\udee0\ufe0f'; // 🛠️

  async execute(context: StageContext): Promise<StageResult> {
    const { item, skills, projectPath, logsDir } = context;

    // Load the plan
    const slug = createSlug(item.text);
    const planPath = path.join(projectPath, '.claude', 'plans', `${slug}.md`);

    if (!fs.existsSync(planPath)) {
      return {
        status: 'failed',
        error: `Plan not found: ${planPath}`,
      };
    }

    const planContent = fs.readFileSync(planPath, 'utf-8');

    // Build the prompt with skill names only
    const skillNames = skills.map(s => s.name).join(', ');
    const prompt = BUILD_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{PLAN_CONTENT}', planContent)
      .replace('{SKILL_NAMES}', skillNames || 'none');

    // Run Claude with extended tools
    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return {
        status: 'failed',
        error: 'Build stage did not complete successfully',
      };
    }

    return {
      status: 'success',
      message: 'Implementation complete',
    };
  }
}
