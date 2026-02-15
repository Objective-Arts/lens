---
name: handoff
description: "Design-dev collaboration - hot potato, handoff, shared language"
---

# Dan Mall - Design-Dev Collaboration

Design and development are not sequential phases. They're a continuous collaboration. Hot potato, not waterfall.

## Core Philosophy

### Hot Potato
Pass work back and forth rapidly. Designer sketches → developer prototypes → designer refines → developer implements.

**Not:**
```
Design ─────────────────► Development ─────────────────► Done
        (months)                      (months)
```

**Yes:**
```
Design ←──────────────────────────────────────────────────► Development
       sketch  prototype  refine  implement  refine  ship
       (hours) (hours)    (hours) (days)     (hours) (done)
```

### Shared Language
Designers and developers must speak the same language. Tokens, components, and patterns are that language.

### Decisions, Not Deliverables
The goal is decisions, not documents. A Figma file is worthless if developers don't understand the intent.

## The Handoff Problem

### Traditional Handoff (Broken)

```
Designer creates:          Developer receives:
─────────────────          ─────────────────
- 50 Figma screens         "Here's the design"
- Pixel-perfect mockups
- No responsive states     Questions:
- No interaction specs     - What happens on hover?
- Static, not systematic   - How does this animate?
                          - What about mobile?
                          - Is this a new component?
                          - (builds wrong thing)
```

### Collaborative Process (Works)

```
Step 1: Designer + Developer align on requirements
Step 2: Designer sketches (low fidelity)
Step 3: Developer builds prototype (real code, ugly)
Step 4: Designer refines prototype design
Step 5: Developer implements refined design
Step 6: Designer reviews in browser
Step 7: Iterate until done
```

## Prescriptive Handoff Checklist

### For Every Component

```markdown
## Component Handoff: [Name]

### Behavior
- [ ] Default state
- [ ] Hover state
- [ ] Active/pressed state
- [ ] Focus state (keyboard)
- [ ] Disabled state
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)
- [ ] Empty state (if applicable)

### Responsive
- [ ] Mobile (< 640px)
- [ ] Tablet (640-1024px)
- [ ] Desktop (> 1024px)
- [ ] What changes at each breakpoint?

### Animation
- [ ] Enter animation (or "none")
- [ ] Exit animation (or "none")
- [ ] State transition timing
- [ ] Easing curve

### Content
- [ ] Min/max character lengths
- [ ] Truncation behavior
- [ ] Empty content behavior
- [ ] Localization considerations

### Accessibility
- [ ] ARIA role
- [ ] Keyboard interaction
- [ ] Screen reader behavior
- [ ] Focus management
```

### For Every Screen

```markdown
## Screen Handoff: [Name]

### Layout
- [ ] Wireframe/structure defined
- [ ] Responsive behavior at breakpoints
- [ ] Component placement rationale

### Data
- [ ] What data populates this screen?
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Pagination/infinite scroll behavior

### Navigation
- [ ] How do users get here?
- [ ] Where can users go from here?
- [ ] Back button behavior

### Edge Cases
- [ ] Logged out user
- [ ] New user (empty data)
- [ ] Power user (lots of data)
- [ ] Error scenarios
```

## Communication Patterns

### Design Questions to Ask Developers

Before designing:
- What's technically feasible?
- What components already exist?
- What are the performance constraints?
- What data is available?

During design:
- Does this interaction make sense?
- Is this pattern reusable?
- Am I missing any states?

### Developer Questions to Ask Designers

Before building:
- What's the priority (MVP vs polish)?
- What can I prototype quickly for feedback?
- Which states are most important?

During building:
- Is this interpretation correct?
- What happens in this edge case?
- Can we simplify this?

## Review Process

### Design Review (Designer → Developer)

```markdown
## Design Review Checklist

### Visual
- [ ] Matches design system tokens
- [ ] Spacing follows grid
- [ ] Typography matches scale
- [ ] Colors match palette

### Interaction
- [ ] All states implemented
- [ ] Animations feel right
- [ ] Transitions smooth
- [ ] Responsive works

### Functionality
- [ ] Feature complete
- [ ] Edge cases handled
- [ ] Error states present
- [ ] Loading states present
```

### Code Review (Developer → Designer)

```markdown
## Code Review Checklist

### Consistency
- [ ] Uses design system components
- [ ] No one-off styles
- [ ] Follows naming conventions
- [ ] Reusable where appropriate

### Accessibility
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] Focus visible
- [ ] Color contrast passing
```

## Shared Artifacts

### What Both Should Access

| Artifact | Format | Owner | Used By |
|----------|--------|-------|---------|
| Design tokens | JSON/CSS | Designer | Both |
| Component specs | Markdown | Designer | Both |
| Pattern library | Storybook | Developer | Both |
| Figma library | Figma | Designer | Designer |
| Production code | Git | Developer | Developer |

### Source of Truth

```
Tokens → Figma (design) → Code (implementation) → Browser (truth)

If browser doesn't match Figma:
1. Is code wrong? → Fix code
2. Is design wrong? → Update Figma
3. Is intent unclear? → Talk
```

## Anti-Patterns

### The Wall

```
Designer ════════════════════════════════════ Developer
          "Here's the design, go build it"

Problem: No feedback loop, wrong assumptions
```

### The Pixel Police

```
Designer: "This padding is 23px, it should be 24px"
Developer: "Does it matter?"
Designer: "It's wrong"

Problem: Focusing on pixels instead of patterns
Fix: Use tokens, then padding is always correct
```

### The Redesign Loop

```
Designer: "Let me redesign this"
Developer: "I already built it"
Designer: "But it's not right"
Developer: "Then why did you approve it?"

Problem: No checkpoint before development
Fix: Designer reviews prototype before implementation
```

### The Handoff Dump

```
Designer: *sends 50 screens*
Designer: "Let me know if you have questions"
Developer: *has 50 questions*

Problem: No prioritization, no context
Fix: Walk through together, document decisions
```

## Collaboration Tools

### Recommended Stack

| Purpose | Tool | Shared? |
|---------|------|---------|
| Design files | Figma | Yes (view access) |
| Component library | Storybook | Yes |
| Design tokens | JSON → CSS | Yes (auto-synced) |
| Task tracking | Linear/Jira | Yes |
| Communication | Slack/Teams | Yes |
| Documentation | Notion/Confluence | Yes |

### Integration Points

```
Figma (tokens) ──┬──> tokens.json ──> code variables
                 │
                 └──> Storybook ──> living documentation
```

## Mall Score

| Score | Meaning |
|-------|---------|
| 10 | True collaboration, shared ownership |
| 7-9 | Good communication, some handoff friction |
| 4-6 | Sequential process, delayed feedback |
| 0-3 | Siloed, over-the-wall handoffs |

## Integration

Combine with:
- `/components` - Components that need handoff
- `/tokens` - Documentation that enables handoff
- All other UI skills - The team process that ships them
