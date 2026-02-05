# Utils

Single-purpose tools. Read-only scans, reports, and status checks.

## Skills

### Read-Only Scans

| Skill | Purpose |
|-------|---------|
| `/gemini-scan` | Gemini code review (report only) |
| `/qodana-scan` | Qodana static analysis (report only) |
| `/dedupe-scan` | Find duplicated code patterns |
| `/refactor-scan` | Find refactoring opportunities |
| `/ai-smell-scan` | Detect AI-generated code smells |
| `/naming-review` | Review names for clarity |

### Documentation

| Skill | Purpose |
|-------|---------|
| `/generate-docs` | Generate documentation for public APIs |
| `/explain-skill` | Explain what a skill does |

### Status & Reports

| Skill | Purpose |
|-------|---------|
| `/lens` | Home base - status and help |
| `/session-status` | Show active skills and primitives |
| `/skill-usage-report` | D3 visualization of skill usage |

## Usage

```bash
/gemini-scan src/             # Report issues (no fixes)
/qodana-scan                  # Static analysis report
/dedupe-scan src/             # Find duplicates
/refactor-scan src/           # Find refactoring opportunities
/ai-smell-scan src/           # Detect AI patterns

/session-status               # What's active?
/lens                         # Home base
```

## No Code Changes

Utils never modify your code. Use `workflow/` for skills that fix issues.
