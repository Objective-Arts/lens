# --review-hard: Integrated Code Review

Rigorous multi-stage review using external analyzers before marking code complete.

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
3. Gemini returns → [parse, don't ask]
4. Call Qodana → [just call it, don't ask first]
5. Qodana returns → [parse, don't ask]
6. Return all results to caller → [done]
```

### WRONG (causes ralph to stop):
```
"I'll now run Qodana. Should I proceed?" ← WRONG
"Gemini found 3 issues. What would you like to do?" ← WRONG
"Ready to run the static analysis?" ← WRONG
```

### RIGHT (keeps ralph flowing):
```
"Running Qodana scan..." → [calls tool]
"Gemini found 3 issues. Proceeding to Qodana..." → [calls tool]
"Review complete. Results: [summary]" → [returns to caller]
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
- [ ] Async errors caught and handled
- [ ] Consistent error return pattern (throw OR Result type, not mixed)

#### TypeScript Quality (Cherny)
- [ ] No `any` types (use `unknown` for truly unknown)
- [ ] No non-null assertions `!` without justification comment
- [ ] Discriminated unions for state machines
- [ ] Exhaustive switch with `never` guard for union types

#### Security (OWASP)
- [ ] User input validated at system boundaries
- [ ] No secrets/credentials in code
- [ ] Parameterized queries only (no string concatenation)
- [ ] No `eval()`, `Function()`, or dynamic code execution
- [ ] No sensitive data in logs

#### Dependencies & Architecture
- [ ] No circular imports
- [ ] Dependencies flow downward (high-level → low-level)
- [ ] No unused imports/exports

#### Naming & Clarity
- [ ] Booleans prefixed: is/has/can/should/will
- [ ] Functions are verbs, classes/types are nouns
- [ ] No magic numbers/strings (use named constants)
- [ ] No abbreviations except standard (id, url, config, etc.)

#### Testing (Dodds Trophy)
- [ ] Integration test covers the feature path
- [ ] Tests assert behavior, not implementation details
- [ ] No mocking of internal modules (only external boundaries)

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
- [ ] No `any` types without explicit justification
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
