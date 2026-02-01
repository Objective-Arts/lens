# How to Run Ralph

Execute the autonomous 10-phase workflow on a PRD.

---

## Basic Run

```bash
ralph PRD.md
```

Ralph finds incomplete items (`- [ ]`) and processes each through 10 phases.

---

## Command Flags

| Flag | Description |
|------|-------------|
| `--max N` | Override max iterations (default: 50) |
| `--resume` | Continue from last incomplete item |
| `--external` | Enable Gemini + Qodana post-loop validation |
| `--dry-run` | Show what would be done without executing |
| `--verbose` | Show detailed output |
| `--skip-review` | Skip adversarial review phase |

---

## Resume After Interruption

If ralph stops (timeout, error, Ctrl+C), resume:

```bash
ralph PRD.md --resume
```

Ralph picks up from the last incomplete PRD item.

---

## Limit Iterations

Prevent runaway loops:

```bash
ralph PRD.md --max 20
```

---

## Enable External Validation

Run Gemini and Qodana after completion:

```bash
ralph PRD.md --external
```

This adds:
- Gemini adversarial review of all changes
- Qodana static analysis scan

---

## Dry Run

See what ralph would do without executing:

```bash
ralph PRD.md --dry-run
```

---

## PRD File Format

PRD is a markdown file with checkbox items:

```markdown
# Feature Name

- [ ] First task to implement
- [ ] Second task to implement
- [x] Already completed (skipped)
```

Each `- [ ]` is processed. `- [x]` items are skipped.

---

## The 10 Phases

For each PRD item, ralph runs:

1. **plan** — Design approach, identify files/functions
2. **structure-first** — Define types and interfaces
3. **implement** — Write the code
4. **refactor-check** — Clean up, simplify
5. **independent-review** — Gemini code review (bugs, edge cases)
6. **static-analysis** — Qodana code analysis
7. **test** — Write and run tests
8. **doc-code** — Generate documentation
9. **security-review** — Adversarial security review
10. **production-readiness** — Final production checks

---

## Configuration

Create `.claude/ralph-config.yaml`:

```yaml
settings:
  maxIterations: 50
  maxIterationsPerItem: 10
  exitOnIdleCommits: 3

quality_gates:
  tests_required: true
  review_required: true
```

---

## View Logs

Ralph logs each phase:

```bash
ls .claude/logs/
cat .claude/logs/item1_*.plan.json
```

---

## Troubleshooting

**Claude CLI not found**:
```bash
which claude  # Should show path
```

**Config not found**:
```bash
cat .claude/ralph-config.yaml  # Must exist
```

**Phase keeps failing**:
Check the log file for that phase:
```bash
cat .claude/logs/item1_*.implement.raw.txt
```

**Stuck in loop**:
Use `--max` to limit iterations:
```bash
ralph PRD.md --max 10
```
