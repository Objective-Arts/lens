/**
 * Build-tests phase - write tests for implemented code.
 *
 * Experts: meszaros, fowler-test, dodds, hevery, feathers
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { createSlug } from '../prd/parser.js';

const BUILD_TESTS_PROMPT = `Write tests for the implemented code.

PRD ITEM: {ITEM_TEXT}

Apply expert guidance from: {EXPERT_NAMES}

Testing principles:
- xUnit patterns, clear arrange-act-assert (meszaros)
- Test pyramid: mostly integration, some unit, few e2e (fowler-test)
- Testing Trophy: focus on integration tests (dodds)
- Write testable code, inject dependencies (hevery)
- Characterization tests for existing behavior (feathers)

Steps:
1. Identify what needs testing
2. Write tests (integration first, then unit for complex logic)
3. Run tests to verify they pass
4. Aim for meaningful coverage, not 100%

Output TEST_COUNT: N when done, where N is tests written.`;

export class BuildTestsPhase extends BasePhase {
  readonly name = 'build-tests' as const;
  readonly icon = '🧪';
  readonly description = 'Write tests for implemented code';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertNames = experts.map(s => s.name).join(', ');

    const prompt = BUILD_TESTS_PROMPT
      .replace('{ITEM_TEXT}', item.text)
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
      return this.failed('Build-tests phase did not complete successfully');
    }

    // Parse test count from output
    const testMatch = output.result.match(/TEST_COUNT:\s*(\d+)/);
    const testCount = testMatch ? parseInt(testMatch[1], 10) : 0;

    return this.success(`${testCount} tests written`, { written: testCount });
  }
}
