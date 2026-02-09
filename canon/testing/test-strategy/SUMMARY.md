# /test-strategy Summary

> "Write tests at the lowest level that gives confidence. Unit tests for logic, integration tests for boundaries."

## Test Pyramid

```
     /\        E2E (10%) - Critical paths only
    /  \       Integration (20%) - Boundaries
   /    \      Unit (70%) - Business logic
  /──────\
```

## Essential Guidelines

| Test Type | Use For | Speed | Quantity |
|-----------|---------|-------|----------|
| **Unit** | Business logic, validations, algorithms | ms | Many |
| **Integration** | Database, APIs, component boundaries | seconds | Some |
| **E2E** | Critical user journeys (checkout, login) | minutes | Few |

## Quick Decision Guide

```
QUESTION                           ANSWER
──────────────────────────────────────────────────────
How to test business logic?      → Unit test
How to test database queries?    → Integration test
How to test user flows?          → E2E test (sparingly)
Tests too slow?                  → Move down the pyramid
Tests too brittle?               → Move down the pyramid
Missing bugs in production?      → Add integration tests
```

## Load Full Skill When

- Choosing between solitary (London) vs sociable (Detroit) unit tests
- Setting up database test isolation strategies (containers, rollback, in-memory)
- Designing CI test strategy (what runs when)
- Contract testing with external services

## Anti-Pattern: Ice Cream Cone

```
   ──────────────     Manual Testing (lots)
  /              \    E2E (lots)
 /────────────────\   Integration (some)
────────────────────  Unit (few)
```

**Problem:** Slow feedback, high maintenance, flaky tests.

## The 70/20/10 Rule

- **70% Unit** - Fast, focused, many
- **20% Integration** - Key boundaries
- **10% E2E** - Critical paths only

Don't duplicate coverage: if unit tests cover logic, don't repeat in integration.

## HARD GATES (mandatory before writing tests)

- [ ] **Pyramid compliance:** Count your tests by type. Unit > Integration > E2E. If integration tests are zero, your unit tests are probably testing mocks, not behavior.
- [ ] **Real I/O test exists:** For every module that reads/writes files, network, or database, at least ONE test uses real I/O (temp directory, test server). This is non-negotiable — mocked I/O tests hide the worst bugs.
- [ ] **Mutation survival:** Pick your 3 most critical functions. Mentally mutate a line (flip a comparison, remove a null check). Does a test fail? If not, add a test that catches the mutation.
- [ ] **Error path coverage:** For every catch block and error return, a test triggers it. If you can't trigger it in a test, either the error path is dead code or your test setup is insufficient.
- [ ] **No test-only code in production:** If you added a function, parameter, or export solely to make testing easier, your architecture is wrong. Redesign so the code is testable without test-specific hooks.

## Concrete Checks (MUST ANSWER)

1. **Do your integration tests cover real I/O paths?** For every module that does file, network, or database I/O: does at least one test use a real filesystem (tmp dir), real HTTP (test server), or real database (in-memory/container)? If all I/O tests use mocks only, real failures will reach production untested.
2. **Do any unit tests mock the system under test?** For each unit test file, check: is the module being imported and tested the same module being mocked? If yes, you are testing a mock, not your code. Delete the mock.
3. **Do E2E tests exist for every critical user path?** List the 3-5 most critical user workflows (login, checkout, data export, etc.). Does each have at least one end-to-end test? If not, which ones are missing?
4. **Count tests by type: is the pyramid right-side-up?** Unit tests > Integration tests > E2E tests. If integration or E2E tests outnumber unit tests, logic is being validated at the wrong layer.
5. **For each test, can you name the specific behavior it verifies?** If a test name is generic ("should work", "handles input") or you cannot state the behavior in one sentence without the word "and", split the test.
