# /meszaros Summary

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
