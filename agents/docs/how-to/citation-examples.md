# How to Cite Canon Correctly

The citation enforcer blocks code edits unless you (or Claude) cites a design principle. Here's how to cite effectively.

## Why Citations?

Citations force deliberate design decisions. Instead of writing code on autopilot, you must state *why* you're making each choice.

## Citation Format

Any mention of a canon author's name counts as a citation:

```
Following Cherny's preference for discriminated unions...
```

```
Per Dodds' testing guidance, we test user behavior not implementation...
```

```
Applying Rams' principle of less but better...
```

## Examples by Context

### TypeScript Design

```
Following Cherny's exhaustive pattern matching, I'll use a discriminated
union for the response type so TypeScript ensures all cases are handled.
```

### Testing

```
Per Dodds' Testing Library philosophy, I'll query by accessible role
rather than test IDs, testing what the user sees.
```

### Refactoring

```
Using Feathers' characterization test approach, I'll first write tests
that capture current behavior before making changes.
```

### API Design

```
Following Bloch's API design principles, I'll make this method
impossible to misuse by requiring explicit parameters.
```

### CSS/Design

```
Applying Rams' principle that less is more, I'll remove the decorative
border and let the content breathe.
```

## What Doesn't Count

These won't satisfy the citation checker:

```
# Missing author name
I'll use a discriminated union here.

# Wrong author (not in loaded canon)
Following Martin's SOLID principles...

# Too vague
Using best practices...
```

## Loaded Canon by Project Type

| Project Type | Auto-Loaded Canon |
|--------------|-------------------|
| All | kernighan, gang-of-four |
| TypeScript | cherny |
| JavaScript | kyle-simpson |
| React | norman, frost, rams |
| Tests | dodds, meszaros |
| Python | beazley, ramalho |

## Disabling Citation Enforcement

For quick tasks where you don't need enforcement:

```bash
npx canon-agent --no-citation "fix the typo in README"
```

Or in code:

```typescript
runWithCanon(prompt, 'build-from-plan', {
  enableCitationEnforcement: false,
});
```

## See Also

- [How Citation Enforcement Works](../architecture/enforcement.md)
- [Available Canon Authors](../reference/canon.md)
