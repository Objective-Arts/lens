---
name: refactor-clean
description: Modernize and refactor EXISTING CODE. Use after /plan and /structure-first in the Legacy Code Flow.
---

# /refactor-clean [target]

**LEGACY CODE FLOW ONLY** - Systematically refactor and modernize existing code.

For building new features, use `/build-from-plan` instead.

## Why This Skill Exists

Without this skill, Claude makes ad-hoc changes to legacy code without structured analysis. The result:

- Changes that break existing behavior
- Incomplete refactoring (stopping halfway)
- Missing the forest for the trees (fixing symptoms, not causes)
- No clear before/after to validate the change

**This skill enforces disciplined refactoring:**
- Analyze first, then change
- Show before/after structure
- Apply canon patterns systematically
- Verify behavior preservation

## When to Use

- Refactoring god classes/methods
- Cleaning up technical debt
- Modernizing legacy patterns
- After `/plan` identified what needs cleaning
- After `/structure-first` documented existing structure

## When NOT to Use

- Building new features from PRD → Use `/build-from-plan`
- Simple bug fixes (no structural change needed)
- Exploratory changes without a plan

## Process

1. **Load Plan** - Read refactoring plan from `.claude/plans/`
2. **Load Structure** - Read existing structure from `.claude/structures/`
3. **Invoke Canon** - Apply domain-specific expertise (see below)
4. **Decompose** - Break down changes into safe steps
5. **Execute** - Apply each step with verification
6. **Document** - Show before/after structure

## Invoke Canon Skills

Legacy refactoring requires specific canon skills:

| Concern | Canon Skills | What They Guide |
|---------|--------------|-----------------|
| Finding seams | `/feathers` | Where to safely change legacy code |
| Code smells | `/fowler` | What to fix and how |
| SRP violations | `/liskov` | Single responsibility decomposition |
| API cleanup | `/bloch` | Interface design, immutability |
| Clarity | `/kernighan` | Naming, readability, simplicity |
| Patterns | `/gang-of-four` | Replace conditionals with polymorphism |

**Example**: Refactoring a god controller:
1. Invoke `/feathers` - find seams for safe changes
2. Invoke `/liskov` - identify SRP violations
3. Invoke `/fowler` - catalog code smells
4. Invoke `/bloch` - apply composition over inheritance
5. Invoke `/kernighan` - improve naming and clarity

## Refactoring Priorities

Apply in this order:

1. **Security** - Fix HIPAA/PII/credential issues FIRST
2. **Decompose** - Split functions >30 lines into single-responsibility units
3. **Separate** - Data preparation from rendering/presentation
4. **Unify** - Inconsistent patterns (pick one approach, apply everywhere)
5. **Extract** - Inline calculations into named pure functions

## Output Format

```markdown
## Refactoring: [target]

### Before ([N] functions, [M] lines, [X] responsibilities):
```
[function name]()
├── [responsibility 1]
├── [responsibility 2]
└── [responsibility N]
```

### After ([N] functions, max [M] lines each, 1 responsibility each):
```
[function1]()  → [single responsibility]
[function2]()  → [single responsibility]
[function3]()  → [single responsibility]
```

### Canon Applied:
- `/feathers` - Found seam at [location]
- `/liskov` - Split by responsibility
- `/bloch` - Extracted utility class

### Changes Made:
- [specific change 1]
- [specific change 2]
- [specific change N]

### Next Steps:
- Run `/hard-review` for adversarial review
- Run tests to verify behavior preservation
```

## Rules

- Each function: ONE responsibility
- Max 30 lines per function
- Data prep functions must be pure (no side effects)
- Rendering functions receive complete data (no fetching/calculating)
- Match existing patterns in the codebase
- Security fixes FIRST, always

## Workflow Position: Legacy Code Flow

```
LEGACY CODE FLOW (this skill):
Existing Code → /plan → /structure-first → /refactor-clean → [review gates]

NEW CODE FLOW (use /build-from-plan instead):
PRD/Feature Request → /plan → /structure-first → /build-from-plan → [review gates]
```

`/refactor-clean` is the implementation phase for LEGACY CODE - after planning and structure analysis, before review gates.

### When to Use Which

| Situation | Use |
|-----------|-----|
| Refactoring existing code | `/refactor-clean` |
| Modernizing legacy code | `/refactor-clean` |
| Cleaning up tech debt | `/refactor-clean` |
| Splitting god classes | `/refactor-clean` |
| Building new feature from PRD | `/build-from-plan` |
| Adding new module/component | `/build-from-plan` |
| Greenfield development | `/build-from-plan` |

## Case Study

See [ClientController Refactoring](../docs/case-studies/CLIENT-CONTROLLER-REFACTORING.md) for a complete example:
- 1,151-line god controller → 6 focused controllers
- Canon applied: Bloch, Liskov, Kernighan, Gang of Four
- HIPAA violations fixed
- 77% reduction in main file size
