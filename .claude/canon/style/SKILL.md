---
name: style
description: "Google Coding Standards - universal style principles"
allowed-tools: []
---

# Google Style: Consistency and Clarity

Google's style guides share a core belief: **Code is read more than written. Optimize for the reader.** Every formatting and naming decision should minimize cognitive load on the next person reading the code.

## The Foundational Principle

> "Avoid clever tricks. Prefer simple, direct code that anyone can understand."

Readability trumps brevity. If a reviewer has to pause and think about what a line does, it's too clever.

## Core Principles

### 1. Naming: Be Descriptive and Consistent

Names should fully describe what something is or does. Avoid abbreviations unless universally understood.

**Not this:**
```typescript
const d = new Date();
const ymdStr = d.toISOString().split('T')[0];
function proc(u) { return u.n + ' ' + u.e; }
```

**This:**
```typescript
const currentDate = new Date();
const dateString = currentDate.toISOString().split('T')[0];
function formatUserDisplay(user) { return user.name + ' ' + user.email; }
```

**Naming conventions:**
- Variables/functions: describe content/action (`userCount`, `fetchUserData`)
- Booleans: start with `is`, `has`, `should`, `can` (`isActive`, `hasPermission`)
- Constants: SCREAMING_SNAKE_CASE for true constants (`MAX_RETRY_COUNT`)
- Types/Classes: PascalCase (`UserAccount`, `HttpClient`)

### 2. Functions: Small, Single Purpose

Each function should do one thing. If you need "and" to describe it, split it.

**Not this:**
```typescript
function processUserAndSendEmail(user) {
  validateUser(user);
  enrichUserData(user);
  saveToDatabase(user);
  sendWelcomeEmail(user);
  logAnalytics(user);
}
```

**This:**
```typescript
function registerNewUser(user) {
  const validUser = validateUser(user);
  const enrichedUser = enrichUserData(validUser);
  return saveToDatabase(enrichedUser);
}

function onUserRegistered(user) {
  sendWelcomeEmail(user);
  logAnalytics(user);
}
```

**Guidelines:**
- Functions under 40 lines (ideally under 20)
- Maximum 4-5 parameters (use objects for more)
- One level of abstraction per function
- Return early for guard clauses

### 3. Comments: Explain Why, Not What

Code should be self-documenting. Comments explain intent, not mechanics.

**Not this:**
```typescript
// Increment counter by 1
counter++;

// Loop through users
for (const user of users) {
  // Check if user is active
  if (user.isActive) {
    // Add to result
    result.push(user);
  }
}
```

**This:**
```typescript
counter++;

const activeUsers = users.filter(user => user.isActive);

// Retry limit set to 3 based on network latency analysis from Q3 2024
// See: go/retry-analysis-doc
const MAX_RETRIES = 3;
```

**When to comment:**
- Complex algorithms (link to explanation)
- Non-obvious business logic
- Workarounds for known issues (include bug reference)
- Public API documentation

**Never comment:**
- Self-explanatory code
- Changes to version control (that's what commits are for)
- Commented-out code (delete it)
- Source citations ("Bloch Item 24", "per Kernighan", "Liskov principle") — patterns should be self-evident

### 4. Formatting: Consistency Over Preference

Use automated formatters. Don't argue about style.

**Rules:**
- Line length: 80-100 characters max
- Indentation: 2 spaces (Google standard across languages)
- One statement per line
- Blank lines separate logical sections
- Imports sorted and grouped (stdlib, external, internal)

**Braces:**
```typescript
// Opening brace on same line (K&R style)
if (condition) {
  doSomething();
} else {
  doOther();
}

// Exception: chained methods may break before dots
fetch(url)
  .then(response => response.json())
  .then(data => process(data));
```

### 5. Error Handling: Be Explicit

Don't swallow errors. Don't use exceptions for control flow.

**Not this:**
```typescript
try {
  return JSON.parse(data);
} catch (e) {
  return null;  // Silent failure
}

// Exception for control flow
try {
  return findUser(id);
} catch (NotFoundError) {
  return createUser(id);
}
```

**This:**
```typescript
function parseJsonSafe(data: string): Result<unknown, ParseError> {
  try {
    return { ok: true, value: JSON.parse(data) };
  } catch (error) {
    return { ok: false, error: new ParseError(error.message) };
  }
}

const existingUser = findUser(id);
if (!existingUser) {
  return createUser(id);
}
return existingUser;
```

### 6. Imports: Organize and Minimize

**Order (with blank lines between groups):**
1. Standard library / language builtins
2. Third-party packages
3. Internal/project modules

**Rules:**
- Prefer named imports over namespace imports
- Import what you use (no barrel exports of everything)
- Avoid circular dependencies

```typescript
// Standard library
import * as fs from 'fs';
import * as path from 'path';

// Third-party
import { Router } from 'express';
import { z } from 'zod';

// Internal
import { UserService } from './services/user.js';
import { formatDate } from './utils/dates.js';
```

### 7. Code Organization: Logical Grouping

**File structure:**
- One primary export per file (with related helpers)
- Group by feature, not by type
- Keep files under 400 lines

**Within a file:**
```typescript
// 1. Imports

// 2. Constants and types

// 3. Main class/function

// 4. Helper functions (private)

// 5. Exports (if not inline)
```

### 8. TODO Comments: Include Context

TODOs must include who, why, and ideally a tracking reference.

**Not this:**
```typescript
// TODO: fix this later
// TODO: optimize
```

**This:**
```typescript
// TODO(username): Extract to shared utility after feature freeze
// TODO(b/12345): Remove workaround when upstream bug is fixed
```

## The Google Style Test

Before committing, ask:

1. **Is it readable?** Can someone unfamiliar understand it in one pass?
2. **Is it consistent?** Does it match the surrounding code?
3. **Is it simple?** Is there a more straightforward way?
4. **Is it necessary?** Does every line earn its place?
5. **Is it documented?** Are the non-obvious parts explained?

## When Reviewing Code

Apply these checks:

- [ ] Names describe purpose without abbreviation
- [ ] Functions do one thing and are under 40 lines
- [ ] Comments explain why, not what
- [ ] Formatting is automated (no style debates)
- [ ] Errors handled explicitly, never swallowed
- [ ] Imports organized and minimal
- [ ] No TODO without owner and context
- [ ] No magic numbers (use named constants)
- [ ] No dead code or commented-out sections

## When NOT to Use This Skill

Use a different skill when:
- **Designing APIs/classes** -> Use `java` (defensive design patterns)
- **Writing idiomatic language code** -> Use language-specific skill (`typescript`, `python-patterns`, etc.)
- **Performance optimization** -> Use `optimization` (measurement-first optimization)
- **Complex algorithm design** -> Use `algorithms` (literate programming)

Google Style is the **universal formatting/clarity skill**—use it alongside language-specific skills for consistent, readable code.

## Sources

- Google TypeScript Style Guide (https://google.github.io/styleguide/tsguide.html)
- Google JavaScript Style Guide (https://google.github.io/styleguide/jsguide.html)
- Google Python Style Guide (https://google.github.io/styleguide/pyguide.html)
- Google Java Style Guide (https://google.github.io/styleguide/javaguide.html)
- Google C++ Style Guide (https://google.github.io/styleguide/cppguide.html)
- "Readability": Google's internal code quality program

---

*"Code is read more than written. Optimize for the reader, not the writer."* — Google Engineering
