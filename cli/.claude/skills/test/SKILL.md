---
name: test
description: Write tests at specified level(s) using testing canon patterns. Levels: unit, integration, e2e, all. Works for any language.
---

# /test [level]

Write tests at specified level(s) using testing canon patterns.

## Levels

- `/test unit` - Unit tests only (pure logic, mocked dependencies)
- `/test integration` - Integration tests only (component interactions, APIs)
- `/test e2e` - E2E tests only (user journeys, full stack)
- `/test all` - Analyze and write at all appropriate levels (default)
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
3. **Apply** canon patterns (Dodds, Fowler, Meszaros, Feathers)
4. **Write** tests at specified level(s) using idiomatic tools
5. **Run** tests to verify they pass
6. **Report** coverage and results

## Output Format

```markdown
## Test Analysis

### Code Changed:
- `[file1]` - [description] ([language])
- `[file2]` - [description] ([language])

### Test Plan by Level:

**Unit Tests**:
- [test file]: [what it tests]

**Integration Tests**:
- [test file]: [what it tests]

**E2E Tests** (if applicable):
- [test file]: [what it tests]

### Tests Written:
- [x] N unit tests
- [x] N integration tests
- [x] N E2E tests

All tests passing.
```

## Legacy Code (Feathers patterns)

If code is untested legacy:
1. Write **characterization tests** first (capture current behavior)
2. Then add focused tests for new/changed behavior
