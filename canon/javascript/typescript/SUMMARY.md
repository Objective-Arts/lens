# /typescript Summary

> "The goal isn't to annotate everything—it's to annotate the minimum necessary and let TypeScript infer the rest."

## Essential Patterns

| Pattern | Apply When | Example |
|---------|------------|---------|
| **Let Inference Work** | Most code | `const x = [1,2,3]` not `const x: number[]` |
| **Const Assertions** | Literal types needed | `as const` for configs, actions |
| **Discriminated Unions** | Multiple states | `{ kind: 'success', value } \| { kind: 'error', message }` |
| **Generic Constraints** | Type-safe property access | `K extends keyof T` |
| **Type Guards** | Runtime narrowing | `function isString(x): x is string` |

## Quick Reference

```
SITUATION                          USE
──────────────────────────────────────────────────────
Define object shape              → interface (extensible)
Union, intersection, mapped      → type
Narrowing union types            → Discriminated union + switch
Validate without widening        → satisfies
Extract types from runtime       → typeof, ReturnType<typeof fn>
Safe property access             → K extends keyof T
Parse unknown input              → unknown + type guards
```

## Load Full Skill When

- Writing advanced mapped or conditional types
- Implementing generic factories or builders
- Function overloads for complex signatures
- Template literal types

## Type Inference Rules

1. **Don't annotate** what TypeScript can infer
2. **Use `as const`** for literal types in configs
3. **Extract types** with `ReturnType<typeof fn>` not manual duplication
4. **Prefer interfaces** for objects, types for everything else
5. **Never use `any`** - use `unknown` and narrow

## Discriminated Union Pattern

```typescript
type Result<T> =
  | { success: true; value: T }
  | { success: false; error: string };

// Exhaustiveness check in switch:
default: const _: never = result;
```
