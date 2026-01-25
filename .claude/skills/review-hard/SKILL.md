# --review-hard: Integrated Code Review

Rigorous multi-stage review using external analyzers before marking code complete.

## Purpose

Catch structural issues, security vulnerabilities, and quality problems through:
1. **Self-review** against project standards
2. **Gemini review** for architectural and logic issues
3. **Qodana scan** for static analysis and code smells

## When to Invoke

- Before presenting code as "complete"
- After significant refactoring
- Before PR submission
- When touching security-sensitive code

## Review Workflow

### Stage 1: Self-Review (Always)

Check against project CLAUDE.md standards:
- [ ] Functions under 30 lines
- [ ] Single responsibility per function/class
- [ ] No mixed concerns
- [ ] Proper error handling
- [ ] Security considerations addressed

### Stage 2: Gemini Review (For Logic/Architecture)

Use the `gemini_review` MCP tool:

```
gemini_review({
  code: "<the code to review>",
  context: "Brief description of what this code does",
  focus: "general"  // or: security, performance, readability, bugs
})
```

**Focus options:**
- `general` - Comprehensive review
- `security` - Vulnerabilities, injection, auth issues
- `performance` - Bottlenecks, complexity, optimization
- `readability` - Clarity, naming, maintainability
- `bugs` - Edge cases, error handling, logic errors

### Stage 3: Qodana Scan (For Static Analysis)

Use the `qodana_scan` and `qodana_problems` MCP tools:

```
# Run scan
qodana_scan({
  projectDir: ".",
  failThreshold: "high"
})

# Get actionable problems
qodana_problems({
  projectDir: ".",
  severity: "HIGH",
  limit: 20
})
```

## Integration Pattern

When user requests `--review-hard` or when completing significant code:

```typescript
// 1. Self-review checklist
const selfReviewPassed = checkAgainstStandards(code);

// 2. Gemini review for architecture/logic
const geminiReview = await gemini_review({
  code: changedCode,
  context: "Component refactoring for...",
  focus: "general"
});

// 3. Qodana scan for static analysis
const scanResult = await qodana_scan({ projectDir: "." });

// 4. Get high-severity issues
const problems = await qodana_problems({
  projectDir: ".",
  severity: "HIGH"
});

// 5. Report and address findings
reportFindings(selfReviewPassed, geminiReview, problems);
```

## Expected Output

Present review results in this format:

```markdown
## --review-hard Results

### Self-Review
- [x] Functions under 30 lines
- [x] Single responsibility
- [ ] Error handling needs improvement (line 45)

### Gemini Review
**Focus: general**

[Gemini's analysis here]

Key findings:
1. ...
2. ...

### Qodana Analysis

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Moderate | 5     |

**High-severity issues:**
1. `src/api.ts:42` - Possible SQL injection
2. `src/auth.ts:15` - Weak password validation

### Action Items
1. Fix SQL injection in api.ts
2. Strengthen password validation
3. Add error handling at line 45
```

## Quality Gates

Code is NOT complete until:
- [ ] No CRITICAL or HIGH Qodana issues
- [ ] Gemini findings addressed
- [ ] Self-review checklist passed

## MCP Server Requirements

This skill requires these MCP servers enabled:
- `gemini-reviewer` - For LLM-based review
- `qodana` - For static analysis

Enable with:
```bash
cc-config mcp enable gemini-reviewer -p .
cc-config mcp enable qodana -p .
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | Gemini API access |
| `QODANA_TOKEN` | No | Qodana Cloud features |

## Baseline Management

For legacy code, create a baseline to focus on new issues:

```
qodana_baseline({ projectDir: "." })
```

Then scan with baseline:
```
qodana_scan({
  projectDir: ".",
  baseline: "qodana.baseline.json"
})
```
