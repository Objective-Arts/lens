# /ashkenas Summary

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
