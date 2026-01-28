/**
 * Test stage - runs tests and fixes failures.
 */

import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';

const TEST_PROMPT = `Run the project tests and fix any failures.

{SKILL_GUIDANCE}

Steps:
1. Run the test suite (npm test, pytest, go test, cargo test)
2. If tests fail, analyze the failures
3. Fix the failing tests or the code they're testing
4. Re-run tests until they pass
5. Maximum 3 fix attempts per test

Output format when complete:
TEST_COMPLETE
PASSED: <count>
FAILED: <count>
FIXED: <count>

If stuck after 3 attempts, output:
TEST_FAILED: <reason>`;

export class TestStage extends BaseStage {
  readonly name = 'test';
  readonly icon = '\ud83e\uddea'; // 🧪

  async execute(context: StageContext): Promise<StageResult> {
    const { skills, projectPath, logsDir } = context;

    const skillGuidance = this.buildSkillGuidance(skills);
    const prompt = TEST_PROMPT.replace('{SKILL_GUIDANCE}', skillGuidance);

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Bash', 'Read', 'Edit'],
    });

    // Parse test results
    const passedMatch = output.result.match(/PASSED:\s*(\d+)/);
    const failedMatch = output.result.match(/FAILED:\s*(\d+)/);

    const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;

    if (failed > 0) {
      return {
        status: 'failed',
        error: `${failed} tests still failing`,
      };
    }

    return {
      status: 'success',
      message: `${passed} tests passing`,
      metrics: { passed, failed },
    };
  }
}
