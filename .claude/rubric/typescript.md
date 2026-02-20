# TypeScript Rubric

Loaded when TypeScript signals detected. Covers type safety, inference, strictness, and idiomatic patterns.

## Review Criteria

1. **Strict Mode** — `strict: true` in tsconfig. No `skipLibCheck` as a workaround for type errors. All strict flags enabled (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` where practical).
2. **Inference Over Annotation** — Let TypeScript infer types. Don't annotate variables, return types, or callbacks where inference works. Over-annotation is noise.
3. **Unknown Over Any** — Use `unknown` at boundaries, narrow with type guards. `any` disables the type system. Flag every `any` that isn't a deliberate, commented escape hatch.
4. **Type Guards Over Assertions** — `as` casts bypass safety. Use discriminated unions, `in` checks, `instanceof`, or custom type guard functions (`is` return type) instead.
5. **Discriminated Unions** — Model state machines with tagged unions, not optional fields. Illegal states should be unrepresentable. Exhaustive `switch` with `never` default.
6. **Const Assertions** — Use `as const` for literal types, config objects, and string unions derived from arrays. Avoid widening to `string` or `number` when a literal is known.
7. **Branded Types** — Use branded/opaque types for domain identifiers (`UserId`, `OrderId`) to prevent accidental mixing of structurally identical primitives.
8. **Null Handling** — `strictNullChecks` always on. No non-null assertions (`!`) except in test code. Use optional chaining (`?.`) and nullish coalescing (`??`), not truthy checks on non-booleans.
9. **Generic Constraints** — Generics should be constrained (`<T extends Base>`) not open (`<T>`). Unused generic parameters are dead weight — remove them.
10. **Module Boundaries** — Export types explicitly. Public API types annotated, internal types inferred. Re-export from barrel files. No circular type dependencies.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Strict Mode | tsconfig strict: true. No workarounds. |
| Type Strategy | Inference by default. Annotate public API boundaries. |
| Any Elimination | unknown at boundaries. Type guards for narrowing. |
| State Modeling | Discriminated unions for state. Exhaustive switches. |
| Null Safety | strictNullChecks. No non-null assertions in production. |
| Branded Types | Domain IDs typed to prevent structural confusion. |
