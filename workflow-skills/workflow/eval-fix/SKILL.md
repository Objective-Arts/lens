---
name: eval-fix
description: Internal pipeline phase. Reads eval-report.md and applies targeted fixes. Not user-facing.
---

# Phase 10b: eval-fix

Fix findings from the final-eval-check report. This is an **internal pipeline phase** invoked by the build/improve orchestrator during the score-fix-rescore loop. It is not user-facing.

> **SCOPE CONSTRAINT:** Fix in place. No restructuring, no new abstractions. "Fix in place" means you CAN: add private helper methods, add config entries, add validation logic, restructure internals of existing functions, add middleware/headers to existing startup files, add config files (appsettings, .env.example, docker-compose), add documentation files (README). Be aggressive about fixing — the goal is every category at 8+.

**Gate marker:** `EVAL_FIX_COMPLETE`

## Step 0: Load Rubric (for priority ordering)

Read `.claude/rubric/AUTO-DETECT.md`, then load `.claude/rubric/base.md` + `.claude/rubric/product-quality.md` + matching domain rubrics. Use the loaded criteria to understand what each finding category covers — this informs priority ordering below.

## Priority Order

Fix ALL findings in this order. Do NOT stop early. Do NOT dismiss findings as "MVP appropriate" or "backlog material." Every finding gets fixed — including findings previously classified as PROFILE (pipeline/config proposals).

Priority maps to rubric categories:
1. **Security** — base.md criteria 1-4 (input validation, injection, secrets, auth lifecycle) + domain security criteria (security headers, CSRF, proxy trust from web-api.md)
2. **Reliability** — base.md criteria 5-7 (error handling, bounded ops, atomic writes) + domain reliability criteria (graceful shutdown, circuit breakers)
3. **Deployability** — base.md criterion 8 (config externalization) + domain criteria (health checks, schema versioning, exit codes)
4. **Product Quality** — product-quality.md criteria (defaults, fallbacks, orphaned features, error UX, secrets handling)
5. **Operational Hygiene** — base.md criteria 9-10 (logging, error messages)
6. **AI Code Smells** — base.md criteria 11-12 (AI smells, architecture)

**Skip entirely:**
- **Test Coverage** findings — the write-tests-run phase handles tests

**Findings without file:line references:** These often describe missing infrastructure (no auth, no CI/CD, no README). Fix them by adding the missing piece to the most appropriate existing file. For example:
- "No authentication" → add auth middleware to the startup/config file
- "No CI/CD" → add a GitHub Actions or equivalent config file
- "No README" → add a README.md
- "No security headers" → add header middleware to startup

## Complexity Budget

Net-zero or net-negative for **source code**. If a fix adds lines to source files, remove lines elsewhere. Config files, documentation files, and CI configs are exempt from this budget — they are necessary infrastructure, not complexity.

## Steps

### Step 1: Read Eval Report

Read `.claude/eval-report.md`. Extract:
- Overall score
- ALL findings from the Lessons table (regardless of classification)
- ALL findings from the Proposals table (these are now fixable too)
- Informational findings that suggest missing infrastructure
- Skip Test Coverage findings only

Build a fix list ordered by priority (Security > Reliability > Deployability > Operational Hygiene > AI Code Smells).

### Step 2: Apply Fixes

For each finding in priority order:

1. Read the source file at the referenced location
2. Understand the finding and determine the minimal fix
3. Apply the fix in place — no restructuring
4. Verify the fix doesn't break the surrounding code

**Rules:**
- One finding = one targeted fix
- Do not refactor surrounding code
- Do not add comments explaining the fix
- Do not add error handling beyond what the finding requires
- If the finding is ambiguous, make your best judgment and fix it

### Step 3: Verify

After all fixes:

Run the project's build command:
- Node/JS/TS: `npm run build 2>&1 || true`
- .NET/C#: `dotnet build 2>&1 || true`
- Python: `python -m py_compile` on changed files
- Other: check for Makefile, build.gradle, etc.

If build fails, revert the last fix and try the next approach. Do not leave the code in a broken state.

### Step 4: Summary

Report what was fixed:

```
eval-fix: {N} findings fixed, {N} skipped
  Fixed:
    - {category}: {description} ({file:line})
  Skipped:
    - {reason}: {description}
```

End with: `EVAL_FIX_COMPLETE`
