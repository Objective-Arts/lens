---
name: build-from-plan
description: Implement NEW CODE from an approved plan. Use after /plan and /structure-first in the New Code Flow.
---

# /build-from-plan [plan-file]

**NEW CODE FLOW ONLY** - Implement new features from an approved plan file.

For legacy code modernization, use `/refactor-check` instead.

---

## ⚠️ ENFORCED PROCESS - THREE PHASES

You CANNOT skip phases. Each phase must complete before writing implementation code.

---

## PHASE 1: LOAD REQUIREMENTS (Required - No Code Until Complete)

### Step 1.1: Load the Plan and Structure Files

**You MUST use the Read tool. Do not proceed from memory.**

```
Required reads:
1. Read: .claude/plans/[plan-file].md (the approved plan)
2. Read: .claude/structures/[feature].md (from /structure-first)
3. Read: CLAUDE.md (Baseline Brain section)
```

### Step 1.2: Load Canon Skills (Tiered Loading)

**You MUST use the Read tool to load canon. Do not proceed from memory.**

**First: Load SUMMARY.md files (~300 tokens each):**
```
Required summary reads for ALL new code:
1. Read: canon/gang-of-four/SUMMARY.md (design patterns)
2. Read: canon/[language]/SUMMARY.md (see below)
```

Detect language from project and load appropriate summary:
- `.java` → Read: canon/bloch/SUMMARY.md
- `.ts`, `.tsx` → Read: canon/javascript/cherny/SUMMARY.md
- `.py` → Read: canon/python/ramalho/SUMMARY.md
- `.go` → Read: canon/pike/SUMMARY.md
- `.cs` → Read: canon/csharp/skeet/SUMMARY.md

Also load based on concern:
- Security code → Read: canon/security/schneier/SUMMARY.md (or SKILL.md if no summary)
- Tests → Read: canon/javascript/dodds/SUMMARY.md, canon/testing/meszaros/SUMMARY.md

**Then: Load full SKILL.md only when triggered:**
- Implementing a specific pattern in depth
- Applying items not covered in summary
- User explicitly requests full canon

### Step 1.3: Output Proof of Loading

**You MUST output this section before writing ANY code:**

```markdown
## Phase 1: Canon Loaded

### Plan Loaded
- **Plan file**: [path]
- **Status**: Approved on [date] / Approved (no date)
- **Steps**: [N steps to implement]

### Structure Loaded
- **Structure file**: [path]
- **Types defined**: [list core types]

### Baseline Brain Active
| Master | Principle I Will Apply |
|--------|----------------------|
| Kernighan | [specific application to this task] |
| Thompson | [specific application to this task] |
| Pike | [specific application to this task] |
| Joy | [specific application to this task] |
| Linus | [specific application to this task] |
| Dijkstra | [specific application to this task] |

### Domain Canon Loaded
| Canon | Items Loaded | Key Principle for This Task |
|-------|--------------|---------------------------|
| /gang-of-four | 23 patterns | [which patterns apply to this feature] |
| /bloch | 90 items | [which items apply] |
| /schneier | [X items] | [which items apply] |

### Design Patterns Identified (Gang of Four)
| Pattern | Where to Apply | Why |
|---------|----------------|-----|
| [Factory Method/Builder/etc.] | [component] | [reason] |
| [Strategy/Observer/etc.] | [component] | [reason] |

### Implementation Approach
Before writing code, I will:
1. [First principle to apply, citing canon]
2. [Second principle to apply, citing canon]
3. [How I'll verify quality as I go]
```

**If this section is empty or generic, STOP. You have not loaded canon.**

---

## PHASE 2: IMPLEMENT WITH CANON (Required - Cite As You Go)

### Step 2.1: Implement Each Plan Step

For EACH step in the plan:

```markdown
### Implementing: [Step Name]

**Canon guiding this step:**
- [Canon]: [Specific principle]

**Code:**
```[language]
// [Canon citation]: Why this approach
[actual code]
```

**Verification:**
- [ ] Kernighan: Method names are self-documenting
- [ ] Linus: Data structure eliminates special cases
- [ ] Joy: Failure paths handled
- [ ] Dijkstra: Invariants maintained
```

### Step 2.2: Track Canon Application

Maintain a running log:

```markdown
## Canon Application Log

| Location | Canon Applied | Principle | Specific Change |
|----------|---------------|-----------|-----------------|
| PaymentService.cs:45 | Bloch Item 1 | Static factory | Used `Payment.create()` |
| PaymentService.cs:67 | Joy | Failure handling | Added circuit breaker |
| PaymentClient.cs:23 | Dijkstra | Invariants | Amount validated > 0 |
```

### Step 2.3: Do NOT Skip Quality

For each file you write:

**Before moving to next file, verify:**
- [ ] Every method name passes Kernighan's clarity test
- [ ] Data structures match the approved structure file
- [ ] All external calls have error handling (Joy)
- [ ] No illegal states are representable (Dijkstra)
- [ ] Language canon was applied (Bloch/Cherny/etc.)

**If ANY check fails, fix before proceeding.**

---

## PHASE 3: COMPLETION REPORT (Required)

### Step 3.1: Summary with Evidence

```markdown
## Build Complete

**Plan**: [plan name]
**Steps Completed**: X/Y

### Files Created/Modified
| File | Canon Applied | Key Decisions |
|------|---------------|---------------|
| src/Payment.ts | Bloch Item 1, 17 | Static factory, immutable |
| src/PaymentClient.ts | Joy, Schneier | Circuit breaker, input validation |

### Canon Application Summary
| Canon | Times Applied | Examples |
|-------|---------------|----------|
| /gang-of-four | X | [patterns: Factory at X, Strategy at Y] |
| /bloch | 12 | Items 1, 2, 17, 50 at [locations] |
| Baseline/Joy | 4 | Error handling at [locations] |
| Baseline/Dijkstra | 3 | Invariants at [locations] |

### Verification Checklist
- [ ] All method names self-documenting (Kernighan)
- [ ] No scattered null checks - types prevent them (Linus)
- [ ] All external calls have timeout/retry/fallback (Joy)
- [ ] No float/double for money (Dijkstra)
- [ ] Language idioms followed ([language canon])

### Next Steps
- Run `/test` to add test coverage
- Run `/review-hard` before PR
```

---

## 🛑 MANDATORY STOP

**After outputting the build completion report above, you MUST STOP.**

- DO NOT proceed to `/test`
- DO NOT proceed to `/review-hard`
- DO NOT write any test files
- DO NOT continue with "let me also..." or "I'll go ahead and..."

**Your turn ends here.** Output the completion report and STOP. Wait for the user to explicitly type the next command.

The user will type `/test` when ready. Until then, do nothing.

---

## What "Canon Loaded" Actually Means

Loading canon is NOT:
- ❌ Saying "I know about Bloch"
- ❌ Vaguely mentioning principles
- ❌ Proceeding from memory

Loading canon IS:
- ✅ Using Read tool to load the actual skill file
- ✅ Citing specific items/principles that apply
- ✅ Showing HOW they shape implementation decisions
- ✅ Logging where they were applied in code

---

## Anti-Patterns (Violations of This Process)

| If You Do This | You Violated |
|----------------|--------------|
| Start writing code before Phase 1 complete | Entire skill |
| Skip loading the plan file | Step 1.1 |
| Don't cite canon in implementation | Phase 2 |
| Generic principles without specific application | Enforcement requirement |
| No Canon Application Log in output | Step 2.2 |
| Skip verification checklist | Step 2.3 |

---

## Workflow Position

```
NEW CODE FLOW:
PRD → /plan → /structure-first → /build-from-plan → /test → /review-hard
                                       ↑
                                   YOU ARE HERE
```

`/build-from-plan` is implementation with enforced canon application.
