# /async Summary

> "Async all the way down. Don't block on async code."

## Core Rules

| Rule | Why |
|------|-----|
| **Async all the way** | Blocking (.Result, .Wait()) causes deadlocks |
| **Avoid async void** | Exceptions vanish; only for event handlers |
| **Use CancellationToken** | Every async operation should be cancellable |
| **ConfigureAwait(false)** | In library code; don't capture context |

## Never Block on Async

```csharp
// DEADLOCK RISK
var result = GetDataAsync().Result;

// CORRECT
var result = await GetDataAsync();
```

## Concurrent Operations

```csharp
// SEQUENTIAL (slow)
foreach (var id in ids)
    await FetchAsync(id);

// CONCURRENT (fast)
var tasks = ids.Select(id => FetchAsync(id));
await Task.WhenAll(tasks);
```

## Error Handling

```csharp
// Errors inside switchMap/concurrent calls
var results = await Task.WhenAll(tasks);
// Only first exception thrown; get all via task.Exception
```

## Library vs Application

```csharp
// Application: Keep context (for UI)
await GetDataAsync();

// Library: Release context
await GetDataAsync().ConfigureAwait(false);
```

## When to Use

- Any async/await code
- Cancellation patterns
- Concurrent operations
- Debugging deadlocks

## HARD GATES (mandatory before writing code)

- [ ] **No fire-and-forget:** Every async function call is either awaited or its promise is stored and error-handled. No `doSomethingAsync()` without `await` or `.catch()`.
- [ ] **Parallel where possible:** If multiple async operations are independent, use `Promise.all()` not sequential `await`. Sequential awaits of independent operations waste time.
- [ ] **Timeout on everything external:** Every network call, database query, and subprocess has a timeout. Use `AbortController` or library-specific timeout options.
- [ ] **Error context preservation:** Every catch block in an async chain either handles the error meaningfully or rethrows with added context. No bare `catch (e) { throw e }`.
- [ ] **Graceful shutdown:** If your process has in-flight async operations, does it wait for them to complete before exiting? Abrupt exit during writes causes corruption.

## Concrete Checks (MUST ANSWER)

1. **Search for async function calls without `await`, `.then()`, or `.catch()`.** List each fire-and-forget call. For every one: is the result intentionally discarded? If not, add `await`. If intentionally discarded, add explicit error handling (`void someAsync().catch(handleError)`).
2. **Are there sequential `await` calls on independent operations?** Look for patterns like `const a = await fetchA(); const b = await fetchB();` where `b` does not depend on `a`. Replace with `const [a, b] = await Promise.all([fetchA(), fetchB()])`.
3. **Does every external call have a timeout?** For each `fetch`, database query, subprocess spawn, or third-party API call: is there an `AbortController` timeout, library timeout option, or `Promise.race` with a timer? If not, a hung external service hangs your process forever.
4. **What happens when `Promise.all` rejects?** For each `Promise.all` call: do you handle partial failure? Are the other promises left dangling? Consider `Promise.allSettled` if you need results from all promises regardless of individual failures.
5. **Is there an unhandled rejection handler?** Does the process have `process.on('unhandledRejection', ...)` or equivalent? In Node.js, unhandled rejections terminate the process by default. Every async boundary must either handle errors or propagate them.
