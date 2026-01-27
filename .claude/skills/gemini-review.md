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
  - `adversarial` - Threat modeling, failure modes, race conditions

## Examples

```
/gemini-review src/api.ts
/gemini-review src/auth.ts --focus=security
/gemini-review --focus=bugs
/gemini-review src/auth/ --focus=adversarial
```

## Process

1. Read the target file(s)
2. Call gemini_review MCP tool with code and context
3. Present findings in structured format

## Adversarial Focus Context

When using `--focus=adversarial`, the review assumes:
- Attacker controls environment variables
- Network/DB calls can fail mid-sequence
- App runs in multi-instance deployment
- Tokens and sessions may be replayed
- All trust boundaries should be validated

Looks for:
- Race conditions and TOCTOU vulnerabilities
- Failure mode issues (what if step 2 fails after step 1?)
- Trust boundary violations (who controls this input?)
- Deployment topology issues (works single-instance but not clustered?)
- Token/session replay attacks
- Transaction atomicity gaps

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
