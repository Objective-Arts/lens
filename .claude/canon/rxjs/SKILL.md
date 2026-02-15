---
name: rxjs
description: "RxJS patterns for Angular"
allowed-tools: []
---

# Ben Lesh: Reactive Patterns

Ben Lesh's core belief: **Observables are for events over time, not single values.** Use the right tool: Promises for single async values, Observables for streams.

## The Foundational Principle

> "RxJS is a library for composing asynchronous and event-based programs using observable sequences."

The key word is **sequences**. If you have one value, you probably don't need RxJS.

## Core Principles

### 1. Know When NOT to Use RxJS

RxJS adds complexity. Use it when you have:
- Multiple values over time (events, WebSockets, polling)
- Need to combine multiple async sources
- Need cancellation
- Need complex transformation of async data

**Don't need RxJS:**
```typescript
// Single HTTP call - Promise is fine
async getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

**Need RxJS:**
```typescript
// Combining multiple sources, need cancellation
searchResults$ = this.searchTerm$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.searchService.search(term))
);
```

### 2. Prefer Higher-Order Mapping Operators

`switchMap`, `mergeMap`, `concatMap`, `exhaustMap` - know the difference.

| Operator | Behavior | Use When |
|----------|----------|----------|
| `switchMap` | Cancels previous | Type-ahead search |
| `mergeMap` | Runs all in parallel | Independent requests |
| `concatMap` | Queues, runs in order | Order matters |
| `exhaustMap` | Ignores new until done | Prevent double-submit |

**Not this:**
```typescript
// Nested subscribes - callback hell returns
this.searchTerm$.subscribe(term => {
  this.searchService.search(term).subscribe(results => {
    this.results = results;
  });
});
```

**This:**
```typescript
// Flat, cancels previous search
this.results$ = this.searchTerm$.pipe(
  debounceTime(300),
  switchMap(term => this.searchService.search(term))
);
```

### 3. Avoid Nested Subscribes

If you're subscribing inside a subscribe, you're doing it wrong.

**Not this:**
```typescript
this.user$.subscribe(user => {
  this.ordersService.getOrders(user.id).subscribe(orders => {
    this.orders = orders;
  });
});
```

**This:**
```typescript
this.orders$ = this.user$.pipe(
  switchMap(user => this.ordersService.getOrders(user.id))
);
```

### 4. Use Subjects Sparingly

Subjects are escape hatches. Prefer declarative streams.

**Not this:**
```typescript
class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  loadUsers() {
    this.http.get<User[]>('/users').subscribe(users => {
      this.usersSubject.next(users);  // Imperative push
    });
  }
}
```

**This:**
```typescript
class UserService {
  private refresh$ = new Subject<void>();

  users$ = this.refresh$.pipe(
    startWith(undefined),
    switchMap(() => this.http.get<User[]>('/users')),
    shareReplay(1)
  );

  refresh() {
    this.refresh$.next();
  }
}
```

### 5. Share Subscriptions with shareReplay

Multiple subscribers shouldn't trigger multiple HTTP calls.

**Not this:**
```typescript
// Each async pipe triggers a new HTTP request
user$ = this.http.get<User>('/api/user');
```
```html
<div>{{ (user$ | async)?.name }}</div>
<div>{{ (user$ | async)?.email }}</div>
<!-- Two HTTP requests! -->
```

**This:**
```typescript
user$ = this.http.get<User>('/api/user').pipe(
  shareReplay(1)
);
```
```html
<div>{{ (user$ | async)?.name }}</div>
<div>{{ (user$ | async)?.email }}</div>
<!-- One HTTP request, shared -->
```

**`shareReplay` options:**
```typescript
shareReplay({ bufferSize: 1, refCount: true })
// refCount: true = cleanup when no subscribers
// refCount: false = keep cached value forever
```

### 6. Handle Errors Properly

Errors terminate streams. Catch and recover.

**Not this:**
```typescript
// Error terminates stream - no more searches work
results$ = searchTerm$.pipe(
  switchMap(term => this.searchService.search(term))
  // Error here kills the whole stream
);
```

**This:**
```typescript
results$ = searchTerm$.pipe(
  switchMap(term => this.searchService.search(term).pipe(
    catchError(error => {
      console.error('Search failed:', error);
      return of([]);  // Recover with empty results
    })
  ))
);
```

### 7. Unsubscribe Properly

Memory leaks from forgotten subscriptions are the #1 RxJS bug.

**Options (best to worst):**

```typescript
// 1. BEST: async pipe (auto-unsubscribes)
@Component({
  template: `<div *ngFor="let item of items$ | async">{{ item }}</div>`
})

// 2. GOOD: takeUntilDestroyed (Angular 16+)
@Component({})
class MyComponent {
  items$ = this.service.getItems().pipe(
    takeUntilDestroyed()
  );
}

// 3. OK: takeUntil with destroy subject
@Component({})
class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.service.getItems().pipe(
      takeUntil(this.destroy$)
    ).subscribe(items => this.items = items);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// 4. AVOID: Manual unsubscribe (easy to forget)
```

### 8. Use Signals for Synchronous State (Angular 16+)

Signals are simpler than BehaviorSubject for synchronous state.

**Before (RxJS for everything):**
```typescript
class CounterService {
  private countSubject = new BehaviorSubject(0);
  count$ = this.countSubject.asObservable();

  increment() {
    this.countSubject.next(this.countSubject.value + 1);
  }
}
```

**After (Signals for sync state):**
```typescript
class CounterService {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
}
```

**Rule:** Use Signals for synchronous state, Observables for async streams.

### 9. Combine Streams Declaratively

Use combination operators, not imperative code.

```typescript
// Combine latest values
vm$ = combineLatest([
  this.user$,
  this.permissions$,
  this.settings$
]).pipe(
  map(([user, permissions, settings]) => ({ user, permissions, settings }))
);

// Wait for all to complete
allData$ = forkJoin([
  this.usersService.getAll(),
  this.rolesService.getAll()
]);

// Race - first to emit wins
result$ = race([
  this.cache.get(key),
  this.api.get(key)
]);
```

### 10. Debug with tap, Not console.log Everywhere

```typescript
results$ = searchTerm$.pipe(
  tap(term => console.log('Search term:', term)),
  switchMap(term => this.searchService.search(term)),
  tap(results => console.log('Results:', results.length))
);
```

## The Lesh Test

Before using RxJS, ask:

1. **Do I have multiple values over time?** If no, consider Promise/Signal
2. **Am I nesting subscribes?** Flatten with higher-order operators
3. **Am I using Subject as a crutch?** Can I make it declarative?
4. **Will every subscriber trigger side effects?** Use shareReplay
5. **Have I handled errors?** Streams terminate on error
6. **Will this unsubscribe?** Use async pipe or takeUntilDestroyed

## When Reviewing Code

Apply these checks:

- [ ] No nested subscribes
- [ ] Correct higher-order operator (switchMap vs mergeMap vs concatMap)
- [ ] shareReplay for shared HTTP observables
- [ ] Error handling inside switchMap
- [ ] Unsubscription strategy clear (async pipe, takeUntilDestroyed)
- [ ] Subjects used sparingly, not as default
- [ ] Signals considered for synchronous state

## Common Patterns

```typescript
// Type-ahead search
search$ = this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  filter(term => term.length >= 2),
  switchMap(term => this.searchService.search(term).pipe(
    catchError(() => of([]))
  ))
);

// Polling
data$ = timer(0, 30000).pipe(
  switchMap(() => this.api.getData()),
  retry(3),
  shareReplay(1)
);

// Optimistic update
save(item: Item) {
  const optimistic$ = of(item);  // Immediate
  const server$ = this.api.save(item).pipe(delay(0));  // Async
  return concat(optimistic$, server$);
}
```

## When NOT to Use This Skill

Use a different skill when:
- **Designing component architecture** → Use `angular-core`
- **Optimizing bundle size** → Use `angular-perf`
- **Single async values** → Use Promises
- **Synchronous state** → Use Signals

Ben Lesh is the **RxJS/reactive skill**—use it for streams, events, and complex async composition.

## Sources

- Lesh, RxJS documentation (as lead maintainer)
- "RxJS in Action" - Daniels & Atencio
- Lesh's conference talks and blog posts
- Angular documentation - RxJS integration

---

*"RxJS is powerful, but with great power comes great responsibility. Don't use it for everything."* — Ben Lesh
