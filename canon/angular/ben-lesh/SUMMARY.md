# /ben-lesh Summary

> "RxJS is for streams, not single values."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Know when NOT to use RxJS** | Single values = Promise/Signal |
| **No nested subscribes** | Flatten with operators |
| **Subjects sparingly** | Prefer declarative streams |

## Higher-Order Operators

| Operator | Behavior | Use When |
|----------|----------|----------|
| `switchMap` | Cancels previous | Type-ahead search |
| `mergeMap` | Runs all parallel | Independent requests |
| `concatMap` | Queues in order | Order matters |
| `exhaustMap` | Ignores until done | Prevent double-submit |

## Flatten, Don't Nest

```typescript
// BAD: Nested subscribes
this.user$.subscribe(user => {
  this.orders$.subscribe(orders => { ... });
});

// GOOD: Flat with operators
this.orders$ = this.user$.pipe(
  switchMap(user => this.ordersService.getOrders(user.id))
);
```

## Share Subscriptions

```typescript
// Multiple async pipes = one HTTP call
user$ = this.http.get<User>('/api/user').pipe(
  shareReplay(1)
);
```

## Unsubscribe Properly

1. **BEST:** async pipe (auto-unsubscribes)
2. **GOOD:** takeUntilDestroyed() (Angular 16+)
3. **OK:** takeUntil with destroy subject
4. **AVOID:** Manual unsubscribe

## Signals vs Observables

- **Signals:** Synchronous state
- **Observables:** Async streams, events over time

## When to Use

- RxJS patterns and anti-patterns
- Async stream composition
- Angular reactive programming
