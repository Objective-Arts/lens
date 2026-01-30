/**
 * Plan phase - understand requirements, design approach.
 *
 * Experts: kernighan, pike, linus, dijkstra, liskov
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';

const PLAN_PROMPT = `Create an implementation plan for this PRD item.

PRD ITEM: {ITEM_TEXT}

Apply expert guidance from: {EXPERT_NAMES}

Plan sections:
1. Requirements - what must be done (kernighan: clarity)
2. Data structures - what data shapes (linus: data first)
3. Interfaces - function signatures, APIs (pike: small interfaces)
4. Invariants - what must always be true (dijkstra: correctness)
5. Security - considerations
6. Tests - verification approach

Be concise. Output PLAN_COMPLETE when done.`;

export class PlanPhase extends BasePhase {
  readonly name = 'plan' as const;
  readonly icon = '📝';
  readonly description = 'Understand requirements, design approach';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertNames = experts.map(s => s.name).join(', ');
    const prompt = PLAN_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_NAMES}', expertNames || 'none');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
    });

    if (!output.success) {
      return this.failed('Plan phase did not complete successfully');
    }

    // Save plan
    const plansDir = path.join(projectPath, '.claude', 'plans');
    if (!fs.existsSync(plansDir)) {
      fs.mkdirSync(plansDir, { recursive: true });
    }

    const slug = createSlug(item.text);
    const planPath = path.join(plansDir, `${slug}.md`);
    fs.writeFileSync(planPath, output.result);

    return this.success(`Plan saved to ${planPath}`);
  }
}
