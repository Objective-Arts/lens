# Angular Experiment Scorecard (Experiment 8)

**Run ID:** ________________ (blind)
**Evaluator:** ________________
**Date:** ________________

---

## Modern Angular Patterns (Hevery) - 40 points

| Criterion | Pts | Score | Evidence |
|-----------|-----|-------|----------|
| Standalone components (no NgModule) | 10 | | |
| Signals for state (`signal()`, `computed()`) | 15 | | |
| Modern injection with `inject()` | 10 | | |
| OnPush change detection | 5 | | |
| **Subtotal** | 40 | | |

**grep results:**
- `standalone: true` count: ____
- `signal(` count: ____
- `inject(` count: ____
- `ChangeDetectionStrategy.OnPush` count: ____

---

## Component Architecture (Papa) - 30 points

| Criterion | Pts | Score | Evidence |
|-----------|-----|-------|----------|
| Smart/dumb component separation | 15 | | |
| Single responsibility per component | 10 | | |
| Clear input/output contracts | 5 | | |
| **Subtotal** | 30 | | |

**Component analysis:**

| Component | Type (Smart/Dumb) | Responsibility |
|-----------|-------------------|----------------|
| | | |
| | | |
| | | |
| | | |

---

## Reactive Patterns (Kurata) - 20 points

| Criterion | Pts | Score | Evidence |
|-----------|-----|-------|----------|
| Async pipe usage (not manual subscribe) | 10 | | |
| Proper cleanup (takeUntilDestroyed) | 5 | | |
| No subscribe() in components | 5 | | |
| **Subtotal** | 20 | | |

**grep results:**
- `| async` count: ____
- `takeUntilDestroyed` count: ____
- `.subscribe(` in components: ____ (lower is better)

---

## General Quality - 10 points

| Criterion | Pts | Score | Evidence |
|-----------|-----|-------|----------|
| Error handling in service | 3 | | |
| Loading states | 3 | | |
| TypeScript strictness (no `any`) | 4 | | |
| **Subtotal** | 10 | | |

---

## TOTAL SCORE: _____ / 100

---

## Code Inventory

| Metric | Count |
|--------|-------|
| Total .ts files | |
| Component files | |
| Service files | |
| Model/interface files | |
| Lines of code (approx) | |

---

## Qualitative Notes

**Best aspect of this code:**

_________________________________

**Worst aspect of this code:**

_________________________________

**Angular version indicators:**
- [ ] Uses signals (17+)
- [ ] Uses standalone (15+)
- [ ] Uses NgModule (older style)

---

## Post-Reveal

**Condition:** [ ] Canon [ ] Vanilla

**Did output use modern Angular 17+ patterns?** [ ] Yes [ ] Partially [ ] No
