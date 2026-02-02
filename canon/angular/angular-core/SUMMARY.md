# /hevery Summary

> "If it's hard to test, it's hard to use."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **DI is architecture** | All dependencies explicit in constructor |
| **Constructor does nothing** | Assignment only, no logic |
| **Smart vs Presentational** | Separate state from rendering |

## Dependency Injection

```typescript
// BAD: Hidden dependencies
class UserService {
  private http = new HttpClient();  // Hidden!
}

// GOOD: Explicit, injectable
@Injectable({ providedIn: 'root' })
class UserService {
  constructor(private http: HttpClient) {}  // Visible
}
```

## Constructor Rules

```typescript
// BAD: Logic in constructor
constructor(private api: ApiService) {
  this.data = this.api.fetchData();  // Side effect!
}

// GOOD: Assignment only
constructor(private api: ApiService) {}  // Just assign

ngOnInit() {
  this.api.fetchData().subscribe(...);  // Logic here
}
```

## Smart vs Presentational

```
SMART                    PRESENTATIONAL
Knows about services     Knows only @Input/@Output
Manages state            Stateless
Few in app               Many in app
Hard to test             Easy to test
```

## The Hevery Test

1. Can I test this in isolation?
2. Are all dependencies in constructor?
3. Is constructor boring (just assignments)?
4. Can I swap implementations?

## When to Use

- Angular architecture design
- DI and testability patterns
- Component design
