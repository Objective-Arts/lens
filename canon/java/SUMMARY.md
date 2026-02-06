# /java Summary

> "APIs should be easy to use correctly and hard to use incorrectly." — Joshua Bloch

## Essential Items (Top 10)

| # | Item | Apply When |
|---|------|------------|
| 1 | Static factory methods over constructors | Creating objects (always consider) |
| 2 | Builder for many constructor parameters | >4 parameters, optional params |
| 17 | Minimize mutability | Default stance (immutable unless reason not to) |
| 15 | Minimize accessibility | Everything private until proven otherwise |
| 50 | Avoid strings where other types appropriate | IDs, enums, capabilities |
| 18 | Favor composition over inheritance | Code reuse (inherit only for true is-a) |
| 64 | Refer to objects by interfaces | Variable/parameter declarations |
| 13 | Minimize class/member accessibility | API surface area |
| 39 | Make defensive copies when needed | Receiving/returning mutable objects |
| 69 | Use exceptions for exceptional conditions | Not for control flow |

## Load Full Skill When

- Designing a public API (need all API design items)
- Working with generics (Items 26-33)
- Concurrency code (Items 78-84)
- Enum design (Items 34-41)
- Making deep immutability decisions

## Quick Reference

```
SITUATION                        ITEM TO APPLY
─────────────────────────────────────────────────
Creating objects                → Item 1: Static factory
Many parameters                 → Item 2: Builder
Class design                    → Item 17: Immutable default
Extending class                 → Item 18: Composition over inheritance
Field visibility                → Item 15: Private default
Return types                    → Item 64: Interface types
Mutable parameters              → Item 39: Defensive copies
Error handling                  → Item 69: Exceptions for exceptional
```

## Immutability Checklist (Item 17)

- [ ] Class is final (or all constructors private)
- [ ] All fields are final
- [ ] All fields are private
- [ ] No mutator methods
- [ ] Mutable components: defensive copy in, defensive copy out
