# /mall Summary

> "Hot potato, not waterfall."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Hot potato** | Pass work back and forth rapidly |
| **Shared language** | Tokens, components, patterns |
| **Decisions, not deliverables** | The goal is understanding, not documents |

## The Process

```
Design ←────────────────────────────────► Development
       sketch  prototype  refine  implement  ship
       (hours) (hours)    (hours) (days)     (done)
```

## Component Handoff Checklist

**Behavior:**
- [ ] Default, hover, active, focus, disabled states
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)

**Responsive:**
- [ ] Mobile, tablet, desktop behavior
- [ ] What changes at each breakpoint?

**Animation:**
- [ ] Enter/exit animations
- [ ] Timing and easing

**Content:**
- [ ] Min/max character lengths
- [ ] Truncation behavior

## Anti-Patterns

| Bad | Fix |
|-----|-----|
| "The Wall" | Continuous collaboration |
| "Pixel Police" | Use tokens |
| "Redesign Loop" | Review prototype before implementation |
| "Handoff Dump" | Walk through together |

## Source of Truth

```
Tokens → Figma → Code → Browser (truth)

If browser doesn't match Figma:
1. Is code wrong? → Fix code
2. Is design wrong? → Update Figma
3. Is intent unclear? → Talk
```

## When to Use

- Design-dev collaboration
- Handoff process
- Review checklists
