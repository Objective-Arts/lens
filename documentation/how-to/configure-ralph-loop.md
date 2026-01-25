# How to Configure Ralph Loop

## Prerequisites

- Profile applied to project
- Git initialized in project

## Steps

### 1. Apply ralph-integration profile

Stack with your base profile:

```bash
cc-config profile apply csharp+ralph-integration -p .
```

### 2. Configure iteration limits

Edit `.claude/settings.json`:

```json
{
  "ralph": {
    "max_iterations": 50,
    "max_iterations_per_item": 5,
    "exit_on_idle_commits": 3
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `max_iterations` | 50 | Hard cap on total iterations |
| `max_iterations_per_item` | 5 | Max attempts per PRD item |
| `exit_on_idle_commits` | 3 | Stop if no changes for N iterations |

### 3. Configure quality gates

```json
{
  "ralph": {
    "quality_gates": {
      "tests_required": true,
      "review_mode": "self",
      "review_threshold": "no_critical"
    }
  }
}
```

| Setting | Options | Description |
|---------|---------|-------------|
| `tests_required` | true/false | Run tests before commit |
| `review_mode` | "self", "external", "both" | Review type during iteration |
| `review_threshold` | "no_critical", "no_high", "perfect" | When to pass |

### 4. Configure post-loop validation

```json
{
  "ralph": {
    "post_loop_validation": {
      "enabled": true,
      "gemini": true,
      "qodana": true,
      "action": "report"
    }
  }
}
```

| Setting | Options | Description |
|---------|---------|-------------|
| `enabled` | true/false | Run external validation after loop |
| `gemini` | true/false | Use Gemini code review |
| `qodana` | true/false | Use Qodana static analysis |
| `action` | "report", "fix", "defer" | What to do with findings |

### 5. Run the loop

```bash
claude "/ralph-loop PRD.md"
```

With options:

```bash
claude "/ralph-loop PRD.md --max 10 --validate"
```

## Troubleshooting

### Loop runs too many iterations

Reduce `max_iterations` or `max_iterations_per_item`.

### Loop exits too early

Increase `exit_on_idle_commits`.

### Quality gates too strict

Change `review_threshold` from "perfect" to "no_critical".

### Gemini/Qodana not running

Check:
1. `GEMINI_API_KEY` is set
2. Qodana CLI is installed
3. `post_loop_validation.enabled` is true
