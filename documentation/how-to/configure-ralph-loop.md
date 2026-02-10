---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# How to Configure Ralph Loop

## Prerequisites

- Profile applied to project
- Git initialized in project

## Steps

### 1. Apply ralph-integration profile

Stack with your base profile:

```bash
lens profile apply javascript+ralph-integration -p .
```

### 2. Configure phase skills (optional)

Edit `config/workflow-phases.yaml` to customize which skills are invoked per phase:

```yaml
phases:
  plan:
    description: Understand requirements, design approach
    skills: [clarity, simplicity, data-first, correctness, resilience, failure, safety]
  implement:
    description: Write the code
    skills: [pragmatism, clarity, simplicity, composition, distributed]
  adversarial-review:
    description: Attack your own code
    skills: [security-mindset, owasp, failure, safety]

ralph-sequence:
  - create-plan
  - structure-first
  - implement-plan
  - refactor-check-fix
  - dedupe-fix
  - gemini-fix
  - qodana-fix
  - adversarial-security-review
  - write-tests-run
  - ai-smell-fix
  - codex-fix
  - write-tests-run
```

### 3. Configure keyword detection (optional)

Edit `config/keyword-detection.yaml` to add skills based on task keywords:

```yaml
rules:
  security:
    patterns: [auth, password, jwt, token]
    skills: [security-mindset, owasp]
```

### 4. Configure iteration limits

The ralph-integration profile sets defaults. Override in your profile or settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_iterations` | 50 | Hard cap on total iterations |
| `max_iterations_per_item` | 5 | Max attempts per PRD item |
| `exit_on_idle_commits` | 3 | Stop if no changes for N iterations |

### 5. Configure quality gates

| Setting | Options | Description |
|---------|---------|-------------|
| `tests_required` | true/false | Run tests before commit |
| `review_mode` | "self", "full" | Review type during iteration |
| `review_threshold` | "no_critical", "no_high", "clean" | When to pass |

### 6. Configure post-loop validation

External validation runs AFTER the loop completes (not during):

| Setting | Options | Description |
|---------|---------|-------------|
| `enabled` | true/false | Run external validation after loop |
| `gemini` | true/false | Use Gemini code review |
| `qodana` | true/false | Use Qodana static analysis |
| `action` | "report", "fix" | What to do with findings |

### 7. Run the loop

Basic:
```bash
/ralph-loop PRD.md
```

With options:
```bash
/ralph-loop PRD.md --max 10 --external
```

| Flag | Description |
|------|-------------|
| `--max N` | Override max iterations |
| `--resume` | Continue from last incomplete item |
| `--external` | Run Gemini + Qodana after loop |
| `--dry-run` | Show what would be done |

## Understanding the Pipeline

Ralph runs this 12-phase pipeline for each PRD item:

```
create-plan → structure-first → implement-plan → [machine gate] → refactor-check-fix → dedupe-fix → gemini-fix → qodana-fix → [machine gate] → adversarial-security-review → write-tests-run → ai-smell-fix → codex-fix → [machine gate] → write-tests-run
```

Machine gates run `npm run build && npm test` between phase groups.

## Troubleshooting

### Loop runs too many iterations

Reduce `max_iterations` or `max_iterations_per_item`.

### Loop exits too early

Increase `exit_on_idle_commits`.

### Quality gates too strict

Change `review_threshold` from "clean" to "no_critical".

### Wrong skills being loaded

Check `config/workflow-phases.yaml` and `config/keyword-detection.yaml`.

### Gemini/Qodana not running

Check:
1. `GEMINI_API_KEY` is set
2. Qodana CLI is installed
3. Using `--external` flag

## See Also

- [Canon Loading Strategy](../reference/canon-loading-strategy.md)
- [Profile Reference](../reference/profiles.md)
- [External Validation](external-validation.md)
