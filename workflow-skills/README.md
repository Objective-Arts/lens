# Workflow Skills

Universal workflow skills for Claude Code. These are **not** canon skills (domain expert knowledge) - they are reusable workflow patterns that apply across all projects.

## Distinction from Canon Skills

| Aspect | Canon Skills | Workflow Skills |
|--------|--------------|-----------------|
| **Purpose** | Domain expert knowledge (Bloch, Cherny, Hevery) | Universal workflow patterns |
| **Location** | `canon-skills/` repo | `workflow-skills/` directory |
| **Scope** | Language/framework-specific | Cross-cutting, any project |
| **Examples** | `/bloch` (Java), `/cherny` (TypeScript) | `/review-hard`, `/test` |
| **Installation** | Per-project via `cc-config profile apply` | Global or per-project |

## Workflow Order

### Standard Flow
```
/plan → /structure-first → /build-from-plan → /refactor-clean → /test → /review-hard
```

### Autonomous Flow (Ralph Integration)
```
/plan → /structure-first → /ralph-loop (includes test + review internally)
```

## Available Skills

### /plan
Enter planning mode before implementation.

**Use when**: Non-trivial tasks, new features, architectural decisions, multi-file changes.

```
/plan                      # Enter planning mode for current task
/plan auth-refactor        # Plan specific feature
```

### /structure-first
Design data structures and interfaces before implementation.

**Use when**: Starting a new feature, before complex logic, or refactoring.

```
/structure-first           # Design structures for current task
/structure-first UserAuth  # Design structures for specific feature
```

### /build-from-plan
Implement code from an approved plan file.

**Use when**: After `/plan` or `/structure-first` has been approved.

```
/build-from-plan                    # Build from most recent plan
/build-from-plan auth-system        # Build from specific plan
/build-from-plan --resume           # Resume partially-completed plan
```

### /refactor-clean
Systematically clean up messy code with clear before/after structure.

**Use when**: After implementation, before testing. Tech debt cleanup, code smells.

```
/refactor-clean              # Refactor most recent code
/refactor-clean src/legacy   # Refactor specific path
```

### /test
Write tests at specified level(s) using testing canon patterns.

**Use when**: After implementation and refactoring, before review.

```
/test                    # Analyze and write all levels
/test unit               # Unit tests only
/test integration        # Integration tests only
/test e2e                # E2E tests only
/test unit src/utils     # Unit tests for specific path
```

### /review-hard
Adversarial self-review with optional Gemini and Qodana validation.

**Use when**: Before completion, commit, or PR.

```
/review-hard           # Review most recent code
/review-hard src/api   # Review specific path
/review-hard --full    # Include Gemini + Qodana
```

### /ralph-loop
Autonomous iteration loop for PRD implementation with quality gates.

**Use when**: Autonomous PRD implementation, long-running sessions, Ralph integration.

```
/ralph-loop                  # Run with default PRD.md
/ralph-loop PRD.md           # Specify PRD file
/ralph-loop --max 30         # Limit iterations
/ralph-loop --resume         # Continue from last session
```

See [Ralph Integration docs](../docs/ralph-integration.md) for full details.

## Installation

### Via cc-config (recommended)

```bash
# Install a specific workflow skill
cc-config workflow install review-hard -p .

# Install all workflow skills
cc-config workflow install --all -p .

# Check status of installed skills
cc-config workflow status -p .

# Upgrade outdated skills
cc-config workflow upgrade -p .
```

### Manual Installation

Copy specific skills to a project:

```bash
cp -r workflow-skills/review-hard your-project/.claude/skills/
```

### Global Installation (all projects)

Copy to your global skills directory:

```bash
cp -r workflow-skills/* ~/.claude/skills/
```

## Creating New Workflow Skills

1. Create directory: `workflow-skills/skill-name/`
2. Create `SKILL.md` with frontmatter:

```markdown
---
name: skill-name
description: Brief description for discovery
---

# /skill-name [args]

[Skill instructions...]
```

3. Skills are invoked as `/skill-name` in Claude Code

## Quality Standards

Workflow skills should:
- Be language/framework agnostic where possible
- Provide clear input/output formats
- Include examples
- Reference canon sources when applicable
- Focus on ONE workflow concern
