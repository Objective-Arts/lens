---
name: build-from-plan
description: Implement code from an approved plan with mandatory verification. Steps must be tracked and files must exist.
---

# /build-from-plan [plan-file]

Implement code from an approved plan file. Executes exactly per the plan with tracked progress.

## First: Activate Workflow

**Before any other action**, activate this workflow session:

```bash
mkdir -p .claude && echo '{"skill":"build-from-plan","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## When to Use

- After `/plan` has been approved
- After `/structure-first` has defined data structures
- When resuming work on a partially-implemented plan

## When NOT to Use

- Simple tasks that don't need a plan
- When the plan hasn't been approved yet
- When requirements have changed (update plan first)

## Plan File Location

Plans are stored in `.claude/plans/`:
- `.claude/plans/auth-system.md`
- `.claude/plans/[feature-name].md`

## Usage

```
/build-from-plan                    # Build from most recent plan
/build-from-plan auth-system        # Build from specific plan
/build-from-plan --resume           # Resume partially-completed plan
```

## Process

1. **Load Plan** - Read the plan file from `.claude/plans/`
2. **Verify Approval** - Confirm plan exists and is approved
3. **Execute Steps** - Implement each step in order
4. **Track Progress** - Mark completed steps
5. **Verify** - Confirm files created and code compiles

---

## VERIFICATION (MANDATORY - DO NOT SKIP)

**You MUST execute these commands and show output before claiming completion.**

### Step 1: Verify Plan File Exists

```bash
# Plan file must exist
cat .claude/plans/<plan-name>.md | head -30
```

### Step 2: List Implementation Steps from Plan

```bash
# Show the implementation steps
grep -A 20 "## Implementation Steps" .claude/plans/<plan-name>.md
```

### Step 3: Verify Files Created/Modified

```bash
# For each file listed in "Files to Modify" section, verify it exists
ls -la <each-file-from-plan>

# Show git status of changed files
git status --short
```

### Step 4: Verify Code Compiles/Lints

```bash
# TypeScript: verify no type errors
npx tsc --noEmit

# Or: run linter
npm run lint
```

### Step 5: Track Step Completion

**You MUST show which plan steps were completed:**

```markdown
### Plan Steps Status

| Step | Description | Status | Evidence |
|------|-------------|--------|----------|
| 1 | Create auth service | ✓ | src/auth/service.ts exists |
| 2 | Add middleware | ✓ | src/middleware/auth.ts exists |
| 3 | Update routes | ✓ | src/routes/index.ts modified |
```

### Completion Criteria (ALL must be TRUE)

| Criterion | Evidence Required | Pass? |
|-----------|-------------------|-------|
| Plan file exists | `cat .claude/plans/*.md` shows content | [ ] |
| All plan steps listed | Table shows each step | [ ] |
| Each step has status | ✓ or reason for incomplete | [ ] |
| Files exist | `ls -la` confirms each file | [ ] |
| Code compiles | `tsc --noEmit` or lint passes | [ ] |
| ≥80% steps complete | Count of ✓ vs total | [ ] |

**If ANY criterion fails: continue implementing. Do not report complete.**

---

## Output Format

```markdown
## Build Complete: [plan-name]

### Plan Loaded

```bash
$ cat .claude/plans/auth-system.md | head -10
# Plan: Auth System

## Problem Statement
Implement user authentication...
```

### Implementation Steps

```bash
$ grep -A 15 "## Implementation Steps" .claude/plans/auth-system.md
## Implementation Steps
1. Create auth service
2. Add auth middleware
3. Update routes
4. Add login endpoint
```

### Step Completion

| Step | Description | Status | Evidence |
|------|-------------|--------|----------|
| 1 | Create auth service | ✓ | `ls -la src/auth/service.ts` |
| 2 | Add auth middleware | ✓ | `ls -la src/middleware/auth.ts` |
| 3 | Update routes | ✓ | `git diff src/routes/index.ts` |
| 4 | Add login endpoint | ✓ | `ls -la src/routes/login.ts` |

### Files Created/Modified

```bash
$ git status --short
A  src/auth/service.ts
A  src/middleware/auth.ts
M  src/routes/index.ts
A  src/routes/login.ts
```

### Compilation Check

```bash
$ npx tsc --noEmit
(no output = success)
```

### Summary
- **Steps completed**: 4/4 (100%)
- **Files created**: 3
- **Files modified**: 1

BUILD_VERIFIED
```

**The marker `BUILD_VERIFIED` may ONLY appear if all criteria pass.**

---

## Anti-Patterns (Immediate Failure)

- Claiming build complete without showing plan file contents
- Not listing each implementation step with status
- Missing `ls -la` evidence for created files
- Skipping compilation/lint check
- Implementing features not in the plan
- Empty step completion table
- Less than 80% of steps completed without explanation
