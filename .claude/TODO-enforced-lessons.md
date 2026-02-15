# TODO: Enforced Lessons (DO NOT DELETE)

## Problem

Lessons in `lessons.md` are prompt-only — AI phases read them but nothing guarantees they follow them. The same mistakes recur across pipeline runs.

## Solution

Add an `enforced-lessons.json` data file that the quality-gate script reads at every machine gate. Each entry is a grep pattern that blocks the pipeline if matched.

### File: `.claude/enforced-lessons.json`

```json
[
  {
    "id": "no-execSync-templates",
    "pattern": "execSync\\s*\\(",
    "message": "Use execFileSync with args array instead of execSync",
    "severity": "CRITICAL"
  },
  {
    "id": "no-existsSync-readFileSync",
    "pattern": "existsSync\\(.+\\).*\\n.*readFileSync",
    "message": "Use try-catch around readFileSync directly instead of existsSync guard",
    "severity": "HIGH"
  }
]
```

### Changes needed

1. Create `enforced-lessons.json` with initial patterns extracted from existing lessons.md
2. Add a `checkEnforcedLessons()` function to `scripts/quality-gate.ts` that reads the JSON file and greps code for each pattern
3. Wire it into the existing gate runner so it runs at gates 3.5, 7.5, 9.5, 11.5
4. Update review phases (gemini-review, codex-review, security-review, evaluation) to append entries to this file when they write a lesson that has a grep-able antipattern

### What stays the same

- `lessons.md` files keep working as-is (prompt context for AI phases)
- `quality-gate.ts` existing hardcoded checks stay (they're battle-tested)
- Over time, hardcoded checks could migrate to the data file too

### Graduation path

Lesson written as prose → review phase also writes grep pattern → enforced automatically at next gate → no human action needed
