# Skills System

How skills work and why they're designed this way.

---

## What Skills Are

Skills are markdown files that teach Claude how to approach problems. They encode expert knowledge—patterns, principles, and practices from recognized masters.

```markdown
---
name: kernighan
description: "Kernighan's clarity and simplicity"
---

# Brian Kernighan: Clarity and Simplicity

> "Debugging is twice as hard as writing the code in the first place.
> Therefore, if you write the code as cleverly as possible, you are,
> by definition, not smart enough to debug it."

## Rules

1. Write clearly, don't be too clever
2. Say what you mean, simply and directly
...
```

When Claude loads this skill, it adopts Kernighan's mindset. Code becomes clearer, simpler, more debuggable.

---

## Skill Categories

Skills are organized by purpose:

### Canon Skills

Expert knowledge from recognized masters:

| Category | Examples | Purpose |
|----------|----------|---------|
| Code quality | kernighan, pike, mcilroy | Clarity, simplicity, Unix philosophy |
| Design | bloch, liskov, gang-of-four | APIs, substitutability, patterns |
| Language | cherny, crockford, abramov | TypeScript, JavaScript, React |
| Testing | meszaros, dodds, fowler-test | Test patterns, Testing Library |
| Security | schneier, owasp, troy-hunt | Security mindset, vulnerabilities |
| Documentation | procida, strunk-white, zinsser | Diátaxis, clear writing |

### Workflow Skills

Universal patterns for how to work:

| Skill | Purpose |
|-------|---------|
| plan | Create implementation plans |
| structure-first | Design types before code |
| implement | Write code from plans |
| refactor-check | Systematic cleanup |
| test | Write and run tests |
| doc-code | Generate documentation |

### Security Skills

Security-focused expertise:

| Skill | Purpose |
|-------|---------|
| owasp | OWASP Top 10 vulnerabilities |
| schneier | Security mindset |
| security-mindset | General security thinking |

---

## How Skills Load

### At Project Setup

When you apply a profile, skills are copied:

```bash
cc-config profile apply javascript -p .
```

This copies skills specified in the profile to `.claude/skills/`.

### At Runtime

When Claude runs, it loads:

1. **Global skills** from `~/.claude/skills/`
2. **Project skills** from `.claude/skills/`
3. **Auto-invoked skills** based on CLAUDE.md rules

### During Ralph Phases

Each phase loads phase-specific experts:

```yaml
# workflow-phases.yaml
plan:
  experts:
    - kernighan
    - pike
    - dijkstra

implement:
  experts:
    - cherny
    - crockford
```

Plus dynamic experts based on keywords in the PRD.

---

## Auto-Invoke Rules

CLAUDE.md can specify when skills load automatically:

```markdown
## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing tests | INVOKE /meszaros |
| React components | INVOKE /abramov then /frost |
| Security-sensitive code | INVOKE /schneier then /owasp |
```

When Claude detects the context, it loads the specified skills.

---

## Why Copy, Not Symlink

Skills are copied to projects rather than symlinked.

### Benefits

1. **Portability**: Projects work on any machine
2. **Stability**: No broken links when source moves
3. **Versioning**: Manifest tracks which version installed
4. **Customization**: Can modify project copy without affecting source

### Trade-offs

- Duplicate storage (but skills are small)
- Must explicitly upgrade (`cc-config canon upgrade`)

### The Manifest

`canon-manifest.json` tracks installed skills:

```json
{
  "skills": {
    "kernighan": {
      "installedCommit": "abc123",
      "hash": "sha256...",
      "modified": false
    }
  }
}
```

This enables:
- Detecting when source has updates
- Detecting when you modified the copy
- Safe upgrades that preserve your changes

---

## Dynamic Expert Loading

Ralph detects keywords in PRD items and loads relevant experts:

```yaml
# keyword-detection.yaml
ui_components:
  patterns:
    - "form"
    - "button"
    - "component"
  experts:
    - frost
    - norman
    - ive

database:
  patterns:
    - "table"
    - "schema"
    - "migration"
  experts:
    - codd
```

If your PRD says "Add a login form", Ralph loads form-related experts (frost, norman) automatically.

---

## Skill Anatomy

A skill is a directory with SKILL.md:

```
skills/
└── kernighan/
    └── SKILL.md
```

### SKILL.md Structure

```markdown
---
name: kernighan
description: "Brief description"
---

# Title

## Core Philosophy

Quote or key insight.

## Principles

1. First principle
2. Second principle

## Rules

Specific rules to follow.

## Examples

Code examples showing right vs wrong.

## Anti-Patterns

What to avoid.
```

### What Makes a Good Skill

1. **Focused**: One expert, one perspective
2. **Actionable**: Clear rules Claude can apply
3. **Exemplified**: Shows right vs wrong
4. **Sourced**: Based on real expertise, not invented

---

## Skill Interactions

Skills can complement or conflict:

### Complementary

- kernighan (clarity) + pike (simplicity) = clear, simple code
- meszaros (test patterns) + dodds (Testing Library) = good React tests

### Potentially Conflicting

- carmack (optimize everything) + kernighan (clarity first)

When skills conflict, later-loaded skills take precedence, but Claude tries to balance perspectives.

---

## Creating Custom Skills

1. Create directory: `.claude/skills/my-skill/`
2. Create `SKILL.md` with frontmatter and content
3. Reference in CLAUDE.md auto-invoke or profile

```markdown
---
name: my-skill
description: "What this skill teaches"
---

# My Custom Skill

## Philosophy

What perspective this skill brings.

## Rules

1. Specific, actionable rules
2. That Claude can apply

## Examples

\`\`\`typescript
// Good
const clear = "example";

// Bad
const x = "y";
\`\`\`
```

---

## Summary

Skills encode expert knowledge:
- Loaded at project setup (profile apply)
- Loaded at runtime (auto-invoke)
- Loaded per phase (workflow-phases.yaml)
- Loaded dynamically (keyword detection)

Copied, not symlinked, for portability and versioning.

The result: Claude writes code through the lens of recognized experts, not generic patterns.
