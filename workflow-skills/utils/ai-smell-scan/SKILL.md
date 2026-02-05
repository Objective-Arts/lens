---
name: ai-smell-scan
description: Detect AI-generated code smells. Read-only - does not fix.
---

# /ai-smell-scan [path]

**Read-only** scan for AI-generated code patterns. Reports findings without making changes.

## The AI Smell Checklist

### Over-Abstraction
- Factories/wrappers used exactly once
- Abstract base class with one implementation
- Unnecessary indirection layers

### Defensive Paranoia
- Null checks where null is impossible
- Try/catch around infallible code
- Validating internal function arguments

### Comment Spam
- Comments that repeat the code
- `// increment counter` above `counter++`
- Obvious comments on obvious code

### Speculative Features
- Config options nobody uses
- Parameters with only one value ever passed
- Dead feature flags

### Enterprise Patterns in Simple Code
- Repository pattern for one entity
- Strategy pattern with one strategy
- Builder pattern for simple objects

### Generic Wrapper Abuse
- `Result<T, E>` when you just throw
- Custom types that add no value over primitives

### Verbose Naming
- Names longer than 25 characters
- Redundant prefixes/suffixes

### Excessive Structure
- Single-method classes
- Deep folder nesting
- Index file re-export chains

## Output Format

```markdown
## AI Smell Scan: [target]

SMELLS_FOUND:
- [file:line] [smell type]: [description]
- [file:line] [smell type]: [description]

SUMMARY:
- Over-abstraction: N instances
- Defensive paranoia: N instances
- Comment spam: N instances
- Speculative features: N instances
- Enterprise patterns: N instances
- Generic wrappers: N instances
- Verbose naming: N instances
- Excessive structure: N instances

TOTAL_SMELLS: N

RECOMMENDATION: Run /ai-smell-fix to clean up
```

## No Changes Made

This is a **read-only** scan. Use `/ai-smell-fix` to fix issues.
