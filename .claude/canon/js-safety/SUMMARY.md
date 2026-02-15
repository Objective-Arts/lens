# /js-safety Summary

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

## HARD GATES (mandatory before writing code)

- [ ] **Strict equality only:** Search for `==` and `!=`. Replace all with `===` and `!==`. Zero loose equality comparisons.
- [ ] **No implicit coercion:** Every type conversion is explicit: `Number()`, `String()`, `Boolean()`. No `+str` for numbers, no `!!val` for booleans.
- [ ] **Null handling:** Every nullable value is checked before access. Use optional chaining (`?.`) or explicit null checks. No `Cannot read property of undefined` in production.
- [ ] **Promise rejection handling:** Every Promise chain has a `.catch()` or is in a try/catch with await. Unhandled rejections crash Node processes.
- [ ] **No eval, no Function():** Search for `eval(` and `new Function(`. Delete them. There is always a safer alternative.

## Concrete Checks (MUST ANSWER)

1. **Search for `==` and `!=` (not `===`/`!==`). How many?** List each occurrence. For every one: replace with strict equality. Zero loose equality is the target. The only acceptable exception is `== null` to check for both null and undefined, and even that should be `?? ` or explicit.
2. **Search for `var`. How many?** Every `var` must be replaced with `const` (preferred) or `let`. Zero `var` declarations.
3. **Are there nested callbacks more than 2 levels deep?** Search for patterns like `fn(() => { fn(() => { fn(() => {`. If yes, refactor to async/await or extract named functions.
4. **Does any function rely on implicit type coercion?** Search for: `+someString` (to number), `'' + val` (to string), `!!val` (to boolean). Replace with `Number()`, `String()`, `Boolean()` for explicit intent.
5. **Is every nullable value guarded before property access?** Search for property access chains without `?.` on values that could be null/undefined. Each unguarded access is a potential `TypeError: Cannot read properties of undefined`.
