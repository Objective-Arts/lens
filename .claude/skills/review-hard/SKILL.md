# --review-hard: Integrated Code Review

Integrated multi-stage code review using external analyzers before marking code complete.

## Purpose

Catch structural issues, security vulnerabilities, and quality problems through:
1. **Self-review** against project standards
2. **Gemini review** for architectural and logic issues
3. **Qodana scan** for static analysis and code smells

## CRITICAL: Auto-Continue Behavior (NO ASKING)

**When invoked from /ralph-loop or any autonomous workflow:**

### NEVER ASK - JUST DO:
- ❌ DO NOT ask "Should I run Qodana?"
- ❌ DO NOT ask "Ready to scan with Qodana?"
- ❌ DO NOT ask for confirmation BEFORE any tool call
- ❌ DO NOT ask for confirmation AFTER any tool returns
- ❌ DO NOT ask "what would you like to do with these findings?"
- ❌ DO NOT stop and wait for user input at ANY point

### CORRECT FLOW (no pauses, no questions):
```
1. Self-review → [just do it]
2. Call Gemini → [just call it, don't ask first]
3. Gemini returns → [parse findings, don't ask]
4. FIX Gemini findings → [edit code to address issues]
5. Call Qodana → [just call it, don't ask first]
6. Qodana returns → [parse findings, don't ask]
7. FIX Qodana HIGH/CRITICAL → [edit code to address issues]
8. Return results with fixes applied → [done]
```

### WRONG (causes ralph to stop):
```
"I'll now run Qodana. Should I proceed?" ← WRONG
"Gemini found 3 issues. What would you like to do?" ← WRONG
"Ready to run the static analysis?" ← WRONG
```

### RIGHT (keeps ralph flowing):
```
"Running Gemini review..." → [calls tool]
"Gemini found 3 issues. Fixing..." → [edits code]
"Fixed 3 issues. Running Qodana..." → [calls tool]
"Qodana found 2 HIGH issues. Fixing..." → [edits code]
"Review complete. Fixed 5 issues total." → [returns to caller]
```

**AUTONOMOUS MEANS AUTONOMOUS** - execute the full review pipeline without interruption.

## When to Invoke

- Before presenting code as "complete"
- After significant refactoring
- Before PR submission
- When touching security-sensitive code

## Review Workflow

### Stage 1: Self-Review (Always)

#### Structure & Size
- [ ] Functions under 30 lines
- [ ] Single responsibility per function/class
- [ ] No mixed concerns (UI/logic/data)
- [ ] Max 3 levels of nesting
- [ ] Max 4 parameters per function (use options object beyond that)

#### Error Handling & Async
- [ ] All error paths handled explicitly
- [ ] No floating promises (all awaited or explicitly fire-and-forget)
- [ ] Async operations have .catch() or try/catch - no unhandled rejections
- [ ] Consistent error return pattern (throw OR Result type, not mixed)

#### TypeScript Quality (Cherny)
- [ ] No 'any' types (use 'unknown' for truly unknown)
- [ ] No non-null assertions (!) without justification comment
- [ ] Discriminated unions for state machines
- [ ] Exhaustive switch with 'never' guard for union types

#### Security (OWASP)
- [ ] User input validated and sanitized at boundaries (prevent XSS, injection)
- [ ] No secrets/credentials in code (use env vars or secrets manager)
- [ ] Parameterized queries only - never concatenate user input into SQL
- [ ] No eval(), Function(), or dynamic code execution
- [ ] No sensitive data in logs (mask PII, tokens, passwords)
- [ ] Rate limiting on authentication and expensive operations
- [ ] Principle of least privilege applied to permissions

#### Dependencies & Architecture
- [ ] No circular imports
- [ ] Dependencies flow downward (high-level → low-level)
- [ ] No unused imports/exports

#### Naming & Clarity
- [ ] Booleans prefixed: is/has/can/should/will
- [ ] Functions are verbs, classes/types are nouns
- [ ] No magic numbers/strings (use named constants)
- [ ] No abbreviations except standard (id, url, config, etc.)

#### Testing Principles
Testing trophy approach: favor integration tests over unit tests for confidence.
- [ ] Integration test covers the feature path
- [ ] Tests assert behavior, not implementation details
- [ ] No mocking of internal modules (only external boundaries)

### Stage 2: Gemini Review (For Logic/Architecture)

**Gemini** is Google's LLM used here to identify architectural issues, logic errors, and code quality problems that static analysis misses.

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

**Qodana** is JetBrains' static analysis tool that detects code smells, potential bugs, security vulnerabilities, and style issues across many languages.

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

### Stage 4: Fix Findings (MANDATORY)

**After each review stage, FIX the issues found before proceeding.**

#### Gemini Findings
For each Gemini finding:
1. Read the specific file/line mentioned
2. Apply the fix Gemini recommends
3. If fix is unclear, use best judgment based on the issue type
4. Track what was fixed

#### Qodana Findings
For HIGH and CRITICAL severity:
1. Navigate to the file:line reported
2. Fix the issue (security, bug, code smell)
3. Re-run qodana_problems to verify fix

#### What NOT to fix automatically
- MODERATE/LOW Qodana issues (report only)
- Findings that require architectural changes (flag for user)
- Findings in files outside the current task scope

## Failure Handling

When external tools fail:

| Tool | On Failure | Action |
|------|------------|--------|
| Gemini | Network/API error | Retry once, then continue with self-review only |
| Gemini | Rate limited | Wait 30s, retry once, then skip |
| Qodana | Docker unavailable | Skip Qodana, note in output |
| Qodana | Scan timeout | Report partial results if available |

**Thresholds:**
- Max 2 retries per tool
- If both external tools fail, complete self-review and flag for manual follow-up

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

**Structure & Size**
- [x] Functions under 30 lines
- [x] Single responsibility
- [ ] Max 3 nesting levels - `processData()` has 4 levels at line 87

**Error Handling & Async**
- [ ] Floating promise at line 42 - `fetchUser()` not awaited
- [x] Error paths handled

**TypeScript Quality**
- [x] No `any` types
- [x] Discriminated unions used correctly

**Security**
- [x] Input validation at boundaries
- [x] No secrets in code

**Dependencies**
- [x] No circular imports

**Naming**
- [ ] `flag` should be `isEnabled` (line 23)

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

**Blocking (P0)**
1. Fix floating promise at line 42
2. Fix SQL injection in api.ts

**Required (P1)**
3. Rename `flag` → `isEnabled`
4. Strengthen password validation

**Advisory (P2)**
5. Reduce nesting in `processData()`
```

## Quality Gates

### Blocking (Must Fix)
- [ ] No CRITICAL or HIGH Qodana issues
- [ ] No 'any' types without explicit justification
- [ ] No floating promises
- [ ] No security violations (OWASP items)
- [ ] All error paths handled

### Required (Should Fix)
- [ ] Gemini findings addressed or documented as intentional
- [ ] Functions under 30 lines
- [ ] No magic numbers/strings
- [ ] Naming conventions followed

### Advisory (Consider)
- [ ] Max 3 nesting levels
- [ ] Boolean prefixes
- [ ] Integration test coverage

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
