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
import { extractError } from '../parsers/claude-stream.js';

const PLAN_PROMPT = `Create an implementation plan for this PRD item.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

## STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST produce a plan with ALL of these sections. No optional sections. No "TBD".

1. **FILES** - List EVERY file to create/modify with full path
2. **FUNCTIONS** - List EVERY function with signature and max line count (≤30 lines each)
3. **TYPES** - List EVERY interface/type to define
4. **INVARIANTS** - List conditions that must ALWAYS be true
5. **SECURITY** - List specific security considerations (not "consider security")
6. **TESTS** - List specific test cases to write

DO NOT:
- Be vague ("consider adding tests")
- Leave sections empty
- Say "as needed" or "if applicable"
- Make suggestions instead of decisions

Every item must be SPECIFIC and ACTIONABLE.

## REQUIRED OUTPUT FORMAT

FILES:
- path/to/file.ts: purpose

FUNCTIONS:
- functionName(params): ReturnType (max N lines) - purpose

TYPES:
- TypeName: { field definitions }

INVARIANTS:
- Specific condition that must hold

SECURITY:
- Specific security measure

TESTS:
- Specific test case description

APPLIED:
- [expert-name]: [specific decision]

PLAN_COMPLETE`;

export class PlanPhase extends BasePhase {
  readonly name = 'plan' as const;
  readonly icon = '📝';
  readonly description = 'Understand requirements, design approach';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);
    const prompt = PLAN_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{EXPERT_GUIDANCE}', expertGuidance || 'No expert guidance available.');

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
    });

    if (!output.success) {
      const error = extractError(output.result) || 'No PLAN_COMPLETE marker found';
      return this.failed(`Planning failed: ${error} (see ${output.rawPath})`);
    }

    // Validate all required sections are present
    const requiredSections = ['FILES:', 'FUNCTIONS:', 'TYPES:', 'INVARIANTS:', 'SECURITY:', 'TESTS:'];
    const missingSections = requiredSections.filter(section => !output.result.includes(section));
    if (missingSections.length > 0) {
      return this.failed(`Plan missing required sections: ${missingSections.join(', ')}`);
    }

    // Check for vague language that indicates judgment calls
    const vaguePatterns = [/as needed/i, /if applicable/i, /consider adding/i, /TBD/i, /to be determined/i];
    const hasVagueLanguage = vaguePatterns.some(pattern => pattern.test(output.result));
    if (hasVagueLanguage) {
      return this.failed('Plan contains vague language. All items must be specific and actionable.');
    }

    // Save plan
    const plansDir = path.join(projectPath, '.claude', 'plans');
    if (!fs.existsSync(plansDir)) {
      fs.mkdirSync(plansDir, { recursive: true });
    }

    const slug = createSlug(item.text);
    const planPath = path.join(plansDir, `${slug}.md`);
    fs.writeFileSync(planPath, output.result);

    return this.success(`Plan saved to ${planPath}`, undefined, output.result);
  }
}
