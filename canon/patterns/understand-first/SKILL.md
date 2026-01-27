---
name: understand-first
description: "Researching unfamiliar code before making changes. Use when exploring how something works, investigating before implementing, or needing to understand a codebase before modifying."
---

# UNDERSTAND-THEN-ACT Pattern

**Intent**: Never act without first understanding the context.

## The Pattern

```
SUBAGENT (Research) ──► SKILL (Apply)
       │                      │
       ▼                      ▼
"How does this         "Apply principles
 work here?"            with context"
```

## When to Use

- New feature in unfamiliar codebase
- Bug fix when root cause unknown
- Refactoring when impact unclear
- Any time you're tempted to jump straight to implementation

## Execution Steps

### Phase 1: UNDERSTAND (SubAgent Research)

Before writing ANY code, gather context:

1. **Explore the domain**
   - What patterns exist in this codebase?
   - What conventions are followed?
   - What dependencies are in play?

2. **Map the territory**
   - Which files are involved?
   - What's the data flow?
   - Where are the integration points?

3. **Identify constraints**
   - What can't change?
   - What are the performance requirements?
   - What tests must pass?

4. **Document findings**
   ```
   CONTEXT GATHERED:
   - Pattern observed: [e.g., middleware pattern, repository pattern]
   - Key files: [list critical files]
   - Constraints: [what must be preserved]
   - Dependencies: [what this touches]
   ```

### Phase 2: ACT (Skill Application)

Only after understanding is complete:

1. **State your approach**
   - Based on context, here's the plan...
   - This follows the [pattern] already in use
   - This respects [constraint] by...

2. **Apply with context**
   - Use principles appropriate to what was discovered
   - Match existing patterns
   - Respect established conventions

3. **Verify alignment**
   - Does this fit what was learned?
   - Are constraints respected?
   - Will existing tests pass?

## Anti-Pattern: ACT-THEN-UNDERSTAND

```
❌ WRONG:
   "Let me just add this function..."
   [breaks something]
   "Oh, I didn't realize it worked that way..."

✅ RIGHT:
   "First, let me understand how auth works here..."
   [discovers middleware pattern, Redis sessions]
   "Now I'll add auth that matches the existing pattern..."
```

## Checklist Before Acting

- [ ] I can explain how the current system works
- [ ] I know what patterns are already in use
- [ ] I've identified what could break
- [ ] I understand the constraints
- [ ] My approach matches existing conventions

## The Rule

> **If you can't explain how it currently works, you're not ready to change it.**
