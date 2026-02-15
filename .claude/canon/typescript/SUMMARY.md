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

## HARD GATES (mandatory before writing code)

- [ ] **No `any` escape:** Search for `any` in your types. Each one is a type system bypass. Replace with `unknown` + type guard, or a proper generic. Zero `any` is the target.
- [ ] **Strict mode:** Is `"strict": true` in tsconfig.json? If not, enable it. Non-strict TypeScript is a different (worse) language.
- [ ] **Return type enforcement:** Every exported function has an explicit return type annotation. Inferred return types on public APIs leak implementation details.
- [ ] **Readonly by default:** Every property and parameter that isn't mutated should be `readonly`. Every array that isn't mutated should be `ReadonlyArray<T>`.
- [ ] **Discriminated unions over optional fields:** If an object can be in multiple states, use a discriminated union with a `kind`/`type` field, not a flat type with optional fields that create impossible combinations.

## Concrete Checks (MUST ANSWER)

1. **Search for `any` -- how many?** List every `any` in your types and type assertions (`as any`). For each one: can it be replaced with `unknown`, a generic, or a specific type? If you cannot justify it in one sentence, replace it.
2. **Is a generic doing the job of a union?** For each generic parameter `<T>`, ask: does `T` actually vary across callers, or is it always one of 2-3 known types? If the latter, replace the generic with a union type.
3. **Can you read each utility type aloud?** For every mapped, conditional, or template literal type: can a mid-level TypeScript developer understand it without hovering for IDE inference? If you need more than one `extends ? :` nesting level, extract into named types.
4. **Are impossible states representable?** List every type with 2+ optional fields. Can you construct a value where field A is present but field B is absent in a way that makes no business sense? If yes, refactor to a discriminated union.
5. **Does every exported function have an explicit return type?** Check each `export function` and `export const fn =`. If the return type is inferred, add it explicitly -- inferred return types on public APIs leak implementation details across module boundaries.
