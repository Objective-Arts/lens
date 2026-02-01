---
name: adversarial-review
description: Hard-ass code review via Gemini. ALL issues must be fixed. No exceptions.
---

# /adversarial-review [path]

Hard-ass code review using Gemini. ALL issues must be fixed.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"adversarial-review","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO EXCEPTIONS

You MUST fix EVERY issue Gemini identifies. ALL of them. No exceptions.

## FORBIDDEN (Phase will FAIL if detected):

- Marking issues as "application-level concern"
- Saying "requires application code"
- Punting issues to "future work"
- Skipping issues because they're "operational" or "architectural"
- Making judgment calls about what's worth fixing
- Leaving ANY issue unfixed

**If Gemini found it, YOU FIX IT. Period.**

## Process

### Step 1: Find Code to Review

Find recently modified files using git diff or git log.
Look in: src/, lib/, app/, migrations/, db/, and project root.
If NO code exists, output "no code to review" and stop.

### Step 2: Call Gemini (MANDATORY)

```
mcp__gemini-reviewer__gemini_review
  code: <paste the source code>
  focus: "adversarial"
  context: "Adversarial code review. Think like an attacker. Find: security vulnerabilities, race conditions, edge cases that crash, input validation bypasses, resource exhaustion, privilege escalation. Be hostile and thorough."
```

If tool unavailable, output: GEMINI_ERROR: tool not available

### Step 3: Fix ALL Issues (MANDATORY - NO EXCEPTIONS)

For EACH issue Gemini identifies:
1. Use Edit tool to fix the code NOW
2. Verify the fix compiles/runs
3. Record in ISSUES_FIXED

If you truly cannot fix an issue (tool limitation), the phase FAILS.

## REQUIRED Output Format

```
GEMINI_RESULT: called - [N] issues

ISSUES_FOUND:
[SEVERITY] description (file:line)

ISSUES_FIXED:
[SEVERITY] description - FIXED

UNFIXED: 0 (must be zero or phase fails)

REVIEW_ISSUES: N
VERIFIED_CLEAN: yes
```

## Validation (Phase will FAIL if violated)

- Gemini not called
- UNFIXED > 0
- Contains "NOT FIXED" or "Application-Level"
- Contains "application concern" excuses
