# /docs Summary

> "Documentation needs to include and be structured around its four different functions."

## The Four Quadrants

```
                PRACTICAL              THEORETICAL
          ┌──────────────────────┬──────────────────────┐
LEARNING  │     TUTORIALS        │    EXPLANATION       │
          │  "Follow me as I     │  "Here's why this    │
          │   show you how"      │   works this way"    │
          ├──────────────────────┼──────────────────────┤
WORKING   │     HOW-TO           │    REFERENCE         │
          │  "Here's how to      │  "Here's the         │
          │   accomplish X"      │   specification"     │
          └──────────────────────┴──────────────────────┘
```

## The Four Types

| Type | Purpose | Key Rule |
|------|---------|----------|
| **Tutorial** | Learn by doing | Hold their hand, no choices |
| **How-To** | Accomplish a task | Assumes competence, no teaching |
| **Reference** | Look up information | Complete, consistent, austere |
| **Explanation** | Understand why | Discuss alternatives, take positions |

## Anti-Patterns

```markdown
# BAD: Mixing reference with tutorial
The authenticate() method logs users in. To use it, first
install the package (npm install auth), then import it...

# BAD: Teaching in tutorial
Step 3: Now we'll use dependency injection. Dependency
injection is a pattern where dependencies are provided...

# GOOD: Keep them separate, link between
```

## Decision Tree

- Learning something new? → **Tutorial**
- Trying to accomplish a task? → **How-To**
- Looking up specific info? → **Reference**
- Trying to understand why? → **Explanation**

## When to Use

- Creating any documentation
- Restructuring existing docs
- Deciding where information belongs
