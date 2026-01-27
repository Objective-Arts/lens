# /minko-gechev Summary

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
