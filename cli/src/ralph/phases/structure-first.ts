/**
 * Structure-first phase - design data structures and types before code.
 *
 * Experts: linus, cherny, dijkstra, liskov, bloch, gang-of-four
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';

const STRUCTURE_PROMPT = `Design data structures and types for this PRD item.

PRD ITEM: {ITEM_TEXT}

PLAN:
{PLAN_CONTENT}

Apply expert guidance from: {EXPERT_NAMES}

Design principles:
- Data structures first, algorithms follow (linus)
- Let TypeScript infer, annotate minimally (cherny)
- Establish invariants early (dijkstra)
- Types as contracts (liskov)
- Design for extension (bloch)

Output:
1. Type definitions (interfaces, types)
2. Data structure choices with rationale
3. Invariants that must hold
4. Patterns to apply (gang-of-four if applicable)

Output STRUCTURE_COMPLETE when done.`;

export class StructureFirstPhase extends BasePhase {
  readonly name = 'structure-first' as const;
  readonly icon = '🏗️';
  readonly description = 'Design data structures and types before code';

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

    const prompt = STRUCTURE_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{PLAN_CONTENT}', planContent)
      .replace('{EXPERT_NAMES}', expertNames || 'none');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      return this.failed('Structure-first phase did not complete successfully');
    }

    return this.success('Data structures designed');
  }
}
