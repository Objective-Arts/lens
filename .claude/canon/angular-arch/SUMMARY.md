# /angular-arch Summary

> "Organize by feature, not by type."

## LIFT Principle

- **L**ocate code quickly
- **I**dentify at a glance
- **F**lattest structure
- **T**ry to stay DRY

## Feature Module Organization

```
src/app/
├── users/              # Feature module
│   ├── user-list.component.ts
│   ├── user.service.ts
│   ├── user.model.ts
│   └── users.module.ts
├── products/           # Another feature
└── shared/             # Reusable components
```

## Module Types

| Type | Purpose | Loads |
|------|---------|-------|
| Root (App) | Bootstrap | Once at startup |
| Feature | Business feature | Lazy loaded |
| Shared | Reusable components | Imported by features |
| Core | Singleton services | Once in AppModule |

## Smart vs Presentational

```
CONTAINER (Smart)        PRESENTATIONAL (Dumb)
user-shell.component     user-list.component

Fetch data               Display data
Handle state             Emit events
Coordinate children      Pure @Input/@Output
```

## Path Aliases

```typescript
// Instead of: '../../../core/services/user.service'
import { UserService } from '@core/services';
```

## State Management Complexity

```
Simple    → Services + BehaviorSubject
Medium    → Component Store (@ngrx/component-store)
Complex   → Global Store (@ngrx/store)
```

## When to Use

- Angular project structure
- Module organization
- Architecture decisions

## Concrete Checks (MUST ANSWER)

- [ ] Is every feature module configured for lazy loading via `loadChildren` or `loadComponent` in the route config?
- [ ] Does each feature module import only what it needs, with zero imports from other feature modules?
- [ ] Does the SharedModule contain only reusable, stateless components/pipes/directives -- no services, no business logic, no feature-specific code?
- [ ] Is the CoreModule imported exactly once in AppModule, with a guard preventing re-import?
- [ ] Does every container (smart) component have zero direct DOM rendering of business data -- delegating all display to presentational children via @Input/@Output?
