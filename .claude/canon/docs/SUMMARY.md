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

## Concrete Checks (MUST ANSWER)

- [ ] **Single quadrant?** Does this document live in exactly one Diataxis quadrant (tutorial, how-to, reference, or explanation)? If it spans two, split it.
- [ ] **No teaching in tutorials?** Does the tutorial stick to "do this, then this" steps without explaining why something works? Background explanations belong in a separate explanation doc.
- [ ] **No tutorials in reference?** Does the reference section avoid step-by-step walkthroughs? If it contains "First, install..." or "Now, create...", move that to a how-to or tutorial.
- [ ] **Completeness test for reference:** Does the reference doc cover every public function/option/parameter, or does it cherry-pick? Incomplete reference is worse than none.
- [ ] **Task-oriented how-to?** Does the how-to start with the goal ("How to deploy to production") rather than the tool ("Using the deploy command")?
