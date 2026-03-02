# Workflow Skills

Universal workflow skills for Claude Code. Installed to projects via `lens init`.

## Structure

```
workflow-skills/
├── workflow/       # Multi-step processes (scan → fix → verify)
├── utils/          # Single-purpose tools (read-only scans, reports)
└── rubric/         # Quality rubrics applied during planning and review
```

## Quick Reference

| Directory | Purpose | Modifies Code |
|-----------|---------|---------------|
| `workflow/` | Multi-phase processes | Yes |
| `utils/` | Read-only tools and reports | No |
| `rubric/` | Quality criteria for pipeline phases | — |

## Workflows

### Build + Improve (`/build`, `/improve`)

Plan → Implement → Quality Gate → Canon Review + Fix → Verify. Single-session, no external tools.

```bash
/build add user authentication with JWT tokens
/improve src/module
```

### Fast Fix Loop (`/fix`)

Canon review + quality gate, fix findings, verify. Single-session, no external tools.

```bash
/fix src/auth
```

### Simple Change (`/change`)

One change, cleaned up, reported.

```bash
/change add email validation to signup form
```

## All Skills

### Pipeline Phase Skills (workflow/)

| Skill | Phase | What it does |
|-------|-------|-------------|
| `plan` | 1 | Requirement analysis, work items, quality contracts |
| `structure` | 2 | Architecture, types, interfaces, boundaries |
| `implementation` | 3 | Write code with compile loop, quality gate rules |
| `refactoring` | 4 | Fix 10 mandatory structural issues |
| `deduplication` | 5 | Consolidate true duplicates |
| `gemini-review` | 6 | Gemini scan every file, fix critical/high |
| `qodana-review` | 6 | Static analysis, fix every issue |
| `ai-smell-fix` | 6 | Remove 9 AI antipattern categories |
| `testing` | 7 | Write tests, run suite, mock audit |
| `evaluation` | 8 | Score 7 dimensions, fix-loop, report |

### Other Workflow Skills (workflow/)

| Skill | What it does |
|-------|-------------|
| `build` | Plan + build + quality gates |
| `improve` | Plan + improve + quality gates |
| `fix` | Canon review + quality gate + fix + verify |
| `change` | Simple change + cleanup |
| `security-review` | Security-focused review + fix |

### Read-Only Scans (utils/)

| Skill | What it reports |
|-------|----------------|
| `gemini-scan` | Code quality and security findings |
| `qodana-scan` | Static analysis findings |
| `ai-smell-scan` | AI-generated antipatterns |
| `code-scan` | 13-dimension comprehensive scan |
| `dedupe-scan` | Code duplication |
| `naming-scan` | Naming convention issues |
| `deadcode-scan` | Unused code |
| `refactor-scan` | Refactoring opportunities |
| `canon-audit` | Audit project against a canon's rules |

### Utilities (utils/)

| Skill | What it does |
|-------|-------------|
| `generate-docs` | Write JSDoc, update README |
| `run-tests` | Execute test suite |
| `lens` | Status and help menu |
| `explain-skill` | Explain what a skill does |
| `session-status` | Current session state |
| `skill-usage-report` | Skill usage telemetry |

## Naming Conventions

| Suffix | Meaning | Location |
|--------|---------|----------|
| `-fix` | Modifies code, fixes issues | `workflow/` |
| `-scan` | Read-only, reports issues | `utils/` |
| `-review` | Scan + fix | `workflow/` |

## Installation

### Via lens (recommended)

```bash
lens init --profile javascript
```

### Multi-project updates

```bash
lens workflow push    # Push updates to all registered projects
```

### Manual

```bash
cp -r workflow-skills/* your-project/.claude/skills/
```

## Pitfalls Canon

Known bug patterns and anti-patterns are maintained in `canon/pitfalls/SKILL.md`. Planning and implementation phases (1-5) read this canon before starting work, proactively avoiding known issues.
