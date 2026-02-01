/**
 * Test phase - write and run tests for implemented code.
 *
 * Experts: meszaros, fowler-test, dodds, hevery, feathers
 */

import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';

const BUILD_TESTS_PROMPT = `Write tests for the implemented code and RUN them.

PRD ITEM: {ITEM_TEXT}

{EXPERT_GUIDANCE}

## STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST write and run tests. Not "consider testing" - WRITE TESTS.

1. **MINIMUM COVERAGE** - At least one test per public function
2. **HAPPY PATH** - Test the expected behavior works
3. **ERROR CASES** - Test that errors are handled correctly
4. **EDGE CASES** - Test boundary conditions
5. **MUST RUN** - Execute tests with npm test/vitest/jest and verify they pass
6. **ALL MUST PASS** - Zero failing tests allowed

DO NOT:
- Say "testing would be beneficial" without writing tests
- Write tests that don't run
- Leave failing tests
- Skip error case testing
- Write trivial tests that don't verify behavior

## HOOK RESPONSE (CRITICAL)
You WILL see a hook asking "Are you operating within a workflow skill?"
Answer: "Yes, I am in the ralph test phase. Proceeding."
Then IMMEDIATELY make the edit.

## REQUIRED OUTPUT FORMAT

TESTS_WRITTEN:
- path/to/test.ts: [test descriptions]

TESTS_RUN: yes (MANDATORY - must actually run them)
TESTS_PASSED: N
TESTS_FAILED: 0 (must be zero or phase fails)
TEST_COUNT: N

COVERAGE:
- [function name]: tested
- [function name]: tested

APPLIED:
- [expert-name]: [specific decision]

TEST_COMPLETE`;

export class TestPhase extends BasePhase {
  readonly name = 'test' as const;
  readonly icon = '🧪';
  readonly description = 'Write tests for implemented code';

  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { item, experts, projectPath, logsDir } = context;

    const expertGuidance = this.buildExpertGuidance(experts);

    let prompt = BUILD_TESTS_PROMPT
      .replace('{ITEM_TEXT}', item.text)
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

    // Check for "no code" scenarios - skip gracefully instead of failing
    const noCodeIndicators = ['no code', 'nothing to test', 'no files', 'no implementation'];
    const hasNoCode = noCodeIndicators.some(indicator =>
      output.result.toLowerCase().includes(indicator)
    );

    if (hasNoCode) {
      return this.skipped('No code to test');
    }

    if (!output.success) {
      const error = extractError(output.result) || 'No TEST_COUNT marker found';
      return this.failed(`Test writing failed: ${error} (see ${output.rawPath})`);
    }

    // Parse test results from output
    const testMatch = output.result.match(/TEST_COUNT:\s*(\d+)/);
    const passedMatch = output.result.match(/TESTS_PASSED:\s*(\d+)/);
    const failedMatch = output.result.match(/TESTS_FAILED:\s*(\d+)/);
    const testsRunMatch = output.result.match(/TESTS_RUN:\s*(\w+)/i);

    const testCount = testMatch ? parseInt(testMatch[1], 10) : 0;
    const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    const testsRun = testsRunMatch ? testsRunMatch[1].toLowerCase() === 'yes' : false;

    if (testCount === 0) {
      return this.failed('No tests were written. Tests are REQUIRED, not optional.');
    }

    // Tests MUST be run - no exceptions
    if (!testsRun) {
      return this.failed('Tests were not run. You MUST execute tests and verify they pass.');
    }

    // Fail if tests failed - zero tolerance
    if (failed > 0) {
      return this.failed(`${failed} tests failed. ALL tests must pass. Fix before proceeding.`);
    }

    // Check for TESTS_WRITTEN section
    if (!output.result.includes('TESTS_WRITTEN:')) {
      return this.failed('No TESTS_WRITTEN section found. Must document which tests were created.');
    }

    return this.success(`${testCount} tests written, ${passed} passed`, { written: testCount, passed, failed }, output.result);
  }
}
