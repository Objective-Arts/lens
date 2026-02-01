---
name: review-hard
description: Adversarial self-review with mandatory verification. Review findings must be documented with evidence.
---

# /review-hard

Perform adversarial self-review on target code. Document all findings with file:line references.

## CRITICAL: Auto-Continue Behavior (NO ASKING)

**When invoked from /ralph-loop or any autonomous workflow:**

- DO NOT ask "Should I run Qodana?"
- DO NOT ask for confirmation before/after any tool call
- DO NOT stop and wait for user input at ANY point
- Execute the full review pipeline without interruption

## First: Activate Workflow

**Before any other action**, activate this workflow session:

```bash
mkdir -p .claude && echo '{"skill":"review-hard","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Target

If a path argument is provided, review that file/directory.
If no argument, review the code most recently written or modified in this session.

## Review Checklist

**Look for**:
- Mixed concerns (data processing in render logic)
- Long functions (>30 lines)
- Inconsistent patterns (mixing approaches)
- Missing error handling
- Security vulnerabilities (injection, XSS, auth issues)
- Unclear naming
- Dead code

## Process

### 1. Self-Review (Always)

Check against standards, document findings with file:line references.

### 2. Gemini Review (if available)

```
gemini_review({
  code: "<code to review>",
  context: "What this code does",
  focus: "general"
})
```

### 3. Qodana Scan (if available)

```
qodana_scan({ projectDir: "." })
qodana_problems({ projectDir: ".", severity: "HIGH" })
```

### 4. Fix & Document

Fix all issues found, document what was fixed.

---

## VERIFICATION (MANDATORY - DO NOT SKIP)

**You MUST execute these steps and show output before claiming completion.**

### Step 1: Document Files Reviewed

```bash
# List all files that were reviewed
ls -la <reviewed-files>
```

### Step 2: Show Review Findings (Self)

**You MUST list at least 3 things you checked, even if no issues found:**

```markdown
### Self-Review Findings

| Check | File:Line | Result |
|-------|-----------|--------|
| Functions <30 lines | all files | ✓ Pass / ✗ [issue] |
| Single responsibility | all files | ✓ Pass / ✗ [issue] |
| Error handling | all files | ✓ Pass / ✗ [issue] |
| Security (XSS/injection) | all files | ✓ Pass / ✗ [issue] |
| Consistent patterns | all files | ✓ Pass / ✗ [issue] |
```

### Step 3: Show External Review Results (if run)

```markdown
### Gemini Review
[paste actual Gemini output or "Not run - MCP not available"]

### Qodana Results
[paste actual Qodana output or "Not run - MCP not available"]
```

### Step 4: Document Fixes Applied

```markdown
### Fixes Applied

| Issue | File:Line | Fix |
|-------|-----------|-----|
| [issue description] | src/file.ts:42 | [what was changed] |
```

### Completion Criteria (ALL must be TRUE)

| Criterion | Evidence Required | Pass? |
|-----------|-------------------|-------|
| Files listed | `ls -la` shows reviewed files | [ ] |
| Self-review checklist shown | Table with ≥5 checks | [ ] |
| Each check has file:line reference | Not just "all files pass" | [ ] |
| External reviews documented | Gemini/Qodana output or "not available" | [ ] |
| Fixes documented with file:line | Table shows what was fixed | [ ] |

**If ANY criterion fails: complete the review. Do not report complete.**

---

## Output Format

```markdown
## Review: [target]

### Files Reviewed
```bash
$ ls -la src/feature/*.ts
-rw-r--r--  1 user  staff  2341 Jan 15 10:30 src/feature/index.ts
-rw-r--r--  1 user  staff  1892 Jan 15 10:30 src/feature/utils.ts
```

### Self-Review Checklist

| Check | Result | Details |
|-------|--------|---------|
| Functions <30 lines | ✓ | Largest: 24 lines (processData) |
| Single responsibility | ✓ | Each function does one thing |
| Error handling | ✗ Fixed | Added try/catch at index.ts:45 |
| Security (injection) | ✓ | Inputs sanitized at utils.ts:12 |
| Consistent patterns | ✓ | All use async/await |

### External Reviews

**Gemini**: Not run - MCP not available
**Qodana**: Not run - MCP not available

### Fixes Applied

| Issue | Location | Fix |
|-------|----------|-----|
| Missing error handling | index.ts:45 | Added try/catch block |

REVIEW_VERIFIED
```

**The marker `REVIEW_VERIFIED` may ONLY appear if all criteria pass.**

---

## Anti-Patterns (Immediate Failure)

- Claiming "all checks pass" without listing what was checked
- No file:line references for findings
- Skipping self-review checklist table
- Not documenting external review results (even if "not available")
- Empty fixes section when issues were found
- Vague statements like "code looks good" without specifics
