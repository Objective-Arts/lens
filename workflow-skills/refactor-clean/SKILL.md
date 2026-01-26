---
name: refactor-clean
description: Modernize and refactor EXISTING CODE. Use after /plan and /structure-first in the Legacy Code Flow.
---

# /refactor-clean [target]

**LEGACY CODE FLOW ONLY** - Systematically refactor and modernize existing code.

For building new features, use `/build-from-plan` instead.

---

## ⚠️ ENFORCED PROCESS - THREE PHASES

You CANNOT skip phases. Each phase must complete before making any code changes.

---

## PHASE 1: LOAD CANON FOR LEGACY CODE (Required - No Changes Until Complete)

### Step 1.1: Load the Plan and Structure Files

**You MUST use the Read tool. Do not proceed from memory.**

```
Required reads:
1. Read: .claude/plans/[refactoring-plan].md (the approved plan)
2. Read: .claude/structures/[existing-analysis].md (from /structure-first)
3. Read: CLAUDE.md (Baseline Brain section)
```

### Step 1.2: Load Legacy Code Canon

**You MUST use the Read tool. Legacy code requires specific canon.**

```
Required for ALL legacy refactoring:
1. Read: .claude/skills/feathers/SKILL.md (finding seams, characterization tests)
2. Read: .claude/skills/fowler/SKILL.md (refactoring patterns)
```

Also load based on concern:
- SRP violations → Read: .claude/skills/liskov/SKILL.md
- API cleanup → Read: .claude/skills/bloch/SKILL.md
- Patterns → Read: .claude/skills/gang-of-four/SKILL.md
- Language-specific → Read appropriate language canon

### Step 1.3: Output Proof of Loading

**You MUST output this section before making ANY changes:**

```markdown
## Phase 1: Legacy Canon Loaded

### Plan Loaded
- **Plan file**: [path]
- **Target**: [what we're refactoring]
- **Goal**: [end state]

### Structure Analysis Loaded
- **Structure file**: [path]
- **Current state**: [summary of existing code]
- **Hidden domain objects found**: [if any]

### Baseline Brain Active
| Master | How It Applies to This Refactoring |
|--------|-----------------------------------|
| Kernighan | Will improve naming throughout |
| Thompson | Won't over-engineer, keep changes focused |
| Pike | Will reduce coupling, simplify interfaces |
| Joy | Will add error handling where missing |
| Linus | Will improve data structures to eliminate conditionals |
| Dijkstra | Will make invariants explicit |

### Legacy Canon Loaded (Feathers + Fowler)

**From /feathers (Working Effectively with Legacy Code):**
| Technique | How I'll Apply It |
|-----------|-------------------|
| Seams | [where I identified safe change points] |
| Characterization tests | [what existing behavior to capture first] |
| Sprout method/class | [where I'll add new code without changing old] |
| Wrap method | [where I'll wrap existing behavior] |

**From /fowler (Refactoring Catalog):**
| Smell Identified | Refactoring to Apply |
|------------------|---------------------|
| [Long Method] | Extract Method |
| [Feature Envy] | Move Method |
| [God Class] | Extract Class |

### Refactoring Approach
Before changing ANY code:
1. [First: Write characterization test for existing behavior]
2. [Second: Identify seam for safe change]
3. [Third: Apply specific refactoring]
4. [Fourth: Verify behavior preserved]
```

**If this section is empty or generic, STOP. You have not loaded canon.**

---

## PHASE 2: REFACTOR WITH CANON (Required - Cite As You Go)

### Step 2.1: Characterization Tests First (Feathers)

**Before changing any code, capture existing behavior:**

```markdown
### Characterization Test: [target]

**What the code currently does** (not what it should do):
```[language]
// Feathers: "A characterization test documents actual behavior"
test('existing behavior', () => {
  // Capture what the code DOES, not what we WANT
  expect(legacyMethod(input)).toBe(actualCurrentOutput);
});
```

**Existing behaviors captured:**
- [ ] Happy path behavior
- [ ] Edge case behaviors
- [ ] Error behaviors (even if wrong)
```

### Step 2.2: Find Seams (Feathers)

```markdown
### Seam Analysis

**Seams found** (safe change points):
| Seam Location | Seam Type | Why Safe |
|---------------|-----------|----------|
| Constructor injection | Object seam | Can substitute dependency |
| Interface boundary | Link seam | Can swap implementation |
| Virtual method | Object seam | Can override in test |

**Change strategy:**
Using [seam type] at [location] to [what change]
```

### Step 2.3: Apply Refactorings (Fowler)

For EACH refactoring:

```markdown
### Refactoring: [Name from Fowler's catalog]

**Smell**: [What triggered this refactoring]
**Pattern**: [Fowler's refactoring name]

**Before** (captured in characterization test):
```[language]
[original code]
```

**After** (same behavior, better structure):
```[language]
// [Canon citation]: Why this change
[refactored code]
```

**Verification:**
- [ ] Characterization tests still pass
- [ ] Behavior unchanged
- [ ] Structure improved per [canon]
```

### Step 2.4: Track Canon Application

Maintain a running log:

```markdown
## Canon Application Log

| Location | Canon | Technique | Change Made |
|----------|-------|-----------|-------------|
| UserService.cs:45 | Feathers | Extract Method | Split 150-line method |
| UserService.cs:78 | Fowler | Move Method | Moved to proper class |
| UserService.cs:90 | Liskov | SRP | Single responsibility now |
| UserController.cs:23 | Kernighan | Rename | `DoStuff` → `ValidateUserInput` |
```

---

## PHASE 3: COMPLETION REPORT (Required)

### Step 3.1: Before/After Summary

```markdown
## Refactoring Complete

**Target**: [what was refactored]

### Before
```
[OriginalClass] (X lines, Y responsibilities)
├── [responsibility 1]
├── [responsibility 2]
├── [responsibility 3]
└── [responsibility N]
```

### After
```
[Class1] (X lines) → [single responsibility]
[Class2] (Y lines) → [single responsibility]
[Class3] (Z lines) → [single responsibility]
```

### Canon Applied
| Canon | Times Applied | Key Changes |
|-------|---------------|-------------|
| /feathers | X | Seams at [locations], characterization tests |
| /fowler | Y | [specific refactorings applied] |
| /liskov | Z | SRP violations fixed at [locations] |
| Baseline/Kernighan | W | Renamed [count] methods/variables |

### Verification
- [ ] All characterization tests pass
- [ ] No behavior changes (existing tests pass)
- [ ] Each class has single responsibility
- [ ] No method exceeds 30 lines
- [ ] Seams documented for future changes

### Files Changed
| File | Lines Before | Lines After | Change |
|------|--------------|-------------|--------|
| UserService.cs | 450 | 120 | Extracted 3 classes |
| UserValidator.cs | 0 | 85 | New (extracted) |

### Next Steps
- Run `/test` to add coverage for new seams
- Run `/review-hard` before PR
```

---

## The Feathers Discipline

**Working with legacy code is different from greenfield:**

| Greenfield (build-from-plan) | Legacy (refactor-clean) |
|------------------------------|-------------------------|
| Design then code | Understand then change |
| Write tests first | Write characterization tests first |
| Free to choose structure | Must find seams |
| Canon guides design | Canon guides safe changes |

**Feathers' key insight**: "Legacy code is code without tests. The first step is always to get the code into a test harness."

---

## Anti-Patterns (Violations of This Process)

| If You Do This | You Violated |
|----------------|--------------|
| Change code before characterization tests | Feathers core principle |
| Refactor without identifying seams | Feathers |
| Make changes without citing Fowler pattern | Phase 2 |
| Skip before/after comparison | Phase 3 |
| Claim "behavior preserved" without tests proving it | Verification requirement |
| Change behavior while refactoring | Refactoring definition |

---

## Workflow Position

```
LEGACY CODE FLOW:
Existing Code → /plan → /structure-first → /refactor-clean → /test → /review-hard
                                                 ↑
                                             YOU ARE HERE
```

`/refactor-clean` is safe transformation with enforced Feathers/Fowler discipline.
