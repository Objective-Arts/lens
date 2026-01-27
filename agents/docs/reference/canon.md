# Canon Reference

Available design principle authors and when they're loaded.

## Always Loaded (Foundational)

| Canon | Author | Key Principle |
|-------|--------|---------------|
| `kernighan` | Brian Kernighan | Clarity and simplicity in code |
| `gang-of-four` | GoF | Design patterns |

## By Language

### TypeScript

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `javascript/cherny` | `.ts`, `.tsx` files | Discriminated unions, type inference |

### JavaScript

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `javascript/kyle-simpson` | `.js`, `.jsx` files | You Don't Know JS principles |

### Python

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `python/beazley` | `.py` files | Python cookbook patterns |
| `python/ramalho` | `.py` files | Fluent Python idioms |

### Go

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `pike` | `.go` files | Go proverbs, simplicity |

## By Context

### Testing

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `javascript/dodds` | Test files | Testing Library philosophy |
| `testing/meszaros` | Test files | xUnit test patterns |
| `testing/hevery` | Test files | Testability, DI |

### Frontend/React

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `ui-ux/norman` | React components | UX psychology |
| `ui-ux/frost` | UI components | Atomic design |
| `rams` | CSS files | Less but better |

### Security

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `security/schneier` | Auth code | Security mindset |

### Refactoring

| Canon | When Loaded | Key Principle |
|-------|-------------|---------------|
| `testing/feathers` | `refactor-clean` agent | Working with legacy code |

## Citation Examples

```
# TypeScript
Following Cherny's preference for discriminated unions...
Per Cherny's guidance on letting inference work...

# Testing
Following Dodds' Testing Library philosophy...
Per Meszaros' xUnit patterns, I'll use a test fixture...

# Design
Applying Norman's principle of visible affordances...
Following Frost's atomic design, this is a molecule...
Per Rams' principle of less but better...

# Patterns
Using Gang of Four's strategy pattern...
Following Kernighan's clarity principle...

# Legacy Code
Per Feathers' characterization test approach...
Following Feathers' sprout method pattern...
```

## Directory Structure

Canon lives in the canon directory:

```
canon/
├── javascript/
│   ├── cherny/
│   │   └── SUMMARY.md
│   ├── kyle-simpson/
│   │   └── SUMMARY.md
│   └── dodds/
│       └── SUMMARY.md
├── testing/
│   ├── meszaros/
│   │   └── SUMMARY.md
│   └── feathers/
│       └── SUMMARY.md
├── ui-ux/
│   ├── norman/
│   │   └── SUMMARY.md
│   └── frost/
│       └── SUMMARY.md
└── engineering/
    ├── kernighan/
    │   └── SUMMARY.md
    └── gang-of-four/
        └── SUMMARY.md
```

## See Also

- [How to Use Custom Canon](../how-to/custom-canon.md)
- [How Detection Works](../architecture/detection.md)
