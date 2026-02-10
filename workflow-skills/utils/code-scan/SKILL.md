---
name: code-scan
description: Read-only quality scan of components. Reports problems without making changes. Uses software-base + domain profile skills.
---

# /code-scan

**Read-only** quality analysis of target code. Identifies problems and improvement opportunities without making any changes.

## Target

If a path argument is provided, scan that file/directory.
If no argument, scan the code most recently discussed.
Multiple paths can be provided to scan a set of components.

## Step 1: Load Expert Context (MANDATORY)

Before scanning, read ALL available expert skills to build your quality lens:

**Software Base (always load):**
```
Read: canon/clarity/SKILL.md                 (clear, simple code)
Read: canon/simplicity/SKILL.md              (small interfaces, composition)
Read: canon/correctness/SKILL.md             (formal correctness)
Read: canon/data-first/SKILL.md              (data structures first)
Read: canon/pragmatism/SKILL.md              (get it working)
Read: canon/security/security-mindset/SKILL.md (think like attacker)
Read: canon/security/owasp/SKILL.md          (vulnerability patterns)
```

**Domain Profile (load what exists):**
```
Read: canon/javascript/typescript/SKILL.md   (if .ts files)
Read: canon/javascript/react-state/SKILL.md  (if React)
Read: canon/angular/angular-core/SKILL.md    (if Angular)
Read: canon/java/SKILL.md                    (if Java)
Read: canon/python/python-idioms/SKILL.md    (if Python)
```

Skip files that don't exist. Apply all loaded principles during analysis.

## Step 2: Read Target Code

Read ALL files in the target scope. Do not skim - read completely.

## Step 3: Analyze (DO NOT EDIT)

Evaluate code against these criteria:

### Structure
- [ ] Functions ≤25 lines
- [ ] Files ≤300 lines
- [ ] Main entry ≤100 lines
- [ ] Single responsibility per function
- [ ] Single responsibility per file/module

### Clarity
- [ ] Names reveal intent (no abbreviations except standard: API, HTTP, JSON)
- [ ] No comments explaining WHAT (code should be self-documenting)
- [ ] WHY comments where non-obvious
- [ ] Consistent patterns throughout

### Data Design
- [ ] Data structures match domain
- [ ] No primitive obsession (use value objects)
- [ ] Illegal states unrepresentable
- [ ] Immutable by default

### Error Handling
- [ ] All error paths explicit
- [ ] No swallowed exceptions
- [ ] Fail fast with clear messages
- [ ] No null/undefined leaks

### Security (if applicable)
- [ ] Input validation at boundaries
- [ ] No secrets in code
- [ ] Parameterized queries (no string concat)
- [ ] Output encoding

### Framework Idioms (based on loaded profile)
- [ ] Follows framework conventions
- [ ] Uses framework patterns correctly
- [ ] No anti-patterns for this framework

## Output Format

```markdown
## Code Scan: [target]

### Summary

| Metric | Value | Status |
|--------|-------|--------|
| Files scanned | N | - |
| Total lines | N | - |
| Largest file | N lines | ⚠️/✓ |
| Largest function | N lines | ⚠️/✓ |
| Critical issues | N | 🔴/✓ |
| Warnings | N | ⚠️/✓ |

### Critical Issues 🔴

Issues that should be fixed:

1. **[file:line]** — [description]
   - Problem: [what's wrong]
   - Impact: [why it matters]
   - Suggestion: [how to fix]

2. ...

### Warnings ⚠️

Issues to consider:

1. **[file:line]** — [description]
   - Concern: [what's questionable]
   - Consider: [improvement option]

2. ...

### Observations 💡

Not problems, but opportunities:

1. **[file]** — [observation]

### Skills Applied

- clarity: [findings summary]
- security-mindset: [findings summary]
- [domain-skill]: [findings summary]

### Files Analyzed

| File | Lines | Functions | Issues |
|------|-------|-----------|--------|
| path/to/file.ts | 245 | 12 | 2 🔴, 1 ⚠️ |
| ... | ... | ... | ... |
```

## Rules

- **READ ONLY** - Do not edit any files
- **COMPLETE** - Read all files fully, don't skim
- **SPECIFIC** - Cite file:line for every issue
- **ACTIONABLE** - Every issue has a suggestion
- **PRIORITIZED** - Critical vs warning vs observation

## What Makes an Issue Critical?

- Security vulnerabilities
- Functions >50 lines
- Files >500 lines
- Obvious bugs
- Missing error handling on external calls
- Framework anti-patterns that cause bugs

## What Makes a Warning?

- Functions 25-50 lines
- Files 300-500 lines
- Minor clarity issues
- Missing documentation on public APIs
- Suboptimal patterns

## Anti-Patterns (Don't Do)

- Making any edits to files
- Skimming instead of reading
- Generic feedback without line numbers
- Reporting issues without suggestions
- Missing the security analysis
