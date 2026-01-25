---
name: refactor-clean
description: Systematically clean up messy code with clear before/after structure. Use for tech debt, code smells, or cleaning up before adding features.
---

# /refactor-clean

Systematically refactor target code following these priorities:

## Process

1. **Decompose** functions >30 lines into single-responsibility units
2. **Separate** data preparation from rendering/presentation
3. **Unify** inconsistent patterns (pick one approach, apply everywhere)
4. **Extract** inline calculations into named pure functions
5. **Show** before/after structure summary

## Target

If a path argument is provided, refactor that file/directory.
If no argument, refactor the code most recently discussed or modified.

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

### Changes Made:
- [specific change 1]
- [specific change 2]
- [specific change N]
```

## Rules

- Each function: ONE responsibility
- Max 30 lines per function
- Data prep functions must be pure (no side effects)
- Rendering functions receive complete data (no fetching/calculating)
- Match existing patterns in the codebase
- Event handlers attached once, not on every render
