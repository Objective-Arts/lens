# /functional Summary

> "Readable over clever. Code is read far more than written."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Readable over clever** | Optimize for the reader 6 months from now |
| **Small, focused functions** | One thing per function; awkward name = does too much |
| **Functional foundations** | map/filter/reduce over loops, immutable data |
| **Minimal API surface** | Every public method is a promise to maintain |

## Collection-First Thinking

```javascript
// GOOD: Transform collections
const getActiveEmails = users =>
  users.filter(u => u.active).map(u => u.email);

// BAD: Imperative loops
const getActiveEmails = users => {
  const emails = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].active) emails.push(users[i].email);
  }
  return emails;
};
```

## Chainable API Design

```javascript
const topUsers = new Query(users)
  .where(u => u.active)
  .where(u => u.score > 100)
  .sortBy('score', 'desc')
  .limit(10)
  .value();
```

## Naming Conventions

```javascript
// Predicates: is/has/can
const isEmpty = arr => arr.length === 0;

// Transformers: verbs
const slugify = str => str.toLowerCase().replace(/\s+/g, '-');

// Getters: match property
const getName = obj => obj.name;
```

## When to Use

- Writing utility functions
- Designing library APIs
- Collection manipulation
- Refactoring imperative to functional

## HARD GATES (mandatory before writing code)

- [ ] **Immutability check:** List every variable declared with `let`. Can any be `const`? List every array mutation (push, splice, sort). Can any use spread/map/filter instead?
- [ ] **Side effect inventory:** List every function that modifies external state (writes files, updates DB, modifies global, logs). These must be at the edges, not in core logic.
- [ ] **Pure function ratio:** Count pure vs impure functions. If <70% are pure, refactor: extract computation from I/O.
- [ ] **No shared mutable state:** If two functions modify the same object/array, extract the shared state into a parameter and return a new copy.

## Concrete Checks (MUST ANSWER)

1. **List every function that modifies something outside its own scope.** For each: does it write to a file, mutate a parameter, update a global, push to an external array, or modify `this`? Can the side effect be moved to the caller so this function becomes pure?
2. **Are there two or more functions that read and write the same mutable variable?** If yes, you have shared mutable state. Refactor: pass the value as a parameter, return a new copy, let the caller coordinate.
3. **Search for `.push()`, `.splice()`, `.sort()`, `delete obj[key]`, and `obj[key] = val`.** For each mutation: can it be replaced with spread, `map`, `filter`, `toSorted()`, or object rest? If the mutation is in a loop accumulating results, replace the loop with `reduce` or `map`.
4. **Does any function take more than 3 parameters?** If yes, can the parameters be grouped into an options object, or is the function doing too many things?
5. **Can you describe each function's purpose without the word "and"?** If a function "validates and transforms" or "fetches and caches," split it into two functions.
