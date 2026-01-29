# How to Configure Ralph Loop

## Prerequisites

- Profile applied to project
- Git initialized in project

## Steps

### 1. Apply ralph-integration profile

Stack with your base profile:

```bash
cc-config profile apply javascript+ralph-integration -p .
```

### 2. Configure skill detection (optional)

Edit `canon/skill-rules.yaml` to customize which canon experts are invoked:

```yaml
# Workflow defaults - always invoked for /ralph-loop stages
workflow-defaults:
  plan:
    always: [kernighan, pike, linus]
  build:
    always: [thompson]
  review:
    always: [schneier]

# Detection rules - add skills based on task keywords
rules:
  security:
    patterns: [auth, password, jwt]
    skills: [schneier, owasp, security-mindset]
    stages: [plan, build, review]
```

### 3. Configure iteration limits

The ralph-integration profile sets defaults. Override in your profile or settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_iterations` | 50 | Hard cap on total iterations |
| `max_iterations_per_item` | 5 | Max attempts per PRD item |
| `exit_on_idle_commits` | 3 | Stop if no changes for N iterations |

### 4. Configure quality gates

| Setting | Options | Description |
|---------|---------|-------------|
| `tests_required` | true/false | Run tests before commit |
| `review_mode` | "self", "full" | Review type during iteration |
| `review_threshold` | "no_critical", "no_high", "clean" | When to pass |

### 5. Configure post-loop validation

External validation runs AFTER the loop completes (not during):

| Setting | Options | Description |
|---------|---------|-------------|
| `enabled` | true/false | Run external validation after loop |
| `gemini` | true/false | Use Gemini code review |
| `qodana` | true/false | Use Qodana static analysis |
| `action` | "report", "fix" | What to do with findings |

### 6. Run the loop

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

Ralph runs this pipeline for each PRD item:

```
plan → build → refactor → test → review → doc
```

At each stage:
1. Profile skills are loaded (static)
2. Detection rules add skills based on PRD item text (dynamic)
3. Stage executes with combined skills

## Troubleshooting

### Loop runs too many iterations

Reduce `max_iterations` or `max_iterations_per_item`.

### Loop exits too early

Increase `exit_on_idle_commits`.

### Quality gates too strict

Change `review_threshold` from "clean" to "no_critical".

### Wrong skills being loaded

Check `canon/skill-rules.yaml`:
- Are patterns matching your task text?
- Are stages correct for when you want the skill?

### Gemini/Qodana not running

Check:
1. `GEMINI_API_KEY` is set
2. Qodana CLI is installed
3. Using `--external` flag

## See Also

- [Canon Loading Strategy](../reference/canon-loading-strategy.md)
- [Profile Reference](../reference/profiles.md)
- [External Validation](external-validation.md)
