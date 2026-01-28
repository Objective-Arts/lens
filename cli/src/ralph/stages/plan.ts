/**
 * Plan stage - creates implementation plan for a PRD item.
 *
 * Following kernighan: clear prompt structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';

const PLAN_PROMPT = `Create an implementation plan for this PRD item.

PRD ITEM: {ITEM_TEXT}

Apply these canon skills: {SKILL_NAMES}

Plan sections:
1. Approach - strategy
2. Files - paths and changes
3. Security - considerations
4. Tests - verification approach

Be concise. Output PLAN_COMPLETE when done.`;

export class PlanStage extends BaseStage {
  readonly name = 'plan';
  readonly icon = '\ud83d\udcdd'; // 📝

  async execute(context: StageContext): Promise<StageResult> {
    const { item, skills, projectPath, logsDir } = context;

    // Build the prompt with skill names only (not full content)
    const skillNames = skills.map(s => s.name).join(', ');
    const prompt = PLAN_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{SKILL_NAMES}', skillNames || 'none');

    // Run Claude
    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
    });

    if (!output.success) {
      return {
        status: 'failed',
        error: 'Plan stage did not complete successfully',
      };
    }

    // Save plan to .claude/plans/
    const plansDir = path.join(projectPath, '.claude', 'plans');
    if (!fs.existsSync(plansDir)) {
      fs.mkdirSync(plansDir, { recursive: true });
    }

    const slug = createSlug(item.text);
    const planPath = path.join(plansDir, `${slug}.md`);
    fs.writeFileSync(planPath, output.result);

    return {
      status: 'success',
      message: `Plan saved to ${planPath}`,
    };
  }
}
