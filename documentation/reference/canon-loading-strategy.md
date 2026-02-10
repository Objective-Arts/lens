---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Skill Loading Strategy

## 4-Layer Skill Loading

1. **Base Brain** - 10 foundational skills always loaded via SUMMARY.md (~4,200 tokens)
2. **Profile Skills** - Language/framework specific skills from profile
3. **Phase Skills** - Skills suited to current phase from `workflow-phases.yaml`
4. **Keyword Skills** - Dynamically detected from task text via `keyword-detection.yaml`

### The Base Brain (10 Skills)

Every workflow loads these 10 skills:

| # | Skill | Focus |
|---|-------|-------|
| 1 | clarity | No cleverness, obvious code |
| 2 | pragmatism | Get it working first |
| 3 | simplicity | Small interfaces, delete code |
| 4 | composition | Unix philosophy, pipelines |
| 5 | distributed | Failure handling |
| 6 | data-first | Data structures before algorithms |
| 7 | correctness | Formal discipline |
| 8 | algorithms | Algorithmic rigor |
| 9 | abstraction | Substitution principle |
| 10 | optimization | Measure before optimizing |

---

## Configuration Files

### workflow-phases.yaml

**Location**: `config/workflow-phases.yaml`

Defines the 9-phase Ralph workflow and skills for each phase.

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
  - create-plan
  - structure-first
  - implement-plan
  - refactor-check-fix
  - dedupe-fix
  - gemini-fix
  - adversarial-security-review
  - write-tests-run
  - ai-smell-fix
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

## Skill Selection

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

## The 9-Phase Workflow

| # | Phase | Description | Key Skills |
|---|-------|-------------|------------|
| 1 | create-plan | Understand requirements | clarity, simplicity, correctness, resilience, safety |
| 2 | structure-first | Design types and data structures | data-first, typescript, java, design-patterns |
| 3 | implement-plan | Write the code | pragmatism, clarity, simplicity, composition |
| 3.5 | **Machine Gate** | quality-gate + construction check | |
| 4 | refactor-check-fix | Simplify and clean | clarity, pragmatism, design-patterns |
| 5 | dedupe-fix | Remove duplication | composition, clarity, simplicity |
| 6 | gemini-fix | External code + product quality review | (Gemini MCP) |
| 6.5 | **Machine Gate** | Qodana scan; Haiku fixer if issues found | |
| 7 | adversarial-security-review | Attack your code | security-mindset, owasp, failure, safety |
| 8 | write-tests-run | Write and run tests | test-doubles, test-strategy |
| 9 | ai-smell-fix | Remove AI patterns | (antipattern detection) |
| 9.5 | **Machine Gate** | `npm test` + quality-gate (final) | |

---

## Tiered Skill Loading

| Approach | Tokens | When |
|----------|--------|------|
| Load Everything | 10,000-15,000 | Every task |
| Tiered Loading | 1,000-2,000 | Most tasks |
| Tiered + Full | 3,000-5,000 | Complex tasks |

**Savings: 60-80% reduction** using SUMMARY.md files (~300 tokens each) vs full SKILL.md files (~2000 tokens each).

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
