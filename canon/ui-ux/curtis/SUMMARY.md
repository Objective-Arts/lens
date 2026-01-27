# /curtis Summary

> "Design systems die without governance."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **System is a product** | Needs owners, releases, feedback loops |
| **Documentation is interface** | If not documented, doesn't exist |
| **Tokens are contracts** | Changes break consumers |

## Token Hierarchy

```css
/* Global → Semantic → Component */

/* Global: raw values */
--color-blue-500: #3b82f6;

/* Semantic: purpose-driven */
--color-primary: var(--color-blue-500);

/* Component: specific usage */
--button-color: var(--color-primary);
```

## Semantic Versioning

```
MAJOR.MINOR.PATCH

Breaking: Remove component/prop, change prop type, rename token
Not Breaking: Add component, add prop with default, bug fix
```

## Deprecation Path

```
Phase 1: Console warning (size prop deprecated)
Phase 2: Document alternative (use CSS instead)
Phase 3: Remove in next major (v2.0.0)
```

## Component Documentation

Every component needs:
- Usage guidelines
- Variants table
- Props with types/defaults
- All states (default, hover, focus, disabled, loading)
- Accessibility notes
- Changelog

## Anti-Patterns

| Bad | Fix |
|-----|-----|
| No versioning | Semantic versioning |
| Undocumented changes | Changelog required |
| One-off exceptions | Add to system or reject |
| No deprecation | Major version + migration |

## When to Use

- Design system governance
- Component documentation
- Token architecture
- Release management
