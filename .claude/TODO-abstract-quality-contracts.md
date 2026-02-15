# Abstract Quality Contracts (DO NOT DELETE)

## The Problem

The pipeline is 80% inspection. Phase 3 writes code guided by canon summaries and lessons — both are exhortation ("please write good code"). Deming's 10th point: eliminate slogans and exhortation. Change the system, not the worker.

## The Insight

Every defect at a boundary is a type violation in disguise. A raw string passed to `path.join` is an unvalidated input masquerading as a safe path. An error without a cause is a context-free failure masquerading as a useful diagnostic. A secret logged to console is a privileged value treated as a public one.

If the design names these distinctions, the implementation must honor them.

## Abstract Quality Types

These are language-agnostic. They describe what data IS, not how it's encoded.

| Abstract Type | Meaning | Violation Example |
|--------------|---------|-------------------|
| **ValidatedInput** | Data that has passed boundary validation | Raw CLI arg used directly in logic |
| **SafePath** | A path constructed through validation, not string concatenation | `path.join(dir, userInput)` without checking `userInput` |
| **CausedError** | An error that preserves the original cause | `throw new Error("failed")` with no cause chain |
| **Secret** | A value that must never appear in logs, errors, or responses | `console.error(config)` where config contains API keys |
| **ExternalData** | Untrusted data from outside the system (file reads, API responses) | Parsing JSON without try-catch, assuming structure |
| **BoundedOperation** | An operation with a timeout or size limit | Recursive traversal with no depth limit |
| **IdempotentAction** | An action safe to retry without side effects | File write without atomic rename pattern |

## How It Would Work

### Phase 2 (structure) defines contracts

For each feature, Phase 2 identifies every boundary where data enters or leaves the system. It assigns an abstract type and specifies the contract:

```
QUALITY_CONTRACTS

| Boundary            | Abstract Type    | Contract                                                     |
|---------------------|-----------------|--------------------------------------------------------------|
| CLI name arg        | ValidatedInput  | Must pass regex + length check via validateName() before use |
| File read           | ExternalData    | Must be parsed in try-catch, error includes cause + path     |
| Error to user       | CausedError     | All thrown errors must include {cause: originalError}         |
| Config with secrets | Secret          | Must not appear in console.error or thrown error messages     |
| Directory traversal | BoundedOperation| Must have maxDepth parameter, default 10                     |
```

### Phase 1 (plan) distills per-unit constraints

Each work item gets ONE targeted rule with a BAD/GOOD example:

```
WI-3: createProfile
  Canon constraint: Accept ValidatedInput, not raw string.
  BAD:  function create(name: string) { writeFileSync(path.join(dir, name), ...) }
  GOOD: function create(name: ValidatedName) { try { ... } catch(e) { throw new Error(..., {cause: e}) } }
```

3 lines instead of a 50-line canon summary.

### Phase 3 (implementation) implements contracts

Phase 3 reads the constraint from the plan (not a full canon file). It implements the abstract type in the target language's idiom:

- TypeScript: branded types (`type SafePath = string & { __brand: "SafePath" }`)
- Python: Pydantic models with validators
- Java: wrapper classes with factory methods
- Go: custom types (`type SafePath string`) with constructor functions
- C#: records with validation in constructor

### Gate 3.5 verifies structurally

The construction check at gate 3.5 verifies the contracts were implemented:
- Does the validation function exist?
- Does the error type include a cause parameter?
- Does the function signature accept the abstract type, not the raw type?

## What This Buys

### Shifted to built-in

| Before | After |
|--------|-------|
| Phase 3 reads 500 lines of canon + lessons and applies what it remembers | Phase 3 reads 3-line constraint per unit from the plan |
| Validation is "hoped for" based on exhortation | Validation is specified in the contract, verified at the gate |
| Error handling is a canon principle | Error handling is a type requirement (CausedError) |
| Security is a review phase concern | Security boundaries are defined in the design |

### Still inspection (honest limits)

| What moves to built-in | What stays inspection |
|------------------------|----------------------|
| Validation functions exist at boundaries | Validation logic is correct |
| Error types include cause | Error messages are useful |
| Secrets not in obvious log calls | Secrets not leaked through indirect paths |
| Function signatures match contracts | Function behavior matches contracts |

The construction check can verify STRUCTURE (does the validation function exist?) but not BEHAVIOR (does it validate correctly?). The inspection phases catch behavioral gaps. This doesn't eliminate inspection — it reduces what inspection has to find.

## Estimated Impact

Rough guess based on what the review phases typically catch:

| Finding category | % of typical findings | Preventable by contracts? |
|-----------------|----------------------|--------------------------|
| Missing input validation | ~25% | Yes — contract requires it |
| Missing error cause chains | ~15% | Yes — CausedError type |
| Path traversal / injection | ~10% | Yes — SafePath type |
| Secret leakage in errors | ~5% | Partially — obvious cases |
| Architecture / coupling | ~15% | No — judgment required |
| AI smells / style | ~15% | No — judgment required |
| Logic bugs | ~10% | No — behavioral, not structural |
| Test gaps | ~5% | No — Phase 10's job |

Maybe 50-55% of typical findings are structurally preventable by contracts. The inspection phases would still find the other 45-50%, but they'd have less to find.

## What Needs to Change (3 files)

1. **structure/SKILL.md** — Add QUALITY_CONTRACTS table to design output
2. **plan/SKILL.md** — Add canon constraint per work item with BAD/GOOD
3. **implementation/SKILL.md** — Step 2a reads plan constraint instead of full canon summary

No new scripts. No new files beyond this document. No new systems. Just better instructions in existing skills that leverage the enforcement mechanisms (compiler, construction check) that already exist.
