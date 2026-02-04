---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Structural Standards

Universal code quality rules that apply to ALL Claude-generated code. These are not framework-specific; they're structural principles that prevent the most common review findings.

---

## The Problem

Claude optimizes for "working code that satisfies the request" rather than "code that would survive expert review."

**Common issues identified by external reviewers (Gemini, Qodana):**
- Functions with multiple responsibilities
- Data processing mixed with rendering/presentation logic
- Inconsistent patterns within the same codebase
- Event handlers re-attached on every update
- Implicit side effects hidden in unexpected places

**Root cause:** No explicit quality bar was set, so Claude picked "good enough."

---

## Function Design Standards

### Single Responsibility

Every function does ONE thing.

```
WRONG                           RIGHT
─────                           ─────
getUsersAndSortAndRender()      getUsers()
                                sortUsers(users)
                                renderUsers(sortedUsers)
```

**Test**: Can you describe what the function does without using "and"?

### Maximum 30 Lines

Extract if longer. No exceptions.

```
WRONG: 147-line monolith         RIGHT: Pipeline of focused functions
─────────────────────            ─────────────────────────────────
function processData() {         function processData(raw) {
  // 147 lines doing               return pipe(
  // 8 different things              fetchData,
}                                    groupByCategory,
                                     calculateMetrics,
                                     sortByDate,
                                     render
                                   )(raw);
                                 }
```

### Names Describe What, Not How

```
WRONG                           RIGHT
─────                           ─────
loopThroughUsers()              getActiveUsers()
temp, x, data                   activeUsers, sortedPlacements
```

### Pure Functions Where Possible

Same input → same output. No side effects.

```
WRONG (impure)                  RIGHT (pure)
──────────────                  ─────────────
function calculate() {          function calculate(data) {
  const data = globalState;       return data.map(/*...*/);
  globalResult = /*...*/;       }
}
```

---

## Data Flow Standards

### Pipeline Pattern

All processing follows: **raw → transform → enrich → sort → present**

```
DATA PIPELINE (required pattern)
────────────────────────────────
1. Fetch/receive raw data
2. Group: groupRecordsBy*(data) → grouped
3. Enrich: calculate*(grouped) → enriched
4. Sort: sortBy*(enriched) → sorted
5. Render/Present: draw*(sorted) → output only

Each step:
- Takes input, returns output
- No side effects
- Testable in isolation
```

### Calculations in Prep, Not Presentation

```
WRONG                           RIGHT
─────                           ─────
items.map(item =>               // In data-prep:
  <div>{item.a * item.b}</div>  const enriched = items.map(item => ({
)                                 ...item,
                                  total: item.a * item.b
                                }));

                                // In render:
                                enriched.map(item =>
                                  <div>{item.total}</div>
                                )
```

### Render Functions Receive Complete Data

Render/view functions:
- Receive fully-prepared data
- Touch only output (DOM, templates, etc.)
- No calculations, grouping, or sorting inside
- Just bindings and element creation

---

## Consistency Standards

### One Pattern Per Concern

Pick one approach and use it everywhere. Never mix:

| Concern | Pick ONE |
|---------|----------|
| DOM updates | innerHTML OR data-join (not both) |
| Async | Promises OR async/await (not mixed) |
| State | Manual subscription OR reactive (not both) |
| Iteration | Array methods OR loops (prefer array methods) |

```
WRONG (mixed patterns)          RIGHT (consistent)
──────────────────              ────────────────────
someData.innerHTML = /*...*/    // All data-bound elements use data-join
otherData.join().enter()        d3.select(container)
thirdData.innerHTML = /*...*/     .selectAll('.item')
                                   .data(items)
                                   .join('div')
```

### Match Existing Codebase Patterns

If a pattern exists in the codebase, match it:
- Same naming conventions
- Same file organization
- Same error handling approach
- Same testing patterns

---

## Event Handling Standards

### Attach Once, Not Per Render

```
WRONG                           RIGHT
─────                           ─────
function render() {             function setupHandlers() {
  items.forEach(item => {         container.on('click', '.item', handleClick);
    item.onclick = handleClick;  }
  });
}                               function render() {
// Called every update!           // Just rendering, no handler attachment
                                }
```

### Delegate Where Possible

```
WRONG (individual handlers)     RIGHT (delegation)
───────────────────────         ────────────────────
items.forEach(item => {         container.addEventListener('click', e => {
  item.onclick = () => {          if (e.target.matches('.item')) {
    handleClick(item);              handleClick(e.target.dataset.id);
  };                              }
});                             });
```

### Clean Up on Destroy

If you add listeners, remove them:
- Component unmount
- Page navigation
- Resource cleanup

---

## Decomposition Triggers

Automatically decompose when you see:

| Smell | Action |
|-------|--------|
| Function doing multiple distinct steps | Split into pipeline |
| Nested loops with logic inside | Extract inner logic to function |
| Data transformation in view/render | Move to data-prep phase |
| Same calculation in multiple places | Extract to named function |
| Function >30 lines | Split by responsibility |
| "and" in function description | Two functions |

---

## Pre-Completion Checklist

Before presenting any code as complete, verify:

```markdown
### Structural Checklist

- [ ] No function exceeds 30 lines
- [ ] Data prep is separate from rendering/presentation
- [ ] Consistent patterns throughout (no mixing approaches)
- [ ] Event handlers attached once, not per-render
- [ ] Calculations happen in prep, not in view
- [ ] Pipeline pattern followed for data flow
- [ ] Names describe what, not how

### Review Gate

- [ ] Would survive hostile review without structural critique
- [ ] External tools (Gemini, Qodana) would not flag
```

**If any check fails, fix before presenting.**

---

## Anti-Patterns (Always Avoid)

| Anti-Pattern | Why It's Bad | Do This Instead |
|--------------|--------------|-----------------|
| 100+ line functions | Untestable, unmaintainable | Decompose to <30 line functions |
| Calculations in render | Repeated work, hard to test | Calculate in prep phase |
| Mixed DOM patterns | Confusing, bugs at boundaries | Pick one, use everywhere |
| Handlers in loops | Memory leaks, re-attachment | Attach once, delegate |
| Implicit globals | Hidden dependencies | Explicit parameters |
| "God" functions | Does everything | Single responsibility |

---

## The Principle

> **Structure is not optional polish—it's a prerequisite for maintainability.**
>
> Code that works but is poorly structured creates technical debt on every read.
> Every function should be obvious, isolated, and testable.
> The best code doesn't need comments because the structure explains intent.

---

## Integration

### With FLAGS.md

- `--structure-first` enforces planning per these standards
- `--review-hard` checks against these standards
- `--refactor-check` applies these standards to existing code

### With CLAUDE.md

Add to project CLAUDE.md:

```markdown
## Structural Standards

See claude-optimal/STRUCTURAL-STANDARDS.md (always active).

Project-specific additions:
- [Any framework-specific rules]
- [Any domain-specific rules]
```

### With Quality Gate Sequence

These standards are checked during:
1. Initial implementation
2. `code-reviewer` agent pass
3. Pre-commit hook (if configured)
