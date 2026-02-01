---
name: implement
description: Enforced workflow with mandatory verification. Session log and command output prove the framework was executed.
---

# /implement [feature-name]

Execute the full canon workflow with **mandatory checkpoints and verification**. The session log AND command outputs prove you actually ran the framework.

## First: Activate Workflow

**Before any other action**, activate this workflow session:

```bash
mkdir -p .claude && echo '{"skill":"implement","started":"'$(date -Iseconds)'","feature":"[FEATURE_NAME]"}' > .claude/active-workflow.json
```

## Arguments

| Argument | Description |
|----------|-------------|
| `feature-name` | Name of the feature (used for session log and artifacts) |
| `--prd PATH` | Path to PRD file (default: `PRD.md` or `.claude/prd.md`) |
| `--resume` | Resume from last checkpoint |

## Mandatory Sequence (Cannot Skip)

| Step | Skill | What Gets Logged |
|------|-------|------------------|
| 1 | `/plan` | Plan file created |
| 2 | `/structure-first` | Types/interfaces defined |
| 3 | `/test` (write tests) | Test files created |
| 4 | TDD Red | All tests fail (count) |
| 5 | `/build-from-plan` | Implementation code |
| 6 | TDD Green | Tests pass (count) |
| 7 | `/review-hard` | Issues by severity |
| 8 | Static Analysis | Qodana/ESLint results |
| 9 | Fix & Iterate | Fixes applied |
| 10 | Final Validation | All tests pass |

## Session Log

A `session-log.json` file is created in `.claude/` and updated at each checkpoint:

```json
{
  "meta": {
    "feature": "feature-name",
    "started": "2024-01-15T10:30:00Z",
    "status": "in_progress"
  },
  "checkpoints": [],
  "testing": {
    "red": { "passed": 0, "failed": 0 },
    "green": { "passed": 0, "failed": 0 }
  },
  "reviews": {},
  "issues": []
}
```

---

## VERIFICATION (MANDATORY - DO NOT SKIP)

**You MUST execute these commands and show output before claiming completion.**

### Step 1: Verify Session Log Exists

```bash
# Session log must exist and have checkpoints
cat .claude/session-log.json | head -50
```

### Step 2: Verify Artifacts Created

```bash
# Plan file must exist
ls -la .claude/plans/*.md

# Test files must exist
find . -name "*.test.*" -o -name "*.spec.*" | head -20

# Count test files
find . -name "*.test.*" -o -name "*.spec.*" | wc -l
```

### Step 3: Verify Tests Were Run

```bash
# Test output must show actual execution
# (show actual test runner output from TDD red AND green phases)
```

### Step 4: Verify Review Was Performed

```bash
# Session log must contain review findings
grep -A 20 '"reviews"' .claude/session-log.json
```

### Completion Criteria (ALL must be TRUE)

| Criterion | Evidence Required | Pass? |
|-----------|-------------------|-------|
| Session log exists | `cat .claude/session-log.json` shows data | [ ] |
| Plan file created | `ls .claude/plans/*.md` shows file | [ ] |
| Test files created | `find` shows test files | [ ] |
| TDD Red executed | Test runner shows failures | [ ] |
| TDD Green executed | Test runner shows passes | [ ] |
| Review performed | Session log has review findings | [ ] |
| All tests pass | Final test run shows 0 failures | [ ] |

**If ANY criterion fails: continue implementation. Do not report complete.**

---

## Output Format

```markdown
## Implementation: [feature-name]

### Checkpoints Completed

| Step | Status | Evidence |
|------|--------|----------|
| Plan | ✓ | .claude/plans/feature.md |
| Structure | ✓ | src/types/feature.ts |
| Tests Written | ✓ | 12 test files |
| TDD Red | ✓ | 45 tests failed |
| Implementation | ✓ | src/feature/*.ts |
| TDD Green | ✓ | 45 tests passed |
| Review | ✓ | 3 issues found, fixed |
| Final | ✓ | All tests pass |

### Verification Results

```bash
$ cat .claude/session-log.json | head -20
{"meta":{"feature":"feature-name"...}
...

$ find . -name "*.test.*" | wc -l
12

$ npm test
45 passed, 0 failed
```

### Session Log Location
`.claude/session-log.json`

IMPLEMENT_VERIFIED
```

**The marker `IMPLEMENT_VERIFIED` may ONLY appear if all criteria pass.**

---

## Anti-Patterns (Immediate Failure)

- Claiming completion without showing session-log.json contents
- Skipping TDD red phase (tests must fail first)
- Reporting "tests pass" without showing test runner output
- Empty or missing session log checkpoints
- No plan file in .claude/plans/
- Review section empty in session log
