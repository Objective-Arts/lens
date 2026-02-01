# The 10 Phases

What each phase does and why it exists.

---

## Overview

Ralph processes each PRD item through 10 phases:

```
1.  plan               → Understand requirements, design approach
2.  structure-first    → Define types and interfaces
3.  implement          → Write the code
4.  refactor-check     → Clean up, simplify
5.  independent-review → Code review via Gemini (bugs, edge cases, quality)
6.  static-analysis    → Code analysis (Qodana)
7.  test               → Write and run tests
8.  doc-code           → Generate documentation
9.  security-review    → Adversarial security review (think like an attacker)
10. production-readiness → Final production checks and fixes
```

Each phase has a specific purpose and catches specific types of issues.

---

## Phase 1: Plan

**Purpose**: Understand what to build before building it.

**What happens**:
- Analyzes the PRD item
- Identifies files to create/modify
- Lists functions with signatures
- Defines types needed
- Specifies invariants
- Notes security considerations
- Lists test cases

**Output**: A plan file in `.claude/plans/`

**Experts loaded**: kernighan, pike, dijkstra, liskov

**Issues caught**:
- Misunderstood requirements
- Missing edge cases
- Wrong decomposition
- Scope creep

**Why it matters**: Bugs in understanding compound. If you misunderstand the requirement, everything built on that is wrong.

---

## Phase 2: Structure-First

**Purpose**: Design data structures before writing logic.

**What happens**:
- Creates TypeScript interfaces
- Defines type aliases
- Establishes contracts between components
- Documents expected behavior

**Experts loaded**: cherny, bloch, liskov

**Issues caught**:
- Type mismatches
- Interface inconsistencies
- Missing fields
- Wrong relationships

**Why it matters**: Data structures shape everything. Get them right and the code follows naturally. Get them wrong and you're fighting the types forever.

> "Show me your data structures, and I won't usually need your code; it'll be obvious."
> — Linus Torvalds

---

## Phase 3: Implement

**Purpose**: Write the actual code.

**What happens**:
- Implements functions from the plan
- Follows the defined structure
- Applies expert coding patterns
- Creates files as specified

**Experts loaded**: Language-specific (cherny, crockford, abramov for React, etc.)

**Issues caught**:
- Implementation bugs
- Deviations from plan
- Missed requirements

**Why it matters**: With plan and structure defined, implementation is focused. No designing while coding.

---

## Phase 4: Refactor-Check

**Purpose**: Clean up immediately after implementing.

**What happens**:
- Removes duplication
- Simplifies complex logic
- Applies consistent naming
- Ensures functions are small
- Verifies tests still pass

**Experts loaded**: fowler-refactoring, feathers

**Issues caught**:
- Code smells
- Unnecessary complexity
- Inconsistent patterns
- Duplication

**Why it matters**: Fresh code is easiest to refactor. Wait a week and you've forgotten why it was written that way.

---

## Phase 5: Independent Review

**Purpose**: Fresh perspective on code quality.

**What happens**:
- Gemini reviews the changes
- Looks for bugs and logic errors
- Identifies edge cases
- Checks code quality
- Suggests improvements

**Tool**: Gemini MCP server

**Issues caught**:
- Logic errors
- Unhandled edge cases
- Code quality issues
- Potential bugs

**Why it matters**: A different AI catches what the implementer missed. Fresh eyes find what familiar eyes overlook.

---

## Phase 6: Static Analysis

**Purpose**: Automated code quality checks.

**What happens**:
- Qodana scans the codebase
- Identifies anti-patterns
- Finds potential bugs
- Checks style consistency

**Tool**: Qodana MCP server

**Issues caught**:
- Known anti-patterns
- Potential null references
- Unused code
- Style violations
- Common bugs

**Why it matters**: Static analysis catches known categories of bugs automatically. It's cheap insurance.

---

## Phase 7: Test

**Purpose**: Verify the implementation works.

**What happens**:
- Writes unit tests
- Writes integration tests if needed
- Runs the test suite
- Verifies expected behavior

**Experts loaded**: meszaros, dodds, fowler-test

**Issues caught**:
- Behavior bugs
- Regression risks
- Undocumented assumptions
- Edge case failures

**Why it matters**: Tests verify the code does what was intended. They also document expected behavior for future developers.

---

## Phase 8: Doc-Code

**Purpose**: Generate documentation.

**What happens**:
- Adds JSDoc/TSDoc comments
- Creates API documentation
- Writes usage examples
- Documents architectural decisions

**Experts loaded**: procida, strunk-white, zinsser

**Issues caught**:
- Undocumented APIs
- Missing examples
- Unclear interfaces

**Why it matters**: Good documentation prevents misuse. It's cheaper to document now than answer questions forever.

---

## Phase 9: Security Review

**Purpose**: Adversarial security analysis.

**What happens**:
- Gemini reviews with attacker mindset
- Looks for security vulnerabilities
- Checks authentication/authorization
- Reviews data handling
- Identifies injection points

**Tool**: Gemini MCP server

**Issues caught**:
- Injection vulnerabilities (SQL, XSS, etc.)
- Authentication/authorization flaws
- Sensitive data exposure
- Security misconfigurations
- Cryptographic weaknesses

**Why it matters**: Security issues are expensive in production. An adversarial review thinks like an attacker before attackers do.

---

## Phase 10: Production Readiness

**Purpose**: Final checks before production.

**What happens**:
- Verifies error handling is complete
- Checks configuration is externalized
- Validates resilience patterns
- Reviews operational concerns
- Confirms logging/monitoring

**Issues caught**:
- Missing error handling
- Hardcoded configuration
- Missing retry logic
- Insufficient logging
- Operational blind spots

**Why it matters**: Production has different requirements than development. This phase catches what works locally but fails in production.

---

## Why This Order

The phases are ordered to catch issues when they're cheapest to fix:

| Phase | Catches | Cost to Fix Here |
|-------|---------|------------------|
| Plan | Requirements bugs | Minutes |
| Structure | Design bugs | Minutes |
| Implement | Coding bugs | Minutes |
| Refactor | Code smells | Minutes |
| Review | Logic bugs | Hours |
| Analysis | Known patterns | Hours |
| Test | Behavior bugs | Hours |
| Doc | Misuse bugs | Days (prevented) |
| Security | Security holes | Days (prevented) |
| Production | Ops issues | Days (prevented) |

A bug that reaches production costs days or weeks. The same bug caught in planning costs minutes.

---

## Phase Customization

### Skip a Phase

```bash
ralph PRD.md --skip-review
```

### Change Expert Loading

In `config/workflow-phases.yaml`:

```yaml
plan:
  experts:
    - kernighan
    - my-custom-expert
```

### Add Dynamic Experts

In `config/keyword-detection.yaml`:

```yaml
my_domain:
  patterns:
    - "my keyword"
  experts:
    - my-domain-expert
```

---

## Phase Dependencies

```
plan ──────────────────────────────────┐
  │                                    │
  ▼                                    ▼
structure-first ─────────────────► implement
                                       │
                                       ▼
                                refactor-check
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            independent-review  static-analysis        test
                                       │
                                       ▼
                                   doc-code
                                       │
                                       ▼
                               security-review
                                       │
                                       ▼
                            production-readiness
```

---

## Summary

Each phase has one job:
1. **Plan**: What to build
2. **Structure**: Data shapes
3. **Implement**: The code
4. **Refactor**: Clean it up
5. **Review**: Find logic issues
6. **Analyze**: Find known patterns
7. **Test**: Verify behavior
8. **Document**: Explain it
9. **Security**: Find vulnerabilities
10. **Production**: Ensure it's deployable

Together, they build quality in rather than inspecting it at the end.
