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
