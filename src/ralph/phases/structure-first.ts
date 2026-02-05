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
import { extractError } from '../parsers/claude-stream.js';

const STRUCTURE_PROMPT = `## NON-NEGOTIABLE: CREATE ACTUAL TYPE FILES

Before you start: You WILL create real type files using Write tool. Not describe them.
No "any" types. No "unknown." No TODOs. No "will be defined later."

This is not optional. The phase fails if type files aren't actually created.

---

Design and CREATE data structures and types for this PRD item.

PRD ITEM: {ITEM_TEXT}

PLAN:
{PLAN_CONTENT}

{EXPERT_GUIDANCE}

## STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST actually CREATE the type files. Not describe them - WRITE them using Edit/Write tools.

1. **CREATE TYPE FILES** - Use Write tool to create actual .ts files with types
2. **EVERY TYPE FROM PLAN** - Create all types listed in the plan's TYPES section
3. **NO PLACEHOLDER TYPES** - Every field must have a real type, not 'any' or 'unknown'
4. **INVARIANTS AS COMMENTS** - Document invariants as JSDoc comments on types

DO NOT:
- Just describe types without creating files
- Use 'any' or 'unknown' types
- Skip types from the plan
- Say "will be defined later"
- Create types not in the plan without justification

## REQUIRED OUTPUT FORMAT

TYPES_CREATED:
- path/to/types.ts: [list of types defined]

INVARIANTS_DOCUMENTED:
- TypeName: [invariant as documented]

APPLIED:
- [expert-name]: [specific decision]

STRUCTURE_COMPLETE`;

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
    const expertGuidance = this.buildExpertGuidance(experts);

    let prompt = STRUCTURE_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{PLAN_CONTENT}', planContent)
      .replace('{EXPERT_GUIDANCE}', expertGuidance || 'No expert guidance available.');

    // Append corrective prompt for retry attempts
    if (context.correctivePrompt) {
      prompt = `${prompt}\n\n${context.correctivePrompt}`;
    }

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      const error = extractError(output.result) || 'No STRUCTURE_COMPLETE marker found';
      return this.failed(`Structure design failed: ${error} (see ${output.rawPath})`);
    }

    // Validate types were actually created (not just described)
    if (!output.result.includes('TYPES_CREATED:')) {
      return this.failed('No types were created. Must use Write tool to create type files.');
    }

    // Check for forbidden patterns
    const forbiddenPatterns = [/: any[;\s]/i, /: unknown[;\s]/i, /will be defined/i, /TODO/i];
    const hasForbidden = forbiddenPatterns.some(pattern => pattern.test(output.result));
    if (hasForbidden) {
      return this.failed('Types contain forbidden patterns (any, unknown, TODO, "will be defined")');
    }

    return this.success('Data structures created', undefined, output.result);
  }
}
