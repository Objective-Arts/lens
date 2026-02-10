/**
 * Retry logic for phase execution.
 *
 * Following clarity: small functions, clear control flow.
 */

/** Maximum retry attempts for self-correction. */
export const MAX_RETRIES = 5;

/** Correctable error patterns that warrant retry. */
const CORRECTABLE_PATTERNS = [
  /issues not fixed/i,
  /function.*is.*lines.*max.*30/i,
  /vague.*names/i,
  /missing.*sections/i,
  /vague language/i,
  /tests.*failed/i,
  /tests.*not.*run/i,
  /no.*created/i,
  /contains.*forbidden/i,
  /ISSUES_REMAINING.*[1-9]/i,
  /UNFIXED.*[1-9]/i,
  /CRITICAL.*HIGH.*issues/i,
  /tests.*not.*written/i,
  /no tests were written/i,
  /tests were not run/i,
  /must be fixed/i,
  /issues must be fixed/i,
  /\d+ tests? failed/i,
  /qodana.*not called/i,
  /gemini.*not called/i,
  /TEST_COUNT.*not.*reported/i,
  /no.*TESTS_WRITTEN/i,
];

export function isCorrectableFailure(error: string): boolean {
  return CORRECTABLE_PATTERNS.some(p => p.test(error));
}

function sanitizeErrorForPrompt(error: string): string {
  return error
    .replace(/```[\s\S]*?```/g, '[code removed]')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~`]/g, '')
    .slice(0, 500);
}

/** Get phase-specific guidance for retry attempts. */
function getPhaseSpecificGuidance(phase: string, error: string): string {
  if (phase === 'test' && (error.includes('No tests') || error.includes('TEST_COUNT'))) {
    return `WHAT TO DO:
1. Create test file(s) using Write tool
2. Run tests with: npm test OR npx vitest run
3. Report TEST_COUNT, TESTS_PASSED, TESTS_FAILED, TESTS_RUN: yes

EXAMPLE OUTPUT:
TESTS_WRITTEN:
- src/foo.test.ts: should handle valid input, should reject invalid input

TESTS_RUN: yes
TESTS_PASSED: 2
TESTS_FAILED: 0
TEST_COUNT: 2`;
  }

  if (phase === 'test' && error.includes('not run')) {
    return `WHAT TO DO:
1. Run: npm test OR npx vitest run (actually execute this command)
2. Check output for pass/fail counts
3. Report TESTS_RUN: yes with actual counts`;
  }

  if (phase === 'static-analysis' && (error.includes('CRITICAL') || error.includes('HIGH'))) {
    return `WHAT TO DO:
1. For each issue listed above, use Edit tool to fix the code
2. Re-run: npx tsc --noEmit to verify fix
3. Report each fix in ISSUES_FIXED section

EXAMPLE FIX:
Issue: [HIGH] TS6133: 'foo' is declared but never read (file.ts:5)
Fix: Remove the unused import with Edit tool
Verify: npx tsc --noEmit shows no errors`;
  }

  if (phase === 'static-analysis' && error.includes('Qodana')) {
    return `WHAT TO DO:
1. Call mcp__qodana__qodana_scan with projectDir: "."
2. Call mcp__qodana__qodana_problems to get issues
3. Fix any CRITICAL/HIGH issues found
4. Report QODANA_RESULT: called - N issues`;
  }

  return 'Review the error above and fix the specific issue mentioned.';
}

export function buildCorrectivePrompt(error: string, attempt: number, phaseName?: string): string {
  const sanitizedError = sanitizeErrorForPrompt(error);
  const phaseGuidance = phaseName ? getPhaseSpecificGuidance(phaseName, error) : '';

  return `## CORRECTION REQUIRED (Attempt ${attempt + 1}/${MAX_RETRIES})

FAILURE: ${sanitizedError}

${phaseGuidance}

You MUST fix this NOW. The same mistake will cause another failure.`;
}
