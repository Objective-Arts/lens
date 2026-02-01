---
name: test
description: Write and run tests at specified level(s). Levels: unit, integration, e2e, all.
---

# /test [level]

Write and run tests using testing canon patterns.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"test","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Step 0: Load Expert Context (MANDATORY)

Before writing tests, read these expert skills:

```
Read: .claude/skills/dodds/SKILL.md       (Testing Trophy, integration-first)
Read: .claude/skills/meszaros/SKILL.md    (xUnit patterns, test doubles)
Read: .claude/skills/fowler-test/SKILL.md (test pyramid)
Read: .claude/skills/feathers/SKILL.md    (characterization tests)
```

Apply these principles throughout testing. Skip if files don't exist.

## Levels

- `/test unit` - Unit tests only (pure logic, mocked dependencies)
- `/test integration` - Integration tests only (component interactions, APIs)
- `/test e2e` - E2E tests only (user journeys, full stack)
- `/test all` - All appropriate levels (default)
- `/test` - Same as `/test all`

## Target

If a path argument is provided after level, test that file/directory.
If no path, test the code most recently written or modified in this session.

## Canon Sources

- **Dodds**: Testing Trophy - integration tests are the sweet spot
- **Fowler**: Test pyramid - right level for the concern
- **Meszaros**: Test doubles (stub/spy/mock/fake as appropriate)
- **Feathers**: Characterization tests for legacy code

## Test Level Decision Tree

```
Is it pure logic (no I/O)?
├── Yes → Unit test (Meszaros patterns)
└── No → Does it access database/external service?
    ├── Yes → Integration test (Fowler pyramid middle)
    └── No → Does it cross system boundaries?
        ├── Yes → Integration test
        └── No → Is it a critical user journey?
            ├── Yes → E2E test (Dodds: sparingly)
            └── No → Unit or integration based on complexity
```

## Language-Specific Tools

| Language | Unit | Integration | E2E |
|----------|------|-------------|-----|
| **Java** | JUnit + Mockito | Spring TestContext, MockMvc | Selenium, REST Assured |
| **TypeScript/Angular** | Jasmine + TestBed | HttpClientTestingModule | Playwright, Cypress |
| **TypeScript/React** | Jest + RTL | MSW, Supertest | Playwright, Cypress |
| **Python** | pytest + unittest.mock | pytest + fixtures | pytest + Selenium |
| **Go** | testing + testify | httptest | chromedp |
| **Rust** | #[test] + mockall | integration tests | - |
| **C#/.NET** | xUnit + Moq | TestServer | Playwright |

## Process

1. **Detect** language/framework from file extensions and project structure
2. **Analyze** code to determine appropriate test levels
3. **Write** tests at specified level(s) using idiomatic tools
4. **Run** tests to verify they pass
5. **Report** results

## Output Format

```markdown
## Test Results

### Tests Written:
| Level | File | Count |
|-------|------|-------|
| Unit | [test file] | N |
| Integration | [test file] | N |

### Run Results:
TESTS_WRITTEN: N
TESTS_PASSED: N
TESTS_FAILED: N
TEST_COMPLETE
```

## Legacy Code (Feathers patterns)

If code is untested legacy:
1. Write **characterization tests** first (capture current behavior)
2. Then add focused tests for new/changed behavior
