# Tutorial: Design Types First

Learn to use the structure-first agent to design data structures before implementation.

## What You'll Learn

- Run the structure-first agent
- Produce type definitions before code
- Transition to implementation

## Why Structure First?

Following Cherny's TypeScript guidance: design your types first, let them guide implementation. This agent:

1. Analyzes requirements
2. Produces interfaces and type definitions
3. Gets your approval before implementation

## Step 1: Start with a Design Task

```bash
npx canon-agent -a structure-first "Design the user authentication system"
```

## Step 2: Review the Proposed Types

The agent produces type definitions:

```typescript
// Discriminated union for auth state (Cherny pattern)
type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'authenticating' }
  | { status: 'authenticated'; user: User; tokens: TokenPair }
  | { status: 'error'; error: AuthError };

// User interface
interface User {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly Role[];
}

// Token management
interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: Date;
}
```

## Step 3: Approve and Implement

Once you approve the types, transition to implementation:

```bash
npx canon-agent "Implement the auth types we just designed"
```

The build-from-plan agent uses your approved types as the contract.

## Step 4: Verify Type Safety

The quality gates verify TypeScript compilation:

```
[10:35:20] Quality gates: 3 passed, 0 skipped
  - typescript: passed
  - tests: passed
  - lint: passed
```

## Key Principles Applied

| Principle | Application |
|-----------|-------------|
| Cherny: Discriminated unions | Auth states are explicit, exhaustive |
| Cherny: Readonly | All properties immutable by default |
| Gang of Four: Interface segregation | Small, focused interfaces |

## What's Next?

- [Refactor Legacy Code](./03-refactor-clean.md) - Clean up messy code
- [How Citation Works](../architecture/enforcement.md) - Understand enforcement
