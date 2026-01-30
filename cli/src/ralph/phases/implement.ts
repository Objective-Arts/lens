/**
 * Implement phase - write the code.
 *
 * Experts: thompson, kernighan, pike, mcilroy, bill-joy, carmack
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';

const IMPLEMENT_PROMPT = `Implement this PRD item following the plan.

PRD ITEM: {ITEM_TEXT}

PLAN:
{PLAN_CONTENT}

Apply expert guidance from: {EXPERT_NAMES}

Implementation principles:
- Get it working first, then optimize (thompson)
- Keep code readable (kernighan)
- Small functions, composition (pike)
- Do one thing well (mcilroy)
- Handle failures explicitly (bill-joy)
- Measure before optimizing (carmack)

Steps:
1. Create/modify files as specified in plan
2. Implement functionality
3. Commit changes with clear message

Output IMPLEMENT_COMPLETE when done.`;

export class ImplementPhase extends BasePhase {
  readonly name = 'implement' as const;
  readonly icon = '🛠️';
  readonly description = 'Write the code';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    // Load the plan
    const slug = createSlug(item.text);
    const planPath = path.join(projectPath, '.claude', 'plans', `${slug}.md`);

    if (!fs.existsSync(planPath)) {
      return this.failed(`Plan not found: ${planPath}`);
    }

    const planContent = fs.readFileSync(planPath, 'utf-8');
    const expertNames = experts.map(s => s.name).join(', ');

    const prompt = IMPLEMENT_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{PLAN_CONTENT}', planContent)
      .replace('{EXPERT_NAMES}', expertNames || 'none');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed('Implement phase did not complete successfully');
    }

    return this.success('Implementation complete');
  }
}
