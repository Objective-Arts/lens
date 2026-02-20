# Angular Rubric

Loaded when Angular signals detected. Covers component architecture, reactivity, performance, and modern Angular patterns.

## Review Criteria

1. **Dependency Injection** — All dependencies constructor-injected. No `new` for services. No hidden dependencies via global state (`window`, `localStorage`). Abstract behind injectable tokens.
2. **Component Architecture** — Smart/presentational split. Constructors contain only assignments — no logic, no API calls. Single responsibility per component.
3. **Feature Organization** — Organized by domain, not by type. Lazy loading on all feature modules/standalone components. Barrel files export public API only.
4. **Change Detection** — `OnPush` on all components. Immutable `@Input()` properties. No expensive computation in templates.
5. **List Rendering** — `trackBy` on every `*ngFor` or `track` on every `@for`. Virtual scrolling (`cdkVirtualScrollViewport`) for >100 items.
6. **RxJS Discipline** — No nested subscribes — use `switchMap`/`mergeMap`/`concatMap`/`exhaustMap`. Correct operator choice: `switchMap` for cancellation, `concatMap` for order, `exhaustMap` for double-submit prevention. Error recovery inside operators with `catchError`.
7. **Subscription Cleanup** — Prefer async pipe or `takeUntilDestroyed()`. No manual `unsubscribe()` in `ngOnDestroy`. Shared HTTP observables use `shareReplay({ bufferSize: 1, refCount: true })`.
8. **Signals Over Subjects** — `signal()` for synchronous state, not `BehaviorSubject`. `computed()` for derived values, not `map()` pipes. Keep HTTP as Observable — only convert state to signals.
9. **Modern Syntax** — `@for`/`@if`/`@defer` over `*ngFor`/`*ngIf`/lazy modules (Angular 17+). `input()` function over `@Input()` decorator (Angular 17.1+). `inject()` over constructor injection where appropriate.
10. **Performance** — Bundle budgets configured and passing. `NgOptimizedImage` for images. Preloading strategy configured. `@defer` blocks for heavy components with viewport/idle triggers.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| DI | All dependencies injected. No `new` services. No global state. |
| Components | Smart/presentational split. OnPush. Single responsibility. |
| Organization | Feature-based. Lazy loaded. Barrel files. Path aliases. |
| Reactivity | Signals for state. RxJS for async streams. No nested subscribes. |
| Lists | trackBy/track on every loop. Virtual scroll for large lists. |
| Cleanup | Async pipe or takeUntilDestroyed. No manual unsubscribe. |
| Performance | Bundle budgets. Image optimization. Preloading strategy. |
