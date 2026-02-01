---
name: adversarial-review
description: Hard-ass code review via Gemini. Finds and fixes issues.
---

# /adversarial-review

Hard-ass code review using Gemini. Works standalone or as Ralph phase.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"adversarial-review","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Target

If a path argument is provided, review that file/directory.
If no argument, review recently modified files (git diff/log).

## Process

### Step 1: Find Code to Review

Find recently modified files using git diff or git log.
Look in: src/, lib/, app/, migrations/, db/, and project root.
If NO code exists, output "no code to review" and stop.

### Step 2: Call Gemini (MANDATORY)

```
mcp__gemini-reviewer__gemini_review
  code: <paste the source code>
  focus: "general"
  context: "Hard-ass code review. Check for: security vulnerabilities, performance issues, bugs, readability problems, and adversarial edge cases. Be thorough and find everything wrong."
```

If tool unavailable, output: GEMINI_ERROR: tool not available

### Step 3: Fix All Issues

Fix every CRITICAL and HIGH issue:
1. Use Edit tool to fix the code
2. Verify the fix is correct
3. Record what you fixed

Do NOT just report issues - actually fix them.

## Output Format

```
GEMINI_RESULT: called - [N] issues
(or: GEMINI_RESULT: error - <reason>)

ISSUES_FOUND:
[SEVERITY] description (file:line)

ISSUES_FIXED:
[SEVERITY] description - FIXED

REVIEW_ISSUES: N
VERIFIED_CLEAN: yes/no
```
