---
name: static-analysis
description: Run Qodana static analysis. ALL issues must be fixed. No exceptions.
---

# /static-analysis [path]

Run Qodana static analysis. ALL issues must be fixed.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"static-analysis","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO EXCEPTIONS

You MUST fix EVERY issue Qodana and lint find. ALL of them. No exceptions.

## FORBIDDEN (Phase will FAIL if detected):

- Marking issues as "false positive" without proof
- Saying "this is by design"
- Skipping issues because they're LOW severity
- Punting issues to "future work"
- Making judgment calls about what's worth fixing
- Leaving ANY issue unfixed

**If an analyzer found it, YOU FIX IT. Period.**

## Process

### Step 1: Run Qodana Scan (MANDATORY)

```
mcp__qodana__qodana_scan
  projectDir: <project path>
```

### Step 2: Get All Problems

```
mcp__qodana__qodana_problems
  projectDir: <project path>
```

### Step 3: Run Linting

```bash
npx tsc --noEmit
npm run lint
```

### Step 4: Fix ALL Issues (MANDATORY - NO EXCEPTIONS)

For EACH issue:
1. Read the affected file
2. Fix with Edit tool
3. Verify the fix
4. Record in ISSUES_FIXED

The ONLY exception: third-party library code with documented evidence.

## REQUIRED Output Format

```
QODANA_RESULT: called - [N] issues

ISSUES_FOUND:
[SEVERITY] description (file:line) [source: qodana/lint]

ISSUES_FIXED:
[SEVERITY] description - FIXED

UNFIXED: 0 (must be zero or phase fails)

ANALYSIS_ISSUES: N
VERIFIED_CLEAN: yes
```

## Validation (Phase will FAIL if violated)

- Qodana not called (unless unsupported project)
- UNFIXED > 0
- Contains "false positive", "by design", "won't fix" without evidence
