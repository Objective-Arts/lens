# Tutorial: Adding a Canon Skill

*Learn how to encode expert perspectives by creating your own canon skill.*

## What You'll Learn

- The structure of a canon skill
- How to extract principles from source material
- How to format anti-patterns and examples
- How to integrate with profiles

## Prerequisites

- Completed Getting Started tutorial
- A master with published principles you want to encode

## Step 1: Choose Your Master

Canon masters must meet criteria:

- **Published principles**: Books, talks, or documented code
- **Demonstrated impact**: Widely adopted
- **Specific techniques**: Actionable patterns
- **Clear scope**: Known domain

For this tutorial, we'll create a simplified skill for a fictional master.

## Step 2: Create the Skill Directory

Navigate to your canon directory and create the skill structure:

```bash
cd ~/.claude-optimal/canon
mkdir -p mymaster
```

## Step 3: Create the SKILL.md File

Create the skill file:

```bash
cat > mymaster/SKILL.md << 'EOF'
---
name: mymaster
description: "MyMaster's patterns for clean architecture"
---

# MyMaster: Clean Architecture Patterns

Apply MyMaster's principles for structuring code.

## Core Philosophy

> "Dependencies should point inward, not outward."

### Key Principles

1. **Dependency Rule**: Inner layers know nothing of outer layers
2. **Entity Independence**: Business rules don't depend on frameworks
3. **Interface Adapters**: Convert data between layers

---

## The Patterns

### Pattern 1: Dependency Inversion

**Principle**: Depend on abstractions, not concretions.

**Implementation**:
```typescript
// BAD: Direct dependency
class UserService {
    private db = new PostgresDB();
}

// GOOD: Abstracted dependency
class UserService {
    constructor(private db: Database) {}
}
```

### Pattern 2: Use Cases

**Principle**: Each use case is a single operation.

**Implementation**:
```typescript
// One use case, one class
class CreateUserUseCase {
    execute(input: CreateUserInput): User {
        // Single responsibility
    }
}
```

---

## Decision Tree

```
Designing a new feature?
│
├── What layer does it belong to?
│   ├── Business rules → Entity layer
│   ├── Application logic → Use case layer
│   ├── External interface → Adapter layer
│   └── Framework/driver → Infrastructure layer
│
└── Do dependencies point inward?
    ├── Yes → Proceed
    └── No → Refactor
```

---

## Anti-Patterns

### Never Do

- Import framework in entity layer
- Let use cases know about HTTP/REST
- Have entities depend on database types

### Always Do

- Define interfaces at layer boundaries
- Keep entities pure (no I/O)
- Inject dependencies

---

## Quick Reference

| Layer | Contains | Depends On |
|-------|----------|------------|
| Entity | Business rules | Nothing |
| Use Case | Application logic | Entities |
| Adapter | Interface conversion | Use Cases |
| Infrastructure | Frameworks, DB | Adapters |

EOF
```

## Step 4: Test the Skill

Invoke it directly to test:

```bash
claude
> /mymaster
```

Claude should acknowledge the skill and its principles.

## Step 5: Integrate with a Profile

Add to your profile's domain canon:

```yaml
# profiles/my-project.yaml
name: my-project
extends: javascript

canon:
  domain:
    - mymaster
```

Or symlink to a project:

```bash
ln -sf ~/.claude-optimal/canon/mymaster /path/to/project/.claude/skills/
```

## Step 6: Add Auto-Invoke Rules

In your project's CLAUDE.md:

```markdown
## Auto-Invoke Rules

| Context | Action |
|---------|--------|
| Architecture decisions | INVOKE /mymaster |
| Layer boundaries | INVOKE /mymaster |
```

## What You've Accomplished

You've successfully:
- Created a canon skill structure
- Encoded principles with examples
- Added anti-patterns and decision trees
- Integrated with a profile

## Skill Quality Checklist

- [ ] Core philosophy with citable quote
- [ ] Numbered principles
- [ ] Code examples (good and bad)
- [ ] Decision tree for when to apply
- [ ] Anti-patterns section
- [ ] Quick reference table

## Next Steps

- [Canon Masters Reference](../reference/canon-catalog.md) - See existing masters
- [Why Canon Masters?](../explanation/why-canon-masters.md) - Understand the philosophy
- [How to Add Canon Masters](../how-to/add-canon-masters.md) - Detailed encoding guide
