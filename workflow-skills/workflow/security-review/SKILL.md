---
name: security-review
description: Adversarial security review via Gemini. Think like an attacker. ALL issues must be fixed.
---

# /security-review [path]

Adversarial security review using Gemini. Think like an attacker. ALL issues must be fixed.

> **No arguments?** Describe this skill and stop. Do not execute.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"security-review","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
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

## Scope Constraint (MANDATORY)

Fix ALL findings. Every issue identified gets fixed for production readiness. No deferring, no "backlog for next cycle," no "appropriate for MVP."

ALLOWED:
- Change logic within an existing function
- Add validation/checks to existing code paths
- Fix crypto/security bugs in existing implementations
- Add private helper methods within existing files
- Add config entries, constants, enums to existing files
- Add interfaces to existing files if needed for proper typing
- Restructure function internals (keep same signature)

FORBIDDEN:
- Adding new source files (config files are OK)
- Moving code between files
- Adding new external dependencies

If a finding seems to require restructuring: fix it anyway by
restructuring within the existing file. The only acceptable
unfixed items are findings that require adding new external
dependencies — report those with a one-line explanation.

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
1. `canon/security/security-mindset/SKILL.md`
2. `canon/security/owasp/SKILL.md`
3. `canon/security/web-security/SKILL.md`

**Auto-detect language canon (check files, load matches):**

| Check | If found, also read |
|-------|---------------------|
| `*.ts` or `*.js` files in target | `canon/javascript/typescript/SUMMARY.md`, `canon/javascript/js-safety/SUMMARY.md`, `canon/javascript/js-perf/SUMMARY.md`, `canon/javascript/js-internals/SUMMARY.md`, `canon/javascript/functional/SUMMARY.md` |
| `angular.json` in project root | `canon/angular/angular-arch/SUMMARY.md`, `canon/angular/angular-core/SUMMARY.md`, `canon/angular/angular-perf/SUMMARY.md`, `canon/angular/rxjs/SUMMARY.md` |
| `package.json` contains `"react"` | `canon/javascript/react-state/SUMMARY.md`, `canon/javascript/react-test/SUMMARY.md`, `canon/javascript/reactivity/SUMMARY.md` |
| `pom.xml` or `build.gradle` in project | `canon/java/SUMMARY.md` |
| `*.py` files in target | `canon/python/python-advanced/SUMMARY.md`, `canon/python/python-idioms/SUMMARY.md`, `canon/python/python-patterns/SUMMARY.md`, `canon/python/python-protocols/SUMMARY.md` |
| `*.cs` files or `*.csproj` in project | `canon/csharp/csharp-depth/SUMMARY.md`, `canon/csharp/type-systems/SUMMARY.md`, `canon/csharp/async/SUMMARY.md` |

If a skill file doesn't exist (not installed in this project), skip it and continue.
List loaded experts in EXPERTS_LOADED. Tag each fix with `(via [expert-skill])` showing which expert drove it.

### Step 1: Find Code to Review

Find recently modified files using git diff or git log.
Look in: src/, lib/, app/, migrations/, db/, and project root.
If NO code exists, output "no code to review" and stop.

### Step 1b: Mandatory Attack Surface Checks

Before calling Gemini, manually verify these common-miss patterns. These are
frequently missed by AI reviewers and must be checked explicitly:

**Symlink / path traversal:**
- Every user-supplied path must be resolved with `realpath` (or equivalent) AND
  then checked with `path.relative()` to confirm it stays within the allowed
  directory. `startsWith` is insufficient — symlinks bypass it.

**Secrets in process lists:**
- Check if any secret (API key, password, token) can be passed as a positional
  CLI argument. If so, it leaks to `ps aux` and shell history. Flag as HIGH.
  Fix: accept via file path, stdin, env var, or interactive prompt instead.

**Data integrity:**
- If persisted data has a version/schema field, verify it is checked on read
  and that unsupported versions produce a clear error (not silent corruption).
- If no version field exists in persisted data, flag as MEDIUM.

### Step 2: Call Gemini (MANDATORY)

```
mcp__gemini-reviewer__gemini_review
  code: <paste the source code>
  focus: "adversarial"
  context: "PRODUCTION SECURITY GATE. This code is about to be deployed to production. Think like an attacker targeting a production system. Find: security vulnerabilities, race conditions, edge cases that crash in production, input validation bypasses, resource exhaustion (DoS), privilege escalation. Be hostile and thorough — every finding you miss is a production incident. Specifically check: (1) symlink bypass in path validation — startsWith is not enough (2) secrets exposed in process lists via CLI args — leaked to ps aux in production (3) data format versioning/migration safety — corrupted data in production is catastrophic (4) error messages that leak internals to attackers in production (5) missing rate limiting or resource bounds that enable DoS in production. For each finding: cite file:line, severity (CRITICAL/HIGH/MEDIUM/LOW). CRITICAL = exploitable in production today. HIGH = would cause security incidents in production."
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
[SEVERITY] description - FIXED (via [expert-skill])

UNFIXED: 0 (must be zero or phase fails)

EXPERTS_LOADED: [list of skill names actually read]
REVIEW_ISSUES: N
SECURITY_REVIEW_COMPLETE: yes
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

### 2. Universal: `.claude/universal-lessons.md`

Read this file first. If the **general pattern** is already listed, skip. If it's a NEW general pattern not already covered, append it to the appropriate section (LOGIC Patterns or DESIGN Patterns). Write the general rule, not the project-specific instance:

```markdown
### {Pattern Name}
- {General description of the vulnerability pattern, not tied to specific files} → {how to avoid it}
```

**Categories:** LOGIC (most security issues), DESIGN (architectural security gaps)

Common security findings that indicate earlier-phase gaps:
- Path traversal → implementation should validate names from user input before `path.join`
- Shell injection → implementation should never use `execSync` with template literals
- XSS in embedded data → implementation should escape `</` in JSON embedded in HTML
- TOCTOU races → implementation should use try-catch, not existsSync+readFileSync

If no new lessons were learned (already in both files), skip this step.

## Evidence Checklist (MANDATORY)

After fixing all issues, produce an evidence checklist. Write to `.claude/evidence/` (create directory if needed).

### Checklist 9a: Attack Surface

Review EVERY entry point: exported CLI commands, file I/O with external paths, `createReadStream`, `createWriteStream`, `readFileSync`, `writeFileSync`. Write to `.claude/evidence/adversarial-9a.md`:

```markdown
# Evidence: Adversarial 9a — Attack Surface

| Location | Item | Verdict | Reasoning |
|----------|------|---------|-----------|
| src/cli.ts:add | CLI command 'add' validates input | PASS | Path is sanitized before use |
| src/store.ts:12 | writeFileSync with user path | FAIL | No path traversal protection |
```

Every row must have a PASS or FAIL verdict. No blanks. The machine gate validates row counts against codebase counters — incomplete checklists block the pipeline.

## Validation (Phase will FAIL if violated)

- Gemini not called
- UNFIXED > 0
- Contains "NOT FIXED" or "Application-Level"
- Contains "application concern" excuses
