# C# Rubric

Loaded when C#/.NET signals detected. Covers async patterns, nullable references, disposal, and idiomatic .NET.

## Review Criteria

1. **Nullable Reference Types** — `<Nullable>enable</Nullable>` in csproj. Use `?` annotations consistently. No suppression operators (`!`) except with documented reason. Treat nullable warnings as errors.
2. **Async All The Way Down** — `async`/`await` from top to bottom. No `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` — these deadlock under SynchronizationContext. Return `Task` not `void` (except event handlers).
3. **ConfigureAwait(false)** — In library code (anything not a controller/page/component), every `await` gets `.ConfigureAwait(false)`. Skip in ASP.NET controllers and Blazor components where context matters.
4. **CancellationToken** — Every public async method accepts a `CancellationToken` parameter. Pass it through to all downstream async calls. Check `token.ThrowIfCancellationRequested()` in long-running loops.
5. **Using Statements** — All `IDisposable` wrapped in `using` declarations or `using` blocks. Prefer `using var` (C# 8+) for shorter scope. `HttpClient` through `IHttpClientFactory`, not direct instantiation.
6. **Records for Immutable DTOs** — Use `record` types for data transfer objects, API responses, and value objects. Records give value equality, `with` expressions, and immutability by default.
7. **Span<T>/Memory<T>** — For buffer and string operations, prefer `Span<T>` and `ReadOnlySpan<T>` over array slicing. Use `string.AsSpan()` for parsing without allocation. Stackalloc for small buffers.
8. **Sealed by Default** — Public classes should be `sealed` unless designed for inheritance. Unsealed classes are a commitment to a contract. Abstract classes document the extension points.
9. **Pattern Matching** — Use `is`, `switch` expressions, and property patterns for type checks and destructuring. No `as` + null check when `is` does the same thing in one expression.
10. **LINQ Materialization** — Call `.ToList()` or `.ToArray()` before passing `IEnumerable` to multiple consumers. No LINQ queries inside loops. Prefer method syntax over query syntax for simple transforms.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Nullable | NRT enabled. Annotations consistent. No suppression abuse. |
| Async | async/await end-to-end. No sync-over-async. |
| Disposal | All IDisposable wrapped. HttpClient via factory. |
| Immutability | Records for DTOs. Readonly where possible. |
| Performance | Span for parsing. No LINQ in loops. Materialized enumerables. |
| Sealing | Public classes sealed unless inheritance is designed. |
| Cancellation | CancellationToken on public async methods. Passed through. |
