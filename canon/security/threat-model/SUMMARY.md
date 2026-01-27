# threat-model — Summary

Adversarial security analysis that finds what static analysis misses.

## Core Questions

1. **Failure modes:** What if step 2 fails after step 1 succeeds?
2. **Trust boundaries:** Who controls this input?
3. **Deployment:** Does this work multi-instance?
4. **Replay:** What can attacker do with captured token?
5. **Atomicity:** Are related changes transactional?

## Key Assumptions

- Attacker controls env vars
- Network fails mid-operation
- In-memory state isn't shared across pods
- Valid tokens will be replayed

## Use For

- Auth/session code
- Password reset flows
- Payment transactions
- Multi-step state changes
- External input handling
