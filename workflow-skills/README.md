# Workflow Skills

Universal workflow skills for Claude Code. Each skill matches a Ralph phase exactly - use standalone or let Ralph orchestrate them.

## The 8 Phases

Ralph runs these phases in order. Each phase is also a standalone skill:

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1 | `/plan` | Create implementation plan |
| 2 | `/structure-first` | Design types/interfaces |
| 3 | `/implement` | Write code from plan |
| 4 | `/refactor-check` | Clean up code |
| 5 | `/adversarial-review` | Hard-ass review via Gemini |
| 6 | `/static-analysis` | Run Qodana, fix issues |
| 7 | `/test` | Write tests |
| 8 | `/doc-code` | Generate documentation |

**Orchestrator:** `/ralph-loop` runs all 8 phases autonomously.

## Standalone Usage

Use skills individually when you don't need the full pipeline:

```bash
/plan auth-system          # Just plan
/implement                  # Just implement from plan
/test unit          # Just write unit tests
/adversarial-review        # Just review
```

## Autonomous Usage

Let Ralph orchestrate all phases:

```bash
/ralph-loop PRD.md         # Run all 8 phases per PRD item
/ralph-loop --max 30       # Limit iterations
```

## Skill Details

### /plan
Create implementation plan before coding.

```
/plan                      # Plan current task
/plan auth-refactor        # Plan specific feature
```

### /structure-first
Design data structures and interfaces before implementation.

```
/structure-first           # Design for current task
/structure-first UserAuth  # Design for specific feature
```

### /implement
Implement code from the approved plan.

```
/implement                 # Implement from recent plan
/implement auth-system     # Implement specific feature
```

### /refactor-check
Systematically clean up code with before/after structure.

```
/refactor-check            # Refactor recent code
/refactor-check src/legacy # Refactor specific path
```

### /adversarial-review
Hard-ass code review using Gemini.

```
/adversarial-review        # Review recent code
/adversarial-review src/   # Review specific path
```

### /static-analysis
Run Qodana static analysis and fix issues.

```
/static-analysis           # Analyze project
/static-analysis src/api   # Analyze specific path
```

### /test
Write tests at specified level(s).

```
/test               # All levels
/test unit          # Unit tests only
/test integration   # Integration tests only
/test e2e           # E2E tests only
```

### /doc-code
Generate documentation using Diátaxis framework.

```
/doc-code                  # Document recent changes
/doc-code src/services/    # Document specific path
```

### /ralph-loop
Autonomous orchestrator - runs all 8 phases per PRD item.

```
/ralph-loop                # Run with PRD.md
/ralph-loop tasks.md       # Specify PRD file
/ralph-loop --max 30       # Limit iterations
/ralph-loop --resume       # Continue from last session
```

## Installation

### Via cc-config (recommended)

```bash
cc-config profile apply javascript+ralph-integration .
```

### Manual

```bash
cp -r workflow-skills/* your-project/.claude/skills/
```

## Canon Skills vs Workflow Skills

| Aspect | Canon Skills | Workflow Skills |
|--------|--------------|-----------------|
| **Purpose** | Domain expert knowledge | Universal workflow |
| **Examples** | `/bloch`, `/cherny`, `/dodds` | `/plan`, `/implement`, `/test` |
| **Scope** | Language/framework-specific | Cross-cutting |
