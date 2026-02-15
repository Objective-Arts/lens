---
name: run-tests
description: Running existing tests and reporting results when users say "run tests", "check tests", or "do tests pass". Does NOT write or fix tests — use /testing for that.
---

# /run-tests [path]

Run existing tests. Report results. That's it.

> **No arguments?** Describe this skill and stop. Do not execute.

## When NOT to Use

- Need to **write** tests: use `/testing`
- Need to **fix** failing tests: fix them yourself or use `/testing`

## Process

1. Run `npx vitest run` (or with path filter if argument provided)
2. Report results in the format below
3. If failures exist, show the first 3 failure summaries so the user can act

If a path argument is provided, pass it to vitest to scope the run:
```bash
npx vitest run [path]
```

If no argument, run the full suite:
```bash
npx vitest run
```

## Output Format

```markdown
## Test Results

PASSED: N
FAILED: N
TOTAL: N

FAILURES (if any):
- [test file]: [test name] — [error summary]

RUN_TESTS_COMPLETE
```

Only show the FAILURES section if there are failures. Cap at 5 failures — add "(and N more)" if truncated.
