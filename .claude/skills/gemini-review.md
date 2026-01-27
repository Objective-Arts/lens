---
name: gemini-review
description: Run Gemini code review on a file or code snippet
---

# /gemini-review

Run a Gemini-powered code review via the gemini-reviewer MCP server.

## Usage

```
/gemini-review [path] [--focus=<type>]
```

## Arguments

- `path` - File or directory to review. If omitted, reviews code from current session.
- `--focus` - Review focus (default: general)
  - `general` - Comprehensive review
  - `security` - Vulnerabilities, injection, auth
  - `performance` - Bottlenecks, complexity
  - `readability` - Clarity, naming, maintainability
  - `bugs` - Edge cases, error handling, logic errors

## Examples

```
/gemini-review src/api.ts
/gemini-review src/auth.ts --focus=security
/gemini-review --focus=bugs
```

## Process

1. Read the target file(s)
2. Call gemini_review MCP tool with code and context
3. Present findings in structured format

## Output Format

```markdown
## Gemini Review

**File:** src/example.ts
**Focus:** general

### Findings

1. [Finding 1]
2. [Finding 2]

### Recommendations

- [Recommendation 1]
- [Recommendation 2]
```

## Requirements

- `gemini-reviewer` MCP server enabled
- `GEMINI_API_KEY` environment variable set

Enable with:
```bash
cc-config mcp enable gemini-reviewer -p .
```
