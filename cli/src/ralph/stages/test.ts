/**
 * Test stage - runs tests and fixes failures.
 */

import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';

const TEST_PROMPT = `Write tests for the feature just implemented, then run all tests.

PRD Item: {ITEM_TEXT}

{SKILL_GUIDANCE}

Steps:
1. Analyze the code that was just built for this PRD item
2. Write comprehensive tests covering:
   - Happy path scenarios
   - Edge cases and error conditions
   - Input validation
   - Integration points
3. Run the full test suite (npm test, pytest, go test, cargo test)
4. If tests fail, fix the failing tests or the code they're testing
5. Re-run tests until they pass
6. Maximum 3 fix attempts per failing test

Test quality requirements:
- Tests should be isolated and independent
- Use descriptive test names that explain what's being tested
- Include both unit tests and integration tests where appropriate
- Mock external dependencies appropriately

Output format when complete:
TEST_COMPLETE
PASSED: <count>
FAILED: <count>
WRITTEN: <count of new tests>

If stuck after 3 attempts, output:
TEST_FAILED: <reason>`;

export class TestStage extends BaseStage {
  readonly name = 'test';
  readonly icon = '\ud83e\uddea'; // 🧪

  async execute(context: StageContext): Promise<StageResult> {
    const { skills, projectPath, logsDir, item } = context;

    const skillGuidance = this.buildSkillGuidance(skills);
    const prompt = TEST_PROMPT
      .replace('{ITEM_TEXT}', item.text)
      .replace('{SKILL_GUIDANCE}', skillGuidance);

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
    const writtenMatch = output.result.match(/WRITTEN:\s*(\d+)/);

    const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    const written = writtenMatch ? parseInt(writtenMatch[1], 10) : 0;

    if (failed > 0) {
      return {
        status: 'failed',
        error: `${failed} tests still failing`,
      };
    }

    // No tests written or ran - stage didn't complete properly
    if (passed === 0 && written === 0) {
      return {
        status: 'skipped',
        reason: 'No tests written or ran',
      };
    }

    const message = written > 0
      ? `${written} tests written, ${passed} passing`
      : `${passed} tests passing`;

    return {
      status: 'success',
      message,
      metrics: { passed, failed, written },
    };
  }
}
