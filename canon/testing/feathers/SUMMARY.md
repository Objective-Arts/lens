# /feathers Summary

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
