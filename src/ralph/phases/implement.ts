/**
 * Implement phase - write the code.
 *
 * Experts: pragmatism, clarity, simplicity, composition, distributed, optimization
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';
import { extractError } from '../parsers/claude-stream.js';

const IMPLEMENT_PROMPT = `## NON-NEGOTIABLE: WRITE REAL CODE, NOT STUBS

Before you start: You WILL write complete, working code. No stubs. No TODOs.
No "implement later." No placeholder functions. Every function fully implemented.

This is not optional. The phase fails if ANY code is incomplete.

---

## IMPLEMENT NOW - NO EXPLORATION

Write the code immediately. Do NOT search or explore first.

PRD ITEM: {ITEM_TEXT}

PLAN:
{PLAN_CONTENT}

{EXPERT_GUIDANCE}

## STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST follow these constraints EXACTLY:

1. **MAX 30 LINES PER FUNCTION** - No function may exceed 30 lines. Split if needed.
2. **ONE FILE PER CONCERN** - No god files. Each file has one purpose.
3. **FOLLOW THE PLAN** - Create exactly the files/functions listed in the plan. No extras.
4. **MEANINGFUL NAMES** - Variables/functions must describe what they do. No 'data', 'result', 'temp'.
5. **NO HARDCODED VALUES** - Use constants or config for magic numbers/strings.
6. **HANDLE ALL ERRORS** - Every operation that can fail must have error handling.

DO NOT:
- Create functions longer than 30 lines
- Put multiple concerns in one file
- Use vague names (data, info, result, temp, item, stuff)
- Hardcode configuration values
- Ignore error cases
- Add features not in the plan
- Create "utility" files with random functions

## HOOK RESPONSE (CRITICAL)
You WILL see a hook asking "Are you operating within a workflow skill?"
Answer: "Yes, I am in the ralph implement phase. Proceeding."
Then IMMEDIATELY make the edit.

## REQUIRED OUTPUT FORMAT

FILES_CREATED:
- path/to/file.ts: [functions defined]

LONGEST_FUNCTION: [name] at [N] lines (must be ≤30)

APPLIED:
- [expert]: [decision]

IMPLEMENT_COMPLETE`;

export class ImplementPhase extends BasePhase {
  readonly name = 'implement' as const;
  readonly icon = '🛠️';
  readonly description = 'Write the code';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    // Load the plan
    const slug = createSlug(item.text);
    const planPath = path.join(projectPath, '.claude', 'plans', `${slug}.md`);

    let planContent: string;
    try {
      planContent = fs.readFileSync(planPath, 'utf-8');
    } catch {
      return this.failed(`Plan not found: ${planPath}`);
    }
    const expertGuidance = this.buildExpertGuidance(experts);

    let prompt = IMPLEMENT_PROMPT
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
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    if (!output.success) {
      const error = extractError(output.result) || 'No IMPLEMENT_COMPLETE marker found';
      return this.failed(`Implementation failed: ${error} (see ${output.rawPath})`);
    }

    // Check for files created
    if (!output.result.includes('FILES_CREATED:')) {
      return this.failed('No files were created. Must use Write/Edit tools to create code.');
    }

    // Check longest function doesn't exceed limit
    const longestMatch = output.result.match(/LONGEST_FUNCTION:\s*(\w+)\s+at\s+(\d+)\s+lines/i);
    if (longestMatch) {
      const lineCount = parseInt(longestMatch[2], 10);
      if (lineCount > 30) {
        return this.failed(`Function ${longestMatch[1]} is ${lineCount} lines. Max allowed is 30.`);
      }
    }

    // Check for forbidden naming patterns
    const vagueNames = ['data', 'result', 'temp', 'item', 'stuff', 'info', 'obj'];
    const hasVagueNaming = vagueNames.some(name => {
      const pattern = new RegExp(`\\b(const|let|var|function)\\s+${name}\\b`, 'i');
      return pattern.test(output.result);
    });
    if (hasVagueNaming) {
      return this.failed('Code contains vague variable names (data, result, temp, etc). Use meaningful names.');
    }

    return this.success('Implementation complete', undefined, output.result);
  }
}
