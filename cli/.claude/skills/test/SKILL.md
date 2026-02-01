---
name: test
description: Write and run tests with mandatory verification. Test files must exist and tests must execute.
---

# /test [level]

Write tests at specified level(s) using testing canon patterns. **Tests must be written AND executed.**

## First: Activate Workflow

**Before any other action**, activate this workflow session:

```bash
mkdir -p .claude && echo '{"skill":"test","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Levels

- `/test unit` - Unit tests only (pure logic, mocked dependencies)
- `/test integration` - Integration tests only (component interactions)
- `/test e2e` - E2E tests only (user journeys)
- `/test all` - All appropriate levels (default)
- `/test` - Same as `/test all`

## Target

If a path argument is provided after level, test that file/directory.
If no path, test the code most recently written or modified in this session.

## Canon Sources

- **Dodds**: Testing Trophy - integration tests are the sweet spot
- **Meszaros**: Test doubles (stub/spy/mock/fake as appropriate)
- **Feathers**: Characterization tests for legacy code

## Process

1. **Detect** language/framework from file extensions
2. **Analyze** code to determine appropriate test levels
3. **Write** tests using idiomatic tools
4. **Run** tests to verify they execute
5. **Report** results with counts

---

## VERIFICATION (MANDATORY - DO NOT SKIP)

**You MUST execute these commands and show output before claiming completion.**

### Step 1: Verify Test Files Were Created

```bash
# List test files created/modified
ls -la <test-files>

# Show test file count
find . -name "*.test.*" -o -name "*.spec.*" | wc -l
```

### Step 2: Show Test File Contents (Summary)

```bash
# Show test names/descriptions
grep -h "describe\|it\|test(" <test-files> | head -30
```

### Step 3: Run Tests and Show Output

```bash
# Actually run the tests - show REAL output
npm test
# or: npx jest
# or: npx vitest
# or: pytest
# or: go test ./...
```

**You MUST show the actual test runner output, not a summary.**

### Step 4: Verify Test Counts

```bash
# Count tests in files
grep -c "it(\|test(" <test-files>
```

### Completion Criteria (ALL must be TRUE)

| Criterion | Evidence Required | Pass? |
|-----------|-------------------|-------|
| Test files exist | `ls -la` shows test files | [ ] |
| Tests have content | `grep` shows test descriptions | [ ] |
| Tests were executed | Actual test runner output shown | [ ] |
| Test count documented | Number of tests stated | [ ] |
| Pass/fail status shown | Test runner shows results | [ ] |

**If ANY criterion fails: write more tests or fix failures. Do not report complete.**

---

## Output Format

```markdown
## Tests: [target]

### Test Files Created

```bash
$ ls -la src/__tests__/
-rw-r--r--  1 user  staff  3421 Jan 15 10:30 feature.test.ts
-rw-r--r--  1 user  staff  2103 Jan 15 10:30 utils.test.ts

$ find . -name "*.test.*" | wc -l
2
```

### Test Descriptions

```bash
$ grep -h "describe\|it(" src/__tests__/*.test.ts
describe('Feature', () => {
  it('should handle valid input', () => {
  it('should reject invalid input', () => {
  it('should handle edge cases', () => {
describe('Utils', () => {
  it('should format correctly', () => {
```

### Test Execution

```bash
$ npm test

 PASS  src/__tests__/feature.test.ts
 PASS  src/__tests__/utils.test.ts

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        1.234s
```

### Summary

| Level | Count | Status |
|-------|-------|--------|
| Unit | 5 | ✓ Pass |
| Integration | 0 | - |
| E2E | 0 | - |

TEST_VERIFIED
```

**The marker `TEST_VERIFIED` may ONLY appear if all criteria pass.**

---

## Anti-Patterns (Immediate Failure)

- Claiming "tests written" without showing `ls -la` of test files
- Not showing actual test runner output
- Saying "all tests pass" without the test runner output
- Test files with no actual test cases
- Skipping test execution ("I'll run them later")
- Summarizing results without showing the actual output
