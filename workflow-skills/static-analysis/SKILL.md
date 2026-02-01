---
name: static-analysis
description: Run Qodana static analysis and fix issues found.
---

# /static-analysis [path]

Run Qodana static analysis on the codebase and fix issues found.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"static-analysis","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Target

If a path argument is provided, analyze that file/directory.
If no argument, analyze the project root.

## Process

### Step 1: Run Qodana Scan

```
mcp__qodana__qodana_scan
  projectDir: <project path>
```

### Step 2: Get Problems

```
mcp__qodana__qodana_problems
  projectDir: <project path>
  severity: "HIGH"
```

### Step 3: Fix Issues

For each CRITICAL and HIGH severity issue:
1. Read the affected file
2. Understand the problem
3. Apply the fix using Edit tool
4. Verify the fix

## Output Format

```markdown
## Static Analysis: [path]

### Scan Results:

| Severity | Count |
|----------|-------|
| Critical | N |
| High | N |
| Moderate | N |
| Low | N |

### Issues Fixed:

| Severity | File | Issue | Status |
|----------|------|-------|--------|
| HIGH | src/api.ts:42 | Unused variable | Fixed |
| HIGH | src/db.ts:15 | SQL injection risk | Fixed |

### Remaining Issues:

| Severity | File | Issue | Reason |
|----------|------|-------|--------|
| MODERATE | src/utils.ts:8 | Complex function | Deferred |

QODANA_ISSUES: N
QODANA_FIXED: N
STATIC_ANALYSIS_COMPLETE
```

## Tool Errors

If Qodana is unavailable:
```
QODANA_ERROR: tool not available
```

If no issues found:
```
QODANA_ISSUES: 0
STATIC_ANALYSIS_COMPLETE
```
