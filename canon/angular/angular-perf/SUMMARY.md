# /angular-perf Summary

> "The fastest code is code that doesn't run."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Lazy load everything** | Feature modules, components |
| **OnPush everywhere** | Only check when inputs change |
| **Measure first** | Bundle analysis before optimization |

## Lazy Loading

```typescript
// Lazy load feature modules
{ path: 'users', loadChildren: () => import('./users/users.module') }

// Lazy load standalone components
{ path: 'dashboard', loadComponent: () => import('./dashboard.component') }
```

## OnPush Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
class ExpensiveComponent {
  @Input() items: Item[];  // Must be immutable
}
```

## TrackBy for ngFor

```html
<li *ngFor="let user of users; trackBy: trackByUserId">
```

## Bundle Budgets

```json
{
  "budgets": [{
    "type": "initial",
    "maximumWarning": "500kb",
    "maximumError": "1mb"
  }]
}
```

## Virtual Scrolling

```html
<cdk-virtual-scroll-viewport itemSize="50">
  <div *cdkVirtualFor="let item of items">{{ item.name }}</div>
</cdk-virtual-scroll-viewport>
```

## Defer Blocks (Angular 17+)

```html
@defer (on viewport) {
  <heavy-component />
} @placeholder {
  <skeleton />
}
```

## The Gechev Test

1. Is everything lazy loaded?
2. Is OnPush used everywhere?
3. Do all ngFor have trackBy?
4. Am I within bundle budgets?
5. Are large lists virtualized?

## When to Use

- Angular performance optimization
- Bundle size reduction
- Runtime efficiency

## Concrete Checks (MUST ANSWER)

- [ ] Does every `*ngFor` directive have a `trackBy` function that returns a unique, stable identifier (not the array index)?
- [ ] Is `ChangeDetectionStrategy.OnPush` set on every component that receives data via `@Input`?
- [ ] Are all feature routes configured with `loadChildren` or `loadComponent` for lazy loading (no eagerly imported feature modules)?
- [ ] Does every list rendering 50+ items use `cdk-virtual-scroll-viewport` or equivalent virtual scrolling?
- [ ] Are bundle budgets configured in `angular.json` with `maximumWarning` and `maximumError` thresholds for the initial bundle?
