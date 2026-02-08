---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# AI Smell Index Reference

The AI Smell Index measures how much code looks AI-generated vs human-written.

---

## Scoring System

| Smell Type | Weight | Why |
|------------|--------|-----|
| Over-abstraction | 3 | Adds complexity, hides logic |
| Defensive paranoia | 3 | Implies distrust in own code |
| Speculative features | 3 | Dead code, maintenance burden |
| Enterprise patterns | 3 | Massive overkill for simple code |
| Generic wrappers | 2 | Indirection without value |
| Excessive structure | 2 | Navigation overhead |
| Comment spam | 1 | Noise, but harmless |
| Verbose naming | 1 | Annoying but functional |

---

## Index Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 0-5 | Clean | Human-like code |
| 6-15 | Minor | A few AI fingerprints |
| 16-30 | Moderate | Noticeable AI patterns |
| 31-50 | Heavy | Needs cleanup |
| 51+ | Severe | AI slop, run /ai-smell-fix |

---

## Smell Definitions

### Over-Abstraction (weight: 3)

- Factories/wrappers used exactly once
- Abstract base class with one implementation
- Unnecessary indirection layers
- Single-use helper functions (under 5 lines)

### Defensive Paranoia (weight: 3)

- Null checks where null is impossible (typed params)
- Try/catch around infallible code
- Validating internal function arguments
- Empty catch blocks

### Speculative Features (weight: 3)

- Config options nobody uses
- Parameters with only one value ever passed
- Dead feature flags
- Options objects with single caller

### Enterprise Patterns in Simple Code (weight: 3)

- Repository pattern for one entity
- Strategy pattern with one strategy
- Builder pattern for simple objects
- Factory for single product

### Generic Wrappers (weight: 2)

- `Result<T, E>` when you just throw
- Custom types that add no value over primitives
- Wrapper class with one method

### Excessive Structure (weight: 2)

- Single-method classes
- Deep folder nesting (4+ levels)
- Index file re-export chains
- Files with 5+ functions under 5 lines each

### Comment Spam (weight: 1)

- Comments that repeat the code
- `// increment counter` above `counter++`
- JSDoc restating the function name
- Principle citations ("Following X pattern")

### Verbose Naming (weight: 1)

- Names longer than 25 characters
- Redundant prefixes/suffixes (`userUserData`)

---

## Usage

### Run a Scan

```bash
/ai-smell-scan src/
```

Output includes:
- Individual smells with file:line locations
- Count per smell type
- Weighted score per type
- Total AI_SMELL_INDEX

### Track Over Time

```bash
# Before changes
/ai-smell-scan src/  → AI_SMELL_INDEX: 12

# After implementing feature
/ai-smell-scan src/  → AI_SMELL_INDEX: 18

# Delta: +6 (regression)
```

### Fix Detected Smells

```bash
/ai-smell-fix src/
```

---

## Integration with Build/Improve

The AI Smell Index can track whether skill configurations increase or decrease AI smells:

1. Run `/ai-smell-scan` before `/build` or `/improve`
2. Run `/build` or `/improve` with full base brain
3. Run `/ai-smell-scan` after
4. Compare indices

If the index increases significantly, the skill configuration may be encouraging over-engineering.

---

## See Also

- [/ai-smell-scan skill](../../workflow-skills/utils/ai-smell-scan/SKILL.md)
- [/ai-smell-fix skill](../../workflow-skills/workflow/ai-smell-fix/SKILL.md)
- [Skill Enforcement Model](../explanation/skill-enforcement-model.md)
