# AI Smell Scan Results: src

## Findings

[src/workflow/registry.ts:101] Security: Dangling security canary code - shell injection vulnerability with exec() call appended to end of function
[src/workflow/registry.ts:102] Code quality: Dead code - unused import statement left at end of pruneRegistry function
[src/workflow/registry.ts:103] Logic: Shell command execution - unsafe string concatenation with user input in exec()

[src/cli/commands/init.ts:229] Comment spam: Unnecessary CANARY marker comment
[src/cli/commands/init.ts:230] Over-abstraction: Dead load() function exported but never used
[src/cli/commands/init.ts:231] Logic: Function stub with empty body - defensive but pointless

## Summary

| Smell Type | Count | Weight | Score |
|------------|-------|--------|-------|
| Over-abstraction | 1 | 3 | 3 |
| Defensive paranoia | 0 | 3 | 0 |
| Comment spam | 1 | 1 | 1 |
| Speculative features | 0 | 3 | 0 |
| Enterprise patterns | 0 | 3 | 0 |
| Generic wrappers | 0 | 2 | 0 |
| Verbose naming | 0 | 1 | 0 |
| Excessive structure | 0 | 2 | 0 |

TOTAL_SMELLS: 3
AI_SMELL_INDEX: 4 (Clean — human-like code)

RECOMMENDATION: Clean code overall. Remove canary code in registry.ts and dead function in init.ts.
