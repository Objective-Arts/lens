---
name: defense-in-depth
description: "Running comprehensive multi-layer validation for critical code. Use when changes affect production, touch security-sensitive code, or require lint + types + tests + security scans together."
---

# DEFENSE-IN-DEPTH Pattern

**Intent**: Layer multiple validations, each catching different defects.

## The Pattern

```
      SKILL
    (Generate)
        │
        ▼
  ┌─────┬─────┬─────┬─────┐
  │     │     │     │     │
  ▼     ▼     ▼     ▼     ▼
HOOK  HOOK  HOOK  HOOK  STATIC
Lint  Type  Test  Sec   Analysis
  │     │     │     │     │
  └─────┴─────┴─────┴─────┘
              │
              ▼
          COMPLETE
```

## When to Use

- High-stakes code changes
- Security-sensitive code
- Production deployments
- When single validation isn't enough

## The Validation Layers

### Layer 1: LLM Judgment (Hooks)

What LLM-based validation catches:
- Style violations and canon adherence
- Pattern conformance
- Naming quality
- Code clarity issues
- Design principle violations

### Layer 2: Static Analysis

What static tools catch:
- Null dereferences
- Resource leaks
- Dead code
- Security vulnerabilities
- Type mismatches

### Layer 3: Runtime Tests

What tests catch:
- Logic errors
- Edge cases
- Integration issues
- Race conditions
- Behavior regressions

## Execution Steps

### Step 1: Generate with Intent

```
GENERATING with defense-in-depth mindset:
- Anticipating: lint, types, tests, security scan
- Pre-checking: obvious issues before submission
```

### Step 2: Run All Layers

Execute validation layers in parallel or sequence:

```bash
# Layer 1: Fast checks
npm run lint
npm run typecheck

# Layer 2: Static analysis
npm run analyze  # or tool-specific commands

# Layer 3: Tests
npm run test
npm run test:integration

# Layer 4: Security (if applicable)
npm audit
```

### Step 3: Aggregate Results

```
DEFENSE-IN-DEPTH RESULTS:
┌─────────────────┬────────┬─────────────────────┐
│ Layer           │ Status │ Issues              │
├─────────────────┼────────┼─────────────────────┤
│ Lint            │ PASS   │ -                   │
│ Types           │ PASS   │ -                   │
│ Unit Tests      │ FAIL   │ 2 assertions failed │
│ Static Analysis │ PASS   │ -                   │
│ Security        │ WARN   │ 1 advisory          │
└─────────────────┴────────┴─────────────────────┘
```

### Step 4: Fix All Layers

Address issues from ALL failing layers before proceeding:
- Don't fix tests while ignoring security warnings
- Don't pass lint while failing types
- Every layer matters

## What Each Layer Catches

| Layer | Catches | Misses |
|-------|---------|--------|
| Lint/Style | Formatting, conventions | Logic errors |
| Types | Type mismatches, nulls | Runtime behavior |
| Unit Tests | Logic, edge cases | Integration issues |
| Integration | System behavior | Security issues |
| Security Scan | Known vulns, patterns | Novel attacks |
| Static Analysis | Code smells, leaks | Business logic |

## Anti-Patterns

```
❌ Single layer only ("tests pass, ship it")
❌ Skipping layers to save time
❌ Ignoring warnings from any layer
❌ Same tool checking same thing twice

✅ Each layer catches different defects
✅ All layers must pass
✅ Warnings treated as failures
✅ Complementary validation, not redundant
```

## Completion Criteria

- [ ] Lint: All rules passing
- [ ] Types: No type errors
- [ ] Tests: All tests green
- [ ] Static Analysis: No critical issues
- [ ] Security: No vulnerabilities
- [ ] All layers validated, none skipped

## The Rule

> **Defense in depth means EVERY layer passes. One green layer doesn't excuse a red one.**
