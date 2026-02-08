---
name: async
description: "Async/await and concurrency patterns"
---

# Cleary: Async Done Right

Stephen Cleary's core belief: **Async is about scalability, not performance.** It frees threads to do other work while waiting. Get the patterns right, and async code is as simple as sync code.

## The Foundational Principle

> "Async all the way down. Don't block on async code."

The moment you block (.Result, .Wait()), you lose all benefits and risk deadlocks.

---

## Core Principles

### 1. Async All the Way

Async must propagate through the entire call stack.

**Not this:**
```csharp
// WRONG: Blocking on async
public string GetData()
{
    return GetDataAsync().Result;  // DEADLOCK RISK!
}

public string GetData()
{
    return GetDataAsync().GetAwaiter().GetResult();  // Still blocking
}
```

**This:**
```csharp
// RIGHT: Async all the way up
public async Task<string> GetDataAsync()
{
    return await httpClient.GetStringAsync(url);
}

// Caller is also async
public async Task ProcessAsync()
{
    var data = await GetDataAsync();
    // ...
}
```

**Why blocking deadlocks:**
In UI/ASP.NET contexts, `await` captures a synchronization context. When you block with `.Result`, the thread waits. When the async operation completes, it tries to resume on that same thread—which is blocked waiting. Deadlock.

### 2. Avoid async void

`async void` is fire-and-forget with no error handling.

**Not this:**
```csharp
// WRONG: Exceptions vanish, caller can't await
async void ProcessData()
{
    await Task.Delay(1000);
    throw new Exception("Oops");  // Crashes the process!
}
```

**This:**
```csharp
// RIGHT: Return Task for error propagation
async Task ProcessDataAsync()
{
    await Task.Delay(1000);
    throw new Exception("Oops");  // Caller can catch
}
```

**The one exception:** Event handlers must be `async void`:
```csharp
// Event handlers - the only valid async void
private async void Button_Click(object sender, EventArgs e)
{
    try
    {
        await DoWorkAsync();
    }
    catch (Exception ex)
    {
        // Handle here since caller can't
        ShowError(ex.Message);
    }
}
```

### 3. Use CancellationToken

Every async operation should be cancellable.

```csharp
public async Task<Data> FetchDataAsync(CancellationToken cancellationToken = default)
{
    // Pass token to all async calls
    var response = await httpClient.GetAsync(url, cancellationToken);

    // Check for cancellation in loops
    foreach (var item in items)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await ProcessItemAsync(item, cancellationToken);
    }

    return result;
}

// Usage
var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
try
{
    var data = await FetchDataAsync(cts.Token);
}
catch (OperationCanceledException)
{
    // Handle timeout/cancellation
}
```

**Cancellation patterns:**
```csharp
// Timeout
var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));

// Manual cancellation
var cts = new CancellationTokenSource();
cts.Cancel();

// Linked tokens (cancel if any source cancels)
var linked = CancellationTokenSource.CreateLinkedTokenSource(token1, token2);

// Register cleanup
cancellationToken.Register(() => CleanupResources());
```

### 4. ConfigureAwait(false) in Libraries

Library code shouldn't capture the synchronization context.

```csharp
// APPLICATION code: Keep context (UI updates, HttpContext)
public async Task UpdateUIAsync()
{
    var data = await GetDataAsync();  // Default: captures context
    label.Text = data;                // Runs on UI thread
}

// LIBRARY code: Don't need context
public async Task<string> GetDataAsync()
{
    var response = await httpClient.GetAsync(url)
        .ConfigureAwait(false);  // Don't capture context

    return await response.Content.ReadAsStringAsync()
        .ConfigureAwait(false);
}
```

**Rule of thumb:**
- Application code: Omit ConfigureAwait (keep context)
- Library code: Always `.ConfigureAwait(false)`

### 5. Prefer Task.WhenAll for Concurrency

Don't await in loops when operations are independent.

**Not this:**
```csharp
// SEQUENTIAL: Each awaits before next starts
var results = new List<Data>();
foreach (var id in ids)
{
    var data = await FetchAsync(id);  // One at a time
    results.Add(data);
}
```

**This:**
```csharp
// CONCURRENT: All start immediately
var tasks = ids.Select(id => FetchAsync(id));
var results = await Task.WhenAll(tasks);
```

**Error handling with WhenAll:**
```csharp
var tasks = ids.Select(id => FetchAsync(id)).ToList();

try
{
    var results = await Task.WhenAll(tasks);
}
catch
{
    // Only first exception thrown
    // Get all exceptions:
    var exceptions = tasks
        .Where(t => t.IsFaulted)
        .Select(t => t.Exception);
}
```

### 6. Use ValueTask for Hot Paths

When methods often complete synchronously, avoid Task allocation.

```csharp
// Task: Always allocates
public async Task<int> GetValueAsync()
{
    if (cache.TryGetValue(key, out var value))
        return value;  // Still allocates Task<int>

    return await FetchFromDatabaseAsync();
}

// ValueTask: No allocation for sync path
public async ValueTask<int> GetValueAsync()
{
    if (cache.TryGetValue(key, out var value))
        return value;  // No allocation!

    return await FetchFromDatabaseAsync();
}
```

**ValueTask rules:**
- Don't await multiple times
- Don't use .Result/.Wait()
- Don't use with Task.WhenAll (convert to Task first)
- Only use when sync completion is common

### 7. Avoid Task.Run in ASP.NET

ASP.NET is already async. Task.Run just moves work to another thread.

**Not this:**
```csharp
// WRONG in ASP.NET: Pointless thread hop
public async Task<IActionResult> GetData()
{
    var data = await Task.Run(() => ProcessData());  // Why?
    return Ok(data);
}
```

**This:**
```csharp
// If ProcessData is CPU-bound and slow, just call it
public IActionResult GetData()
{
    var data = ProcessData();  // Direct call
    return Ok(data);
}

// If it's I/O-bound, make it async
public async Task<IActionResult> GetData()
{
    var data = await ProcessDataAsync();
    return Ok(data);
}
```

**When Task.Run is appropriate:**
- UI applications: Keep UI responsive during CPU work
- Wrapping sync I/O that can't be made truly async

---

## Common Patterns

### Async Initialization

```csharp
public class Service
{
    private readonly AsyncLazy<Database> _db;

    public Service()
    {
        _db = new AsyncLazy<Database>(() => InitializeDatabaseAsync());
    }

    public async Task<Data> GetDataAsync()
    {
        var db = await _db;
        return await db.QueryAsync();
    }
}

// AsyncLazy implementation
public class AsyncLazy<T> : Lazy<Task<T>>
{
    public AsyncLazy(Func<Task<T>> factory)
        : base(() => Task.Run(factory)) { }

    public TaskAwaiter<T> GetAwaiter() => Value.GetAwaiter();
}
```

### Async Disposal

```csharp
public class Connection : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await CloseAsync();
        GC.SuppressFinalize(this);
    }
}

// Usage with await using
await using var connection = new Connection();
await connection.SendAsync(data);
// DisposeAsync called automatically
```

### Async Streams

```csharp
public async IAsyncEnumerable<Item> GetItemsAsync(
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var batch in GetBatchesAsync(cancellationToken))
    {
        foreach (var item in batch)
        {
            yield return item;
        }
    }
}

// Consuming
await foreach (var item in GetItemsAsync(cancellationToken))
{
    await ProcessAsync(item);
}
```

### Semaphore for Throttling

```csharp
private readonly SemaphoreSlim _semaphore = new(maxConcurrency: 10);

public async Task<Data> FetchWithThrottleAsync(string url)
{
    await _semaphore.WaitAsync();
    try
    {
        return await httpClient.GetAsync(url);
    }
    finally
    {
        _semaphore.Release();
    }
}
```

---

## Anti-Patterns to Avoid

### Sync Over Async

```csharp
// NEVER DO THIS
public Data GetData()
{
    return GetDataAsync().Result;         // Blocks, deadlock risk
    return GetDataAsync().GetAwaiter().GetResult();  // Still blocks
    Task.Run(() => GetDataAsync()).Result;  // Thread pool exhaustion
}
```

### Async Over Sync

```csharp
// MISLEADING: Looks async, isn't
public Task<Data> GetDataAsync()
{
    return Task.FromResult(ComputeDataSync());  // Blocks caller's thread
}

// If you must wrap sync code, be explicit
public Task<Data> GetDataAsync()
{
    return Task.Run(() => ComputeDataSync());  // At least caller isn't blocked
}
```

### Fire and Forget Without Handling

```csharp
// BAD: Exception disappears
_ = DoSomethingAsync();

// BETTER: Handle errors
_ = DoSomethingAsync().ContinueWith(t =>
{
    if (t.IsFaulted)
        logger.LogError(t.Exception);
});

// BEST: Use a proper fire-and-forget helper
BackgroundTask.Run(async () =>
{
    await DoSomethingAsync();
});
```

---

## The Cleary Test

Before committing async code, ask:

1. **Async all the way?** No `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()`?
2. **No async void?** Except for event handlers?
3. **CancellationToken passed?** Through the entire call chain?
4. **ConfigureAwait(false)?** In library code?
5. **Concurrent where possible?** Using WhenAll for independent operations?
6. **ValueTask appropriate?** For hot paths with sync completion?

---

## When to Apply

| Scenario | Apply Cleary |
|----------|--------------|
| Any async/await code | Yes |
| Cancellation patterns | Yes |
| Concurrent operations | Yes |
| Deadlock debugging | Yes |
| Thread synchronization (locks) | Partially - async locks differ |
| Parallel CPU-bound work | No - use TPL/PLINQ |

---

## Source Material

- "Concurrency in C# Cookbook" (2nd Edition, O'Reilly, 2019)
- Blog: blog.stephencleary.com
- AsyncEx library (authored by Cleary)
- Microsoft async guidance contributions

---

*"There is no thread."* — Stephen Cleary (on understanding async)
