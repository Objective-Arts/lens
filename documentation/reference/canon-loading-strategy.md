---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Skill Loading Strategy

## Overview

Skills are loaded through a 4-layer system:

1. **Base Skills** - Core skills always loaded (clarity, simplicity, etc.)
2. **Profile Skills** - Language/framework specific skills from profile
3. **Phase Skills** - Skills suited to current phase from `workflow-phases.yaml`
4. **Keyword Skills** - Dynamically detected from task text via `keyword-detection.yaml`

---

## Configuration Files

### workflow-phases.yaml

**Location**: `config/workflow-phases.yaml`

Defines the 8-phase Ralph workflow and skills for each phase.

```yaml
phases:
  plan:
    description: Understand requirements, design approach
    skills:
      - clarity
      - simplicity
      - data-first
      - correctness
      - resilience
      - failure
      - safety

  implement:
    description: Write the code
    skills:
      - pragmatism
      - clarity
      - simplicity
      - composition
      - distributed

ralph-sequence:
  - plan
  - structure-first
  - implement
  - build-tests
  - refactor-check
  - adversarial-review
  - static-analysis
  - doc-code
```

### keyword-detection.yaml

**Location**: `config/keyword-detection.yaml`

Adds skills dynamically based on keywords in task text.

```yaml
rules:
  security:
    patterns:
      - auth
      - password
      - token
      - jwt
    skills:
      - security-mindset
      - owasp

  database:
    patterns:
      - sql
      - query
      - migration
    skills:
      - java
      - security-mindset
```

---

## How Skills Are Selected

```
Profile Skills     +    Phase Skills       +    Keyword Skills
──────────────          ────────────           ────────────────
From profile.yaml       From phase config      From task text
  - typescript            - clarity            Task: "Add JWT auth"
  - js-safety             - simplicity         Matches: security
                          - pragmatism         Adds: security-mindset, owasp

                    = Final: typescript, js-safety, clarity, simplicity, pragmatism, security-mindset, owasp
```

---

## The 8-Phase Workflow

| Phase | Description | Key Skills |
|-------|-------------|------------|
| plan | Understand requirements | clarity, simplicity, correctness, resilience, safety |
| structure-first | Design types and data structures | data-first, typescript, java, design-patterns |
| implement | Write the code | pragmatism, clarity, simplicity, composition |
| build-tests | Write tests | test-doubles, test-strategy, react-test, legacy |
| refactor-check | Simplify and clean | clarity, pragmatism, legacy |
| adversarial-review | Attack your code | security-mindset, owasp, failure, safety |
| static-analysis | Run analyzers | java, abstraction, owasp |
| doc-code | Document the work | docs, brevity, prose |

---

## Tiered Skill Loading

Each skill has two files:

```
canon/java/
├── SKILL.md          # Full content (~2000 tokens)
└── SUMMARY.md        # Essential items (~300 tokens)
```

### Loading Protocol

**Phase 1: Load Summaries First** (~1,000-1,500 tokens)
- Summaries provide essential items and trigger conditions
- Always loaded for relevant skills

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

## API Reference

### detectSkills

```typescript
function detectSkills(
  projectPath: string,
  phase: PhaseName,
  taskText: string,
  profileSkills: readonly string[]
): SkillDetection
```

Main function for skill detection. Combines all 4 layers.

### loadPhaseConfig

```typescript
function loadPhaseConfig(projectPath: string): WorkflowPhasesConfig
```

Loads phase configuration from `workflow-phases.yaml`.

### loadKeywordRules

```typescript
function loadKeywordRules(projectPath: string): readonly CompiledKeywordRule[]
```

Loads keyword detection rules from `keyword-detection.yaml`.

---

## See Also

- [Profile Reference](profiles.md) - How profiles define static skills
- [How Skills Get Loaded](../explanation/how-skills-load.md) - Full explanation of loading layers
