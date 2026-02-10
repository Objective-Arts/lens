---
name: quick-clean
description: Fast cleanup for AI smells and common problems. No external tools. Run after code changes.
---

# /quick-clean [path]

Fast code review that **finds and fixes** AI-generated antipatterns and common problems.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/quick-clean` is the **light workflow** for fast cleanup. No planning, no external tools — just find issues and fix them.

**Run after `/quick-edit` or any code modification, before commit.**

Use this when:
- You just made changes and want a quick sanity check
- You suspect AI-generated code smells
- You want to clean up before committing
- You need fast feedback without full pipeline

**If you need thorough analysis → use `/improve` instead.**

## What This Fixes

### AI-Generated Antipatterns

| Smell | What to Look For | Fix |
|-------|------------------|-----|
| Over-abstraction | Factory/Builder/Wrapper used only once | Inline it |
| Defensive paranoia | `if (x != null)` when x can never be null | Remove check |
| Reimplementing stdlib | Custom `deepClone`, `isEmpty`, `capitalize` | Use library |
| Comment spam | `// loop through users` above `for...of` | Delete comment |
| Speculative features | Config option with only one value used | Remove option |
| Enterprise naming | `AbstractUserFactoryManager` | Simplify name |
| Wrapper classes | Class that just delegates to another | Inline or remove |
| Unused parameters | `function foo(a, b, c)` but `c` never used | Remove parameter |
| Over-generic types | `Result<T, E, M, C>` for simple return | Simplify type |

### Common Problems

| Problem | Threshold | Fix |
|---------|-----------|-----|
| Vague names | `data`, `result`, `temp`, `item`, `info` | Rename to intent |
| Magic numbers | Hardcoded values | Extract to constant |
| Dead code | Unused imports, unreachable code | Delete |
| Redundant code | Duplicate logic | Extract or remove |

### Naming Smells

| Smell | Example | Fix |
|-------|---------|-----|
| Generic -er | `Processor`, `Handler`, `Manager` | Name for what it does |
| Impl suffix | `UserServiceImpl` | `UserService` if only one |
| I- prefix | `IUserService` | `UserService` (TS isn't C#) |
| Type in name | `userString`, `countInt` | `user`, `count` |
| Negative booleans | `isNotValid`, `hasNoErrors` | `isValid`, `hasErrors` |

## Process

### Step 1: Read the Code

Read target files completely. If no path given, check recently modified files (git diff).

### Step 2: Find Issues

Go through the tables above systematically. Note each smell/problem with file:line.

### Step 3: Fix Each Issue

For each issue found:
1. Apply the fix from the table
2. Verify the fix doesn't break anything
3. Move to next issue

### Step 4: Report

List what was fixed.

## Output Format

```markdown
## Quick Clean: [path]

### Fixed

| File:Line | Via | Issue | What Was Done |
|-----------|-----|-------|---------------|
| src/user.ts:45 | refactoring | Over-abstraction | Inlined `UserFactory` - only created one type |
| src/api.ts:23 | clarity | Defensive paranoia | Removed null check on required field |
| src/utils.ts:12 | clarity | Vague name | Renamed `data` → `userInput` |
| src/service.ts:67 | refactoring | Comment spam | Deleted `// Get the user` above `getUser()` |

### Summary

| Category | Fixed |
|----------|-------|
| AI Antipatterns | N |
| Common Problems | N |
| Naming Smells | N |
| **Total** | **N** |

QUICK_CLEAN_COMPLETE
```

## Self-Test Questions

Apply these while fixing:

1. **Would I mass-delete this in code review?** → Delete it
2. **Does this abstraction have more than one use?** → If no, inline it
3. **Would a new team member understand this name?** → If no, rename it
4. **Is this check possible to fail?** → If no, remove it
5. **Did I write this or did I request it?** → If not requested, remove it

## What NOT to Fix

Leave these for dedicated skills:

| Issue | Use Instead |
|-------|-------------|
| Long functions (>30 lines) | `/refactor-check-fix` |
| Deep nesting (>3 levels) | `/refactor-check-fix` |
| Complex refactoring | `/improve` |
| Security issues | `/adversarial-security-review` |
| Static analysis | `/qodana-fix` |

## Canon Skills Invoked

- `/clarity` - Kernighan naming principles
- `/refactoring` - Fowler's code smells
- `/style` - Consistency with codebase

## vs Other Workflows

| Workflow | When to Use | Overhead |
|----------|-------------|----------|
| `/build` | New feature from scratch | Heavy (9 phases) |
| `/improve` | Refine existing code | Heavy (9 phases) |
| `/quick-edit` | Add field, rename, small fix | Light (checklist only) |
| `/quick-clean` | Fast AI smell cleanup | Light (review + fix) |
