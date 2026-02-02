# /crockford Summary

> "JavaScript has more bad parts than good parts. Use only the good parts."

## The Bad Parts (Never Use)

| Bad | Why |
|-----|-----|
| `==` | Type coercion chaos. Always use `===` |
| `with` | Ambiguous scope - impossible to reason about |
| `eval()` | Security hole, performance disaster |
| Implicit globals | `x = 5` creates global! Always use `const/let` |
| Bitwise operators | Rarely needed, often confused with `&&`/`||` |

## The Good Parts (Use These)

```javascript
// Functions as first-class objects
const double = x => x * 2;
[1, 2, 3].map(double);

// Closures for encapsulation
function counter() {
  let count = 0;
  return {
    increment: () => ++count,
    get: () => count
  };
}

// Object literals
const point = { x: 10, y: 20 };

// Array methods (no manual loops)
const adults = people.filter(p => p.age >= 18).map(p => p.name);
```

## Defensive Patterns

```javascript
// Fail fast
if (typeof b !== 'number') throw new TypeError('Must be number');

// Default parameters
function greet(name = 'Guest') { }

// Freeze constants
const CONFIG = Object.freeze({ API_URL: '...' });
```

## JSLint Rules

1. Always use `===` and `!==`
2. Always use braces for blocks
3. No fallthrough in switch
4. No eval, with, or implied globals
5. Declare variables at top of function

## When to Apply

- Legacy JS codebase (identify bad parts)
- Code review (flag dangerous patterns)
- Less critical with TypeScript (types catch many issues)
