---
name: review-hard
description: Adversarial self-review with optional external Gemini and Qodana validation. Use before completion, commit, or PR.
---

# /review-hard

Perform adversarial self-review on target code. Optionally run external reviewers (Gemini, Qodana) for comprehensive validation.

## Target

If a path argument is provided, review that file/directory.
If no argument, review the code most recently written or modified in this session.

## Modes

### Standard Mode (default)
Self-review against standards checklist.

### Full Mode (`--full` or when MCP servers available)
Self-review + Gemini review + Qodana static analysis.

## Process

### 1. Self-Review (Always)

**Check** against project CLAUDE.md standards (if present)

**Look for**:
- Mixed concerns (data processing in render logic)
- Long functions (>30 lines)
- Inconsistent patterns (mixing approaches)
- Re-attached event handlers
- Implicit responsibilities
- Missing error handling
- Security vulnerabilities (injection, XSS, auth issues)

### 2. Gemini Review (if available)

Run when `gemini-reviewer` MCP server is enabled:

```
gemini_review({
  code: "<code to review>",
  context: "What this code does",
  focus: "general"  // or: security, performance, readability, bugs
})
```

Address all Gemini findings before proceeding.

### 3. Qodana Scan (if available)

Run when `qodana` MCP server is enabled:

```
qodana_scan({ projectDir: "." })
qodana_problems({ projectDir: ".", severity: "HIGH" })
```

**Quality gate**: No CRITICAL or HIGH issues.

### 4. Fix & Verify

Fix all issues found, then list what was fixed.

## Output Format

### Standard Mode

```markdown
## Review Findings

### Fixed:
- [specific fix 1]
- [specific fix 2]

### Verified:
- [x] No function exceeds 30 lines
- [x] Data prep separate from rendering
- [x] Consistent patterns throughout
- [x] Event handlers attached once
- [x] No security vulnerabilities
- [x] Error handling appropriate

Code is now review-ready.
```

### Full Mode

```markdown
## --review-hard Results (Full)

### Self-Review
- [x] Functions under 30 lines
- [x] Single responsibility
- [ ] Error handling needs improvement (line 45)

### Gemini Review
**Focus: general**

[Summary of Gemini's analysis]

Key findings:
1. ...

### Qodana Analysis

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |

**High-severity issues:**
1. `src/api.ts:42` - [description]

### Actions Taken
1. Fixed [issue 1]
2. Fixed [issue 2]

### Quality Gate
- [x] No CRITICAL Qodana issues
- [x] No HIGH Qodana issues
- [x] Gemini findings addressed
- [x] Self-review passed

Code is review-ready.
```

## If No Issues Found

```markdown
## Review Findings

### Verified:
- [x] All checks pass

Code is review-ready.
```

## Enable External Reviewers

```bash
# Enable Gemini review
export GEMINI_API_KEY=your_key
cc-config mcp enable gemini-reviewer -p .

# Enable Qodana scan
cc-config mcp enable qodana -p .
```

## Mindset

Be hostile. Assume external reviewers will scrutinize everything. Find issues before they do.

**Ask**: "What would Gemini flag? What would Qodana catch?"

Then run them to verify.
