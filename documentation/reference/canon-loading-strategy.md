# Canon Loading Strategy

## Overview

Canon skills are loaded through two mechanisms:

1. **Profile Configuration** - Static skills assigned per Ralph stage
2. **Dynamic Detection** - Skills added based on task keywords via `skill-rules.yaml`

---

## Configuration File

**Location**: `canon/skill-rules.yaml`

This single file configures skill detection for both:
- **Ralph stages** (plan, build, refactor, test, review, doc)
- **Workflow commands** (/implement, /plan, /review-hard, etc.)

### Structure

```yaml
# Core canons for each workflow command
workflow-defaults:
  plan:
    always: [kernighan, pike, linus]
    phases:
      design: [cherny, dijkstra]

  implement:
    always: [kernighan]
    phases:
      plan: [pike, linus]
      build: [thompson, bill-joy]
      review: [schneier, owasp]

# Keyword-based skill detection
rules:
  security:
    patterns: [auth, password, jwt, token]
    skills: [schneier, owasp, security-mindset]
    stages: [plan, build, review]      # Ralph stages
    workflows: [implement, review-hard] # Workflow commands
```

---

## How Skills Are Selected

### For Ralph Stages

```
Profile Skills (static)     +     Detected Skills (dynamic)
─────────────────────────         ──────────────────────────
ralph.skills.build:               Task: "Add JWT auth"
  - cherny                        Matches: security rule
  - crockford                     Adds: schneier, owasp

                                  = Final: cherny, crockford, schneier, owasp
```

### For Workflow Commands

```
Workflow Defaults           +     Detected Skills (dynamic)
─────────────────────────         ──────────────────────────
workflow-defaults.plan:           Task: "Design auth API"
  always: [kernighan, pike]       Matches: security, api rules
                                  Adds: schneier, bloch

                                  = Final: kernighan, pike, schneier, bloch
```

---

## Tiered Canon Loading

Each canon skill has two files:

```
canon/bloch/
├── SKILL.md          # Full content (~2000 tokens)
└── SUMMARY.md        # Essential items (~300 tokens)
```

### Loading Protocol

**Phase 1: Load Summaries First** (~1,000-1,500 tokens)
- Summaries provide essential items and trigger conditions
- Always loaded for relevant canons

**Phase 2: Load Full When Needed**
- When applying specific item not in summary
- When deep dive into pattern required
- When user explicitly requests

### Token Cost Comparison

| Approach | Tokens | When |
|----------|--------|------|
| Load Everything | 10,000-15,000 | Every task |
| Tiered Loading | 1,000-2,000 | Most tasks |
| Tiered + Full | 3,000-5,000 | Complex tasks |

**Savings: 60-80% reduction**

---

## SUMMARY.md Format

```markdown
# /[canon] Summary

> [One-line philosophy]

## Essential Items (Always Apply)
| # | Item | When |
|---|------|------|
| 1 | [Name] | [Trigger condition] |

## Load Full Skill When
- [Specific situation]

## Quick Reference
[Decision tree or table]
```

### Requirements

- **< 400 tokens** - Enforced limit
- **Self-contained** - Usable without full skill
- **Trigger-based** - Clear conditions for full load

---

## Implemented SUMMARY.md Files

| Canon | Location |
|-------|----------|
| Gang of Four | `canon/gang-of-four/SUMMARY.md` |
| Bloch | `canon/bloch/SUMMARY.md` |
| Linus | `canon/linus/SUMMARY.md` |
| Feathers | `canon/testing/feathers/SUMMARY.md` |
| Meszaros | `canon/testing/meszaros/SUMMARY.md` |
| Fowler (Testing) | `canon/testing/fowler-test/SUMMARY.md` |
| Cherny | `canon/javascript/cherny/SUMMARY.md` |
| Dodds | `canon/javascript/dodds/SUMMARY.md` |

---

## API Reference

### loadSkillRules

```typescript
function loadSkillRules(projectPath: string): readonly SkillRule[]
```

Loads detection rules from `canon/skill-rules.yaml`.

### getWorkflowSkills

```typescript
function getWorkflowSkills(
  projectPath: string,
  workflow: WorkflowName,
  taskText: string,
  phase?: string
): readonly string[]
```

Gets all skills for a workflow command (defaults + detected).

### getWorkflowConfig

```typescript
function getWorkflowConfig(
  projectPath: string,
  workflow: WorkflowName
): WorkflowConfig
```

Gets workflow defaults configuration.

---

## Detection Rule Fields

| Field | Type | Description |
|-------|------|-------------|
| `patterns` | `string[]` | Keywords to match (case-insensitive) |
| `skills` | `string[]` | Canon skills to add when matched |
| `stages` | `string[]` | Ralph stages where rule applies |
| `workflows` | `string[]` | Workflow commands where rule applies |

### Valid Stages

`plan`, `build`, `refactor`, `test`, `review`, `doc`

### Valid Workflows

`implement`, `plan`, `review-hard`, `structure-first`, `build-from-plan`, `refactor-clean`, `test`

---

## See Also

- [Profile Reference](profiles.md) - How profiles define static skills
- [Canon Configuration Docs](../../docs/canon-config/) - Full Diátaxis documentation
