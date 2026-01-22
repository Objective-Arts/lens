---
name: build-from-plan
description: "Resume implementation from an existing .plan.md file"
---

# /build-from-plan Command

Resume implementation from an approved .plan.md file. Use when returning to work after planning, or when splitting planning and implementation across sessions.

## Usage

```bash
# Use default .plan.md in project root
> --build-from-plan

# Specify a plan file
> --build-from-plan auth-system.plan.md

# Combine with other flags
> --build-from-plan --test all --review-hard
```

## When to Use

- Returning to work after creating a plan in a previous session
- Plan was approved but implementation was deferred
- Splitting planning and implementation across sessions
- Team member picking up a task from another's plan
- Resuming after context window exhaustion during long implementation

## Key Difference from Fresh Start

| Fresh Start | --build-from-plan |
|-------------|-------------------|
| Explores codebase | Trusts plan's analysis |
| Asks clarifying questions | Uses plan's decisions |
| May propose alternatives | Follows plan exactly |
| Creates its own structure | Uses plan's structure |
| Re-analyzes requirements | Assumes requirements settled |

## Behavior

When invoked, perform these steps:

### 1. Locate and Read Plan File

Look for plan file in this order:
1. Specified file if provided: `--build-from-plan custom.plan.md`
2. `.plan.md` in project root
3. Most recent `.plan.md` in project

If not found:
```
No .plan.md found.

Options:
1. Create a plan with: --plan
2. Specify a plan file: --build-from-plan path/to/plan.md
```

### 2. Parse Plan Structure

Extract from the plan:
- **Files to create** - with paths and descriptions
- **Files to modify** - with change descriptions
- **Function signatures** - exact signatures to implement
- **Data flow** - how data moves through the system
- **Implementation notes** - context for decisions

### 3. Validate Plan Currency

Check if plan is still valid:

```
✓ Checking plan validity...

Files referenced in plan:
  ✓ src/routes/index.ts exists
  ✓ src/models/user.ts exists
  ✗ src/auth/legacy.ts NOT FOUND (plan references line 45)

Plan age: 3 days
```

**If issues found:**
```
Plan references files that have changed or don't exist.

Options:
1. Update plan first (recommended): --plan
2. Proceed anyway and adapt: --build-from-plan --force
3. Cancel and investigate
```

### 4. Summarize and Confirm

Before implementing:

```markdown
## Plan Summary

**Feature:** Authentication System
**Plan created:** 2024-01-15
**Status:** Approved, not yet implemented

### Work Items
- 3 files to create
- 2 files to modify
- 4 functions to implement

### Files to Create
1. src/auth/authService.ts - Token generation/verification
2. src/auth/authMiddleware.ts - Route protection
3. src/auth/authController.ts - Login/logout endpoints

### Files to Modify
1. src/routes/index.ts - Mount auth routes
2. src/models/user.ts - Add refreshToken field

### Key Functions
1. generateAccessToken(user: User): string
2. generateRefreshToken(user: User): string
3. verifyAccessToken(token: string): Payload | null
4. requireAuth(req, res, next): void

Proceeding with implementation...
```

### 5. Implement According to Plan

For each item in the plan:

1. **Follow exact structure** - Don't deviate from plan
2. **Use specified signatures** - Implement functions as documented
3. **Honor data flow** - Respect the documented architecture
4. **Apply canon lenses** - Even when following plan, apply quality standards
5. **Mark progress** - Update status as work completes

### 6. Update Plan File

As implementation progresses, update the plan:

```markdown
## Status
In Progress → 2024-01-18

## Implementation Progress
- [x] src/auth/authService.ts - COMPLETE
- [x] src/auth/authMiddleware.ts - COMPLETE
- [ ] src/auth/authController.ts - IN PROGRESS
- [ ] src/routes/index.ts
- [ ] src/models/user.ts

## Notes
- Changed generateRefreshToken return type to include expiry
- Added rate limiting consideration per Schneier canon
```

### 7. Report Completion

```markdown
## Plan Implementation Complete

### Files Created
- [x] src/auth/authService.ts (125 lines)
- [x] src/auth/authMiddleware.ts (45 lines)
- [x] src/auth/authController.ts (89 lines)

### Files Modified
- [x] src/routes/index.ts (+12 lines)
- [x] src/models/user.ts (+8 lines)

### Functions Implemented
- [x] generateAccessToken - per plan signature
- [x] generateRefreshToken - per plan signature
- [x] verifyAccessToken - per plan signature
- [x] requireAuth - per plan signature

### Deviations from Plan
1. Added rate limiting to login endpoint (security canon)
2. Changed refresh token storage from field to separate table

### Quality Verification
- [x] All functions under 30 lines
- [x] Separation of concerns maintained
- [x] Canon lenses applied

### Next Steps
Consider running: --test all --review-hard
```

## Plan File Format

The command expects this structure (but adapts to variations):

```markdown
# [Feature Name] Plan

## Status
Approved | In Progress | Complete

## Context
[Why this feature exists]

## Approach
[High-level strategy chosen]

## Files to Create
- path/to/file.ts - description

## Files to Modify
- path/to/existing.ts - what changes

## Function Signatures
```typescript
functionName(param: Type): ReturnType
```

## Data Flow
[Diagram or description]

## Risks and Mitigations
[Known risks]

## Implementation Notes
[Context for implementation]
```

## Error Handling

### Plan Not Found
```
No .plan.md found in project root.

Did you mean to:
1. Create a plan first? Use: --plan
2. Specify a plan file? Use: --build-from-plan path/to/plan.md
```

### Plan References Missing Files
```
Plan references src/auth/legacy.ts which no longer exists.

The plan may be outdated. Options:
1. Update the plan: --plan
2. Proceed and adapt: --build-from-plan --force
3. Cancel
```

### Plan is Stale
```
Plan was created 45 days ago. Codebase may have changed significantly.

Recommendations:
1. Review the plan for relevance
2. Consider creating a new plan: --plan

Proceed anyway? (--force to skip this warning)
```

### Conflicting Changes
```
While implementing, found conflict:

Plan says: User model has email field
Current: User model has email AND username fields

Options:
1. Adapt to current state
2. Follow plan strictly
3. Stop and update plan
```

## Combining with Other Flags

Common combinations:

```bash
# Build then test
> --build-from-plan --test all

# Build, test, and review
> --build-from-plan --test all --review-hard

# Build and document
> --build-from-plan --doc-code

# Full pipeline
> --build-from-plan --test all --doc-code --review-hard
```

## Relationship to --plan

These flags work together:

```
--plan          Creates .plan.md, enters plan mode, explores codebase
                Outputs: Approved .plan.md file

--build-from-plan   Reads .plan.md, implements without re-exploring
                    Inputs: Existing .plan.md file
```

Typical workflow:
```
Day 1: Build the auth system --plan
       [Explores, creates .plan.md, gets approval]
       [Session ends or context exhausted]

Day 2: --build-from-plan
       [Reads .plan.md, implements per plan]
       [Tests and reviews]
```

## Options

| Option | Effect |
|--------|--------|
| `--force` | Skip validation warnings, proceed anyway |
| `[filename]` | Use specific plan file instead of .plan.md |
| `--dry-run` | Show what would be implemented without doing it |
| `--status` | Show current plan status without implementing |
