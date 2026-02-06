/**
 * Test phase - write and run tests for implemented code.
 *
 * Experts: test-doubles, test-strategy, react-test, testability, legacy
 */

import { execSync } from 'child_process';
import { BasePhase, PhaseContext, PhaseResult } from './types.js';
import { runClaude } from '../process/claude.js';
import { extractError } from '../parsers/claude-stream.js';

const BUILD_TESTS_PROMPT = `## NON-NEGOTIABLE: WRITE TESTS AND RUN THEM

THIS PHASE FAILS IF:
- TEST_COUNT is 0 or missing → "No tests were written"
- TESTS_RUN is not "yes" → "Tests were not run"
- TESTS_FAILED > 0 → "Tests failed"

TO PASS THIS PHASE YOU MUST:
1. Use Write tool to create .test.ts file(s)
2. Run: npm test OR npx vitest run
3. Output EXACT format below

---

Write tests for the implemented code and RUN them.

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

## REQUIRED OUTPUT FORMAT (copy this structure)

TESTS_WRITTEN:
- src/feature.test.ts: should handle valid input, should reject invalid input, should handle edge case

TESTS_RUN: yes
TESTS_PASSED: 3
TESTS_FAILED: 0
TEST_COUNT: 3

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

  /** Find test files modified in the last 10 minutes. */
  private findRecentTestFiles(projectPath: string): string[] {
    try {
      const result = execSync(
        'find . -name "*.test.ts" -o -name "*.spec.ts" | xargs ls -lt 2>/dev/null | head -5',
        { cwd: projectPath, encoding: 'utf-8', timeout: 5000 }
      );
      return result.split('\n')
        .filter(line => line.includes('.test.ts') || line.includes('.spec.ts'))
        .map(line => line.split(' ').pop() || '')
        .filter(Boolean)
        .slice(0, 3);
    } catch {
      return [];
    }
  }

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
      // Check if test files were actually created but TEST_COUNT not reported
      const recentTestFiles = this.findRecentTestFiles(projectPath);
      if (recentTestFiles.length > 0) {
        return this.failed(
          `Test files created (${recentTestFiles.join(', ')}) but TEST_COUNT not reported. ` +
          'Re-run with proper output format: TESTS_WRITTEN, TESTS_RUN: yes, TEST_COUNT: N'
        );
      }
      return this.failed(
        'No tests were written. You MUST: 1) Write test file with Write tool 2) Run npm test 3) Report TEST_COUNT'
      );
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
