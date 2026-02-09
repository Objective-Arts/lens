# /legacy Summary

> "Legacy code is code without tests. To put tests in place, we often have to change code."

## Essential Techniques

| Technique | Apply When | Pattern |
|-----------|------------|---------|
| **Characterization Test** | Before any change to legacy | Test what code *does*, not what it *should* do |
| **Object Seam** | Dependency blocks testing | Constructor injection for testability |
| **Sprout Method** | Adding new feature to legacy | New tested method, minimal legacy change |
| **Sprout Class** | New feature deserves isolation | New tested class called from legacy |
| **Wrap Method** | Adding behavior before/after | Rename original, wrap with new behavior |
| **Extract & Override** | Hard dependency (time, singletons) | Protected method overridden in test subclass |

## Load Full Skill When

- Implementing specific seam types (Link Seam, Preprocessing Seam)
- Using Mikado Method for large-scale refactoring
- Breaking complex dependency chains
- Need detailed code examples for parameterize constructor or instance delegator

## Quick Reference

```
SITUATION                          TECHNIQUE
──────────────────────────────────────────────────────
Don't know what code does        → Characterization test
Need to test untestable code     → Find/create seam
Adding new feature to legacy     → Sprout method/class
Adding behavior to existing      → Wrap method
Hard-coded dependency            → Parameterize constructor
Static method blocking tests     → Introduce instance delegator
Large legacy refactoring         → Mikado method
```

## The Rules

1. **Preserve behavior first** - Characterization tests capture current behavior before ANY change
2. **One thing at a time** - Each seam creation or refactoring is a single, safe step
3. **Seams enable testing** - Every seam has an enabling point for test doubles

## Code Review Checklist (Legacy)

- [ ] Characterization tests capture current behavior?
- [ ] Seams identified for testing?
- [ ] Using sprout for new code (not editing legacy)?
- [ ] Safe, mechanical refactorings only?

## HARD GATES (mandatory before modifying legacy code)

- [ ] **Characterization tests first:** Before changing ANY legacy code, write tests that capture the current behavior -- even if that behavior seems wrong. These are your safety net.
- [ ] **Seam identification:** List every dependency of the code you want to change. For each one, identify the seam (point where you can substitute a test double without modifying production code).
- [ ] **Minimal change:** Change the minimum amount of code to achieve the goal. Every additional "improvement" to legacy code is a risk. Save refactoring for a dedicated pass.
- [ ] **No big bang rewrites:** If you're tempted to rewrite a module from scratch, don't. Extract, test, replace one piece at a time.

## Concrete Checks (MUST ANSWER)

1. **Did you write characterization tests BEFORE changing any legacy code?** List each characterization test. Does each test assert what the code actually does right now (not what you think it should do)? If you changed code before writing these tests, stop and write them first.
2. **List every dependency of the code you are modifying. For each: where is the seam?** A seam is a point where you can substitute behavior without editing production code (constructor injection, method override, module import). If you cannot identify the seam, you cannot test the change safely.
3. **Are you using Sprout Method/Class for new behavior?** New functionality should go in a new, tested method or class that the legacy code calls -- not edited into the middle of untested legacy code. Check: is your new code in its own method with its own tests?
4. **Is every refactoring step mechanical and safe?** List each refactoring move (extract method, rename, move). Can each be done with automated IDE refactoring? If any step requires manual reasoning about correctness, it is too large -- break it down further.
5. **Have you resisted the urge to "fix" other things?** List every change you made. Does each one serve the original goal? If any change is an unrelated improvement ("while I'm here..."), revert it. Unrelated changes to legacy code without characterization tests are how bugs are born.
