# Canon Loading Strategy

## Overview

Canon skills are loaded through a 4-layer system:

1. **Base Experts** - Core experts always loaded (kernighan, pike, etc.)
2. **Profile Experts** - Language/framework specific experts from profile
3. **Phase Experts** - Experts suited to current phase from `workflow-phases.yaml`
4. **Keyword Experts** - Dynamically detected from task text via `keyword-detection.yaml`

---

## Configuration Files

### workflow-phases.yaml

**Location**: `config/workflow-phases.yaml`

Defines the 8-phase Ralph workflow and experts for each phase.

```yaml
phases:
  plan:
    description: Understand requirements, design approach
    experts:
      - kernighan
      - pike
      - linus
      - dijkstra
      - taleb
      - petroski
      - leveson

  implement:
    description: Write the code
    experts:
      - thompson
      - kernighan
      - pike
      - mcilroy
      - bill-joy

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

Adds experts dynamically based on keywords in task text.

```yaml
rules:
  security:
    patterns:
      - auth
      - password
      - token
      - jwt
    experts:
      - schneier
      - owasp
      - security-mindset

  database:
    patterns:
      - sql
      - query
      - migration
    experts:
      - bloch
      - schneier
```

---

## How Experts Are Selected

```
Profile Experts    +    Phase Experts    +    Keyword Experts
───────────────         ──────────────        ────────────────
From profile.yaml       From phase config     From task text
  - cherny                - kernighan         Task: "Add JWT auth"
  - crockford             - pike              Matches: security
                          - thompson          Adds: schneier, owasp

                    = Final: cherny, crockford, kernighan, pike, thompson, schneier, owasp
```

---

## The 8-Phase Workflow

| Phase | Description | Key Experts |
|-------|-------------|-------------|
| plan | Understand requirements | kernighan, pike, dijkstra, taleb, leveson |
| structure-first | Design types and data structures | linus, cherny, bloch, gang-of-four |
| implement | Write the code | thompson, kernighan, pike, mcilroy |
| build-tests | Write tests | meszaros, fowler-test, dodds, hevery |
| refactor-check | Simplify and clean | kernighan, thompson, feathers |
| adversarial-review | Attack your code | schneier, owasp, petroski, leveson |
| static-analysis | Run analyzers | bloch, liskov, owasp |
| doc-code | Document the work | procida, strunk-white, zinsser |

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

## API Reference

### detectExperts

```typescript
function detectExperts(
  projectPath: string,
  phase: PhaseName,
  taskText: string,
  profileExperts: readonly string[]
): ExpertDetection
```

Main function for expert detection. Combines all 4 layers.

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
