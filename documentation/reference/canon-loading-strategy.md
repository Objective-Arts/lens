# Canon Loading Strategy

## The Problem

Canon-Driven Development requires loading expert knowledge before writing code. But loading full canon files creates significant token costs:

| Canon Skill | Full Size | If All Loaded |
|-------------|-----------|---------------|
| /bloch | ~2,000 tokens | |
| /evans | ~1,500 tokens | |
| /gang-of-four | ~2,500 tokens | |
| /feathers | ~1,800 tokens | |
| /fowler | ~2,000 tokens | |
| **Total per workflow** | | **8,000-15,000 tokens** |

Loading 10,000+ tokens of canon before writing code is wasteful when only 10-20% of items apply to any given task.

## The Solution: Tiered Canon Loading

Each canon skill has two files:

```
.claude/skills/bloch/
├── SKILL.md          # Full content (~2000 tokens)
└── SUMMARY.md        # Essential items (~300 tokens)
```

### SUMMARY.md Format

```markdown
# /[canon] Summary

> [One-line philosophy]

## Essential Items (Always Apply)
| # | Item | When |
|---|------|------|
| 1 | [Name] | [Trigger condition] |
| 2 | [Name] | [Trigger condition] |
...(5-10 items max)

## Load Full Skill When
- [Specific situation requiring full content]
- [Specific situation requiring full content]

## Quick Reference
[Condensed decision tree or table]
```

### Loading Protocol

**Phase 1: Load Summaries (~1,000-1,500 tokens total)**
```
Required reads:
1. Read: CLAUDE.md (Baseline Brain section)
2. Read: .claude/skills/[language]/SUMMARY.md
3. Read: .claude/skills/gang-of-four/SUMMARY.md
4. Read: .claude/skills/evans/SUMMARY.md (if domain modeling)
```

**Phase 2: Load Full When Triggered**
```
If applying Item 17 (immutability) in depth:
  Read: .claude/skills/bloch/SKILL.md

If implementing Strategy or State pattern:
  Read: .claude/skills/gang-of-four/SKILL.md
```

## Token Cost Comparison

| Approach | Tokens Loaded | When |
|----------|---------------|------|
| **Load Everything** | 10,000-15,000 | Every task |
| **Tiered Loading** | 1,000-2,000 | Most tasks |
| **Tiered + Full** | 3,000-5,000 | Complex tasks needing specific items |

**Savings: 60-80% reduction in canon loading tokens**

## Implemented SUMMARY.md Files

| Canon Skill | SUMMARY.md Location | Full SKILL.md |
|-------------|---------------------|---------------|
| Gang of Four | `canon/gang-of-four/SUMMARY.md` | `canon/gang-of-four/SKILL.md` |
| Bloch | `canon/bloch/SUMMARY.md` | `canon/bloch/SKILL.md` |
| Linus | `canon/linus/SUMMARY.md` | `canon/linus/SKILL.md` |
| Feathers | `canon/testing/feathers/SUMMARY.md` | `canon/testing/feathers/SKILL.md` |
| Meszaros | `canon/testing/meszaros/SUMMARY.md` | `canon/testing/meszaros/SKILL.md` |
| Fowler (Testing) | `canon/testing/fowler-test/SUMMARY.md` | `canon/testing/fowler-test/SKILL.md` |
| Cherny (TypeScript) | `canon/javascript/cherny/SUMMARY.md` | `canon/javascript/cherny/SKILL.md` |
| Dodds | `canon/javascript/dodds/SUMMARY.md` | `canon/javascript/dodds/SKILL.md` |

## Summary File Requirements

Each SUMMARY.md must include:

1. **Philosophy** - One sentence capturing the expert's core insight
2. **Essential Items** - 5-10 most commonly applied items with trigger conditions
3. **Load Full When** - Specific situations requiring the complete skill
4. **Quick Reference** - Decision tree, table, or checklist for fast lookup

## Implementation in Workflow Skills

Updated loading instructions:

```markdown
### Step 1.2: Load Canon (Tiered)

**Load summaries first:**
1. Read: .claude/skills/gang-of-four/SUMMARY.md
2. Read: .claude/skills/[language]/SUMMARY.md

**Load full skill only when:**
- Applying a specific item not in summary
- Deep dive into a particular pattern
- User explicitly requests full canon
```

## Creating New Summaries

When adding a new canon skill, create both files:

1. **SKILL.md** - Complete expert knowledge (no size limit)
2. **SUMMARY.md** - Condensed version following this template:

```markdown
# /[name] Summary

> "[Core philosophy in one sentence]" — [Expert Name]

## Essential Items

| # | Item | Apply When |
|---|------|------------|
| | | |

## Load Full Skill When
-
-

## Quick Reference

[Table or decision tree]
```

## Quality Gate

Summaries must be:
- **< 400 tokens** - Enforced limit
- **Self-contained** - Usable without full skill for common cases
- **Trigger-based** - Clear conditions for when to load full skill

## Rationale

This design balances two competing needs:

1. **Quality**: Canon expertise must be loaded and applied
2. **Efficiency**: Token costs must be reasonable

Tiered loading ensures:
- Canon is ALWAYS consulted (summaries loaded)
- Deep expertise is available when needed (full skills on demand)
- Token costs scale with task complexity, not fixed overhead
