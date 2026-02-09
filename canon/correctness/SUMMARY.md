# /correctness Summary

> "Testing shows the presence of bugs, not their absence."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Humble programmer** | Our brains are limited. Use discipline, not cleverness |
| **Simplicity is mandatory** | Complex programs cannot be understood or trusted |
| **Derive, don't write** | Programs should follow from specifications |
| **Prove correctness** | Don't trust intuition or testing alone |

## Structured Programming

**Only three constructs needed:**
1. Sequence (statements in order)
2. Selection (if/then/else)
3. Iteration (while loops)

**No goto. Ever.** One entry, one exit per block.

## Loop Invariants

To prove a loop correct:
```
// Invariant: sum = a[0] + ... + a[i-1]
sum := 0; i := 0
while i < n:
    sum := sum + a[i]
    i := i + 1
// Invariant + (i = n) proves: sum = a[0] + ... + a[n-1]
```

## Separation of Concerns

- Break problems into independent pieces
- Each layer complete, consistent, independent
- "The only available technique for ordering one's thoughts"

## Key Quotes

> "Simplicity is prerequisite for reliability."

> "Elegance is not a dispensable luxury but a quality that decides between success and failure."

> "If debugging is the process of removing bugs, then programming must be the process of putting them in."

## The Dijkstra Test

1. Is this simple enough to understand at once?
2. Is it structured? (one entry, one exit)
3. Could I prove this correct?
4. Have I separated concerns?
5. Am I being humble, or trusting my cleverness?

## When to Use

- Safety-critical systems (medical, aviation)
- Security-critical systems (crypto, auth)
- When cost of bugs exceeds cost of proof
- When testing cannot provide adequate confidence

## Concrete Checks (MUST ANSWER)

1. **Pre/postcondition audit:** For every public function, can you state (a) what must be true before calling it and (b) what it guarantees after returning? If you cannot state both, the function's contract is undefined — define it, and add runtime validation at module boundaries.
2. **Reasoning test:** For each function, can you trace the output from any given input without running the code or using a debugger? If the function's behavior depends on hidden state, external mutation, or non-obvious control flow, simplify until you can reason about it statically.
3. **Mock target check:** In every test file, list what is mocked. Is any mock replacing the module under test (not its dependencies)? If you mock storage to test storage logic, you are testing nothing — mock only what the subject depends on, never the subject itself.
4. **Error path coverage:** For every try/catch or error-handling branch, is there a test that triggers that specific error path? List each catch block and its corresponding test. Missing entries are untested production failure modes.
5. **Loop invariant identification:** For every loop, can you state what is true at the start of each iteration and what is true after the loop exits? If you cannot, the loop's correctness is unverified — state the invariant or simplify the loop.

## HARD GATES (mandatory before writing code)

- [ ] **Pre/postcondition documentation:** Every public function has documented preconditions (what must be true to call it) and postconditions (what it guarantees). Not as comments — as runtime checks at boundaries.
- [ ] **Test reality check (CRITICAL):** For every test file, list what is mocked. Is any mock replacing the module being tested? If you mock storage to test storage, you're testing nothing. Mocks replace DEPENDENCIES, never the subject.
  - BAD: testing `keychain.ts` with `storage.ts` mocked → keychain logic untested against real persistence
  - GOOD: testing `keychain.ts` with real `storage.ts`, temp directory for filesystem
- [ ] **Invariant identification:** Every loop has a stated invariant. Every data structure has stated invariants. If you can't state the invariant, you don't understand the code.
- [ ] **Error path testing:** For every try/catch, there is a test that triggers the catch branch. Untested error paths are the #1 source of production incidents.
