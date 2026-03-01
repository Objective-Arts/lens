# C# Rubric

Loaded when C#/.NET signals detected. Covers async patterns, nullable references, disposal, DI, EF Core, and idiomatic .NET.

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
11. **Dependency Injection** — Constructor injection only. No service locator (`GetService` in business logic). Register with correct lifetime: Scoped for per-request (DbContext, UnitOfWork), Singleton for stateless services, Transient for lightweight stateless. Never inject Scoped into Singleton.
12. **Options Pattern** — Configuration via `IOptions<T>`, `IOptionsSnapshot<T>`, or `IOptionsMonitor<T>`. Bind to strongly-typed POCO classes. Validate with `ValidateDataAnnotations()` or `ValidateOnStart()`. No raw `IConfiguration` in business logic.
13. **EF Core Queries** — No N+1 queries — use `.Include()` or projection (`.Select()`). Use `AsNoTracking()` for read-only queries. Split queries for multiple collection includes. No client-side evaluation — all filtering in the query.
14. **Guard Clauses** — Use `ArgumentNullException.ThrowIfNull()`, `ArgumentException.ThrowIfNullOrEmpty()` (C# 11+). Validate at public method boundaries. Fail fast with specific exception types, not generic `Exception`.
15. **String Handling** — Use `StringComparison.Ordinal` or `StringComparison.OrdinalIgnoreCase` for non-linguistic comparisons. `string.Equals()` over `==` when comparison type matters. Interpolated strings over `string.Format()`. `StringBuilder` for loops.
16. **Middleware Ordering** — Exception handling first, then CORS, auth, authorization, then endpoint routing. `UseExceptionHandler` before everything. Static files before routing. Compression before response body.
17. **IAsyncEnumerable** — Use `IAsyncEnumerable<T>` for streaming data from database queries, file reads, or API pagination. `await foreach` on the consumer side. Yield results as they arrive — don't buffer into a list first.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Nullable | NRT enabled. Annotations consistent. No suppression abuse. |
| Async | async/await end-to-end. No sync-over-async. CancellationToken on public methods. |
| Disposal | All IDisposable wrapped. HttpClient via factory. |
| Immutability | Records for DTOs. Readonly where possible. |
| Performance | Span for parsing. No LINQ in loops. AsNoTracking for reads. |
| Sealing | Public classes sealed unless inheritance is designed. |
| DI Lifetimes | Correct Scoped/Singleton/Transient. No service locator. |
| Configuration | Options pattern. Validated. No raw IConfiguration in business logic. |
| EF Core | No N+1. Projection or Include. No client-side evaluation. |
| Middleware | Correct ordering. Exception handler first. |
