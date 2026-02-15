# /test-doubles Summary

> "Tests as Documentation. Tests as Safety Net. Hard-to-test code is poorly designed."

## Test Double Taxonomy

| Double | Use When | Verifies |
|--------|----------|----------|
| **Dummy** | Parameter required but unused | Nothing |
| **Stub** | Need controlled inputs | State only |
| **Spy** | Need to verify calls happened | After exercise |
| **Mock** | Behavior verification is primary | During exercise |
| **Fake** | Need realistic behavior (e.g., in-memory DB) | State only |

## Essential Patterns

| Pattern | Apply When |
|---------|------------|
| **Four-Phase Test** | Every test: Setup → Exercise → Verify → Teardown |
| **Minimal Fixture** | Only set up what the test needs |
| **Fresh Fixture** | Each test creates its own data |
| **State Verification** | Verify resulting state (`assertEquals`) |
| **Behavior Verification** | Verify interactions (`verify(mock).method()`) |

## Load Full Skill When

- Choosing between test double types in complex scenarios
- Debugging test smells (fragile, obscure, eager tests)
- Implementing custom assertions or test builders
- Shared fixture decisions

## Test Smells Quick Reference

```
SMELL                    SOLUTION
──────────────────────────────────────────────────────
Fragile test           → Test behavior, not structure
Obscure test           → Better names, test builders
Eager test             → Split into focused tests
Mystery guest          → Inline test data
Slow test              → Use fakes instead of real deps
Erratic test           → Remove shared state
```

## Ideal Test Properties

- **Fully automated** - No manual steps
- **Self-checking** - Pass/fail is obvious
- **Repeatable** - Same result every run
- **Independent** - No test affects another
- **Deterministic** - No flaky tests

## HARD GATES (mandatory before writing tests)

- [ ] **Mock target audit (CRITICAL):** For every mock/stub/spy, answer: is this replacing a DEPENDENCY or the SYSTEM UNDER TEST? If you're mocking the module you're testing, delete the mock and test the real implementation.
  - Testing `keychain.ts`? Mock `crypto.ts` (dependency) ✓. Mock `storage.ts` I/O (dependency) ✓. Mock `keychain.ts` itself ✗.
- [ ] **Mock fidelity:** Does each mock behave like the real thing? If your mock returns hardcoded values that the real implementation never would, your test proves nothing.
- [ ] **Integration escape hatch:** For every module that interacts with I/O (filesystem, network, database), at least one test uses the REAL implementation with a temp directory/test server/in-memory DB. Mocked unit tests alone miss real-world failures.
- [ ] **Stub smell check:** If your test setup is longer than the test itself, you're mocking too much. Simplify the design so less mocking is needed.
- [ ] **Test the contract, not the implementation:** Does your test break when you refactor internals? If yes, it's testing implementation details. Rewrite to test observable behavior only.

## Concrete Checks (MUST ANSWER)

1. **List every mock, stub, and spy. For each: is the mocked module the thing under test or a dependency?** If you mocked the thing under test, delete the mock. You are testing nothing.
2. **Does any mock reimplement more than 5 lines of the real module?** If yes, you are testing the mock, not the code. Replace with a simpler stub or use the real implementation.
3. **For each mock return value: can the real implementation actually produce that value?** If your mock returns `{ success: true, data: [] }` but the real function never returns an empty array on success, your test passes for impossible inputs.
4. **Is the test setup longer than the test itself?** Count lines of mock/stub setup vs lines of exercise+verify. If setup > exercise+verify, you are mocking too much -- simplify the design.
5. **Remove all mocks mentally -- does the test still describe a real scenario?** If the test only makes sense in the presence of mocks (testing that mock A called mock B), it tests wiring, not behavior. Rewrite or delete.
