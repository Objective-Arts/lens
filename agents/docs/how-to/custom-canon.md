# How to Use Custom Canon

Configure your own design principles and have them enforced.

## Set Canon Path

### Via Environment Variable

```bash
export CANON_PATH=/path/to/your/canon
npx canon-agent "your task"
```

### Via CLI Flag

```bash
npx canon-agent --canon-path ~/my-project/canon "your task"
```

### In Code

```typescript
import { setCanonPath, runWithCanon } from '@claude-optimal/agents';

setCanonPath('/path/to/your/canon');

for await (const msg of runWithCanon("task", 'build-from-plan')) {
  console.log(msg.content);
}
```

## Canon Directory Structure

```
my-canon/
├── typescript/
│   └── our-style/
│       └── SUMMARY.md    # Loaded for TS projects
├── testing/
│   └── our-patterns/
│       └── SUMMARY.md    # Loaded for test files
└── security/
    └── owasp/
        └── SUMMARY.md    # Loaded for auth-related code
```

## Create a SUMMARY.md

SUMMARY.md files are condensed principles (~500 tokens) loaded into context:

```markdown
# /our-style Summary

> "Code is for humans first, machines second."

## Core Principles

### Explicit Over Implicit
Never rely on type inference for public APIs.

```typescript
// WRONG: Inferred return type
function getUser(id: string) {
  return db.users.find(id);
}

// RIGHT: Explicit return type
function getUser(id: string): Promise<User | null> {
  return db.users.find(id);
}
```

### Discriminated Unions for State
Model state machines explicitly.

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| `any` type | Use `unknown` with type guard |
| Optional chaining abuse | Explicit null checks |

## When to Use

- All TypeScript files
- API boundaries
```

## Auto-Detection Patterns

Canon is auto-detected based on file patterns. Extend in `canon/detector.ts`:

```typescript
const CANON_PATTERNS = [
  { pattern: /\.tsx?$/, canon: ['typescript/our-style'] },
  { pattern: /auth|security/i, canon: ['security/owasp'] },
  { pattern: /test|spec/i, canon: ['testing/our-patterns'] },
];
```

## Verify Canon Loading

Run with verbose output to see what loads:

```bash
npx canon-agent "describe what canon you loaded"
```

Output:

```
Starting build-from-plan agent (loaded: our-style, owasp, our-patterns)
```

## See Also

- [Canon Reference](../reference/canon.md)
- [How Detection Works](../architecture/detection.md)
