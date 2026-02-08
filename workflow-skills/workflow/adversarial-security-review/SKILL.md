---
name: adversarial-security-review
description: Adversarial security review via Gemini. Think like an attacker. ALL issues must be fixed.
---

# /adversarial-security-review [path]

Adversarial security review using Gemini. Think like an attacker. ALL issues must be fixed.

> **No arguments?** Describe this skill and stop. Do not execute.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"adversarial-security-review","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Craft Standards (MANDATORY)

**Fix toward code a master craftsperson would be proud of.**

Security fixes must be clean, not band-aids. The result should look like it was written by a skilled human security engineer.

### AI Antipatterns in Security Fixes to AVOID

- Adding excessive try/catch blocks that swallow errors
- Over-validating in ways that break legitimate use
- Security-through-obscurity (hiding instead of fixing)
- Defensive paranoia (checking things that can't happen)
- Adding complexity instead of fixing the root cause

### Human Craft in Security Fixes

- Fix the root cause, not the symptom
- Keep security code simple and auditable
- Fail secure (deny by default)
- Validate at the boundary, trust internally
- Make the secure path the easy path

**The best security fix is often the simplest one.**

---

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

### Step 0: Load Expert Guidance

Before starting, read these canon skills and apply their principles throughout:

**Always load:**
1. `.claude/skills/security-mindset/SKILL.md`
2. `.claude/skills/owasp/SKILL.md`
3. `.claude/skills/web-security/SKILL.md`

If a skill file doesn't exist (not installed in this project), skip it and continue.
Reference loaded experts in your APPLIED output.

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

## Final: Record Lessons Learned

After fixing all issues, record NEW findings so earlier phases learn from them. Security findings are especially valuable for the feedback loop.

**Write to TWO files:**

### 1. Project-local: `.claude/lessons.md`

Append the specific finding with file paths and context:

```markdown
## {date} - {target path}
### Security Found (phase 8)
- {CATEGORY}: {specific description with file:line} → {which earlier phase should catch this and how}
```

### 2. Universal: `workflow-skills/lessons.md`

Read this file first. If the **general pattern** is already listed, skip. If it's a NEW general pattern not already covered, append it to the appropriate section (LOGIC Patterns or DESIGN Patterns). Write the general rule, not the project-specific instance:

```markdown
### {Pattern Name}
- {General description of the vulnerability pattern, not tied to specific files} → {how to avoid it}
```

**Categories:** LOGIC (most security issues), DESIGN (architectural security gaps)

Common security findings that indicate earlier-phase gaps:
- Path traversal → implement-plan should validate names from user input before `path.join`
- Shell injection → implement-plan should never use `execSync` with template literals
- XSS in embedded data → implement-plan should escape `</` in JSON embedded in HTML
- TOCTOU races → implement-plan should use try-catch, not existsSync+readFileSync

If no new lessons were learned (already in both files), skip this step.

## Validation (Phase will FAIL if violated)

- Gemini not called
- UNFIXED > 0
- Contains "NOT FIXED" or "Application-Level"
- Contains "application concern" excuses
