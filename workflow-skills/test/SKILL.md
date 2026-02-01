---
name: test
description: Write and run tests. Tests are REQUIRED. All must pass.
---

# /test [level]

Write and RUN tests. Tests are REQUIRED, not optional.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"test","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST write and run tests. Not "consider testing" - WRITE TESTS.

1. **MINIMUM COVERAGE** - At least one test per public function
2. **HAPPY PATH** - Test the expected behavior works
3. **ERROR CASES** - Test that errors are handled correctly
4. **EDGE CASES** - Test boundary conditions
5. **MUST RUN** - Execute tests with npm test/vitest/jest and verify they pass
6. **ALL MUST PASS** - Zero failing tests allowed

## FORBIDDEN (Phase will FAIL if detected):

- Saying "testing would be beneficial" without writing tests
- Writing tests that don't run
- Leaving failing tests
- Skipping error case testing
- Writing trivial tests that don't verify behavior
- Not running the tests

## Levels

- `/test unit` - Unit tests only
- `/test integration` - Integration tests only
- `/test e2e` - E2E tests only
- `/test all` or `/test` - All appropriate levels

## Process

1. **Find Code** - Identify what needs testing
2. **Write Tests** - Create test files with real assertions
3. **Run Tests** - Execute and verify they pass
4. **Report** - Document what was tested

## REQUIRED Output Format

```markdown
## Tests: [target]

TESTS_WRITTEN:
- src/__tests__/user.test.ts: [test descriptions]
- src/__tests__/auth.test.ts: [test descriptions]

TESTS_RUN: yes (MANDATORY)
TESTS_PASSED: N
TESTS_FAILED: 0 (must be zero)
TEST_COUNT: N

COVERAGE:
- createUser: tested (happy path, validation error, duplicate email)
- validateToken: tested (valid, expired, malformed)

APPLIED:
- [expert]: [decision]

TEST_COMPLETE
```

## Validation (Phase will FAIL if violated)

- TEST_COUNT: 0 (no tests written)
- TESTS_RUN: no (tests not executed)
- TESTS_FAILED > 0 (failing tests)

## 🛑 MANDATORY STOP

After testing:
- DO NOT proceed to next phase
- DO NOT continue with "let me also..."

**Your turn ends here.** Output TEST_COMPLETE and STOP.
