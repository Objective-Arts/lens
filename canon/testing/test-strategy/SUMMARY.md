# /fowler-test Summary

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
