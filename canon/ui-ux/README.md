# UI/UX Canon

12 experts providing prescriptive, concrete rules for building beautiful interfaces without being a designer.

## The Experts

| Layer | Expert | Focus | Skill |
|-------|--------|-------|-------|
| **Philosophy** | Dieter Rams | 10 Principles - less but better | `/rams` |
| **Psychology** | Don Norman | Affordances, feedback, mental models | `/norman` |
| **Goal Design** | Alan Cooper | Goal-directed design, eliminate excise | `/cooper` |
| **Information** | Edward Tufte | Data-ink ratio, clarity, no chartjunk | `/tufte` |
| **Visual** | Jony Ive | Minimalism, material honesty, depth | `/ive` |
| **Typography** | Mike Kruzeniski | Type-first hierarchy, Fluent | `/kruzeniski` |
| **Motion** | Matías Duarte | Material motion, meaningful transitions | `/duarte` |
| **Interaction** | Bill Buxton | Input fundamentals, sketching UX | `/buxton` |
| **Patterns** | Luke Wroblewski | Mobile-first, forms, thumb zones | `/wroblewski` |
| **Components** | Brad Frost | Atomic design, reusable systems | `/frost` |
| **Governance** | Nathan Curtis | Versioning, documentation, tokens | `/curtis` |
| **Collaboration** | Dan Mall | Designer-dev handoff, hot potato | `/mall` |

## Design Workflow

Apply experts in this order:

```
1. PHILOSOPHY   → /rams       "What can we remove?"
2. PSYCHOLOGY   → /norman     "How will users understand this?"
3. GOALS        → /cooper     "What goal does this serve? Eliminate excise."
4. STRUCTURE    → /frost      "What components do we need?"
5. VISUAL       → /ive        "How should it look?"
6. TYPOGRAPHY   → /kruzeniski "How does type create hierarchy?"
7. INTERACTION  → /buxton     "How do users interact?"
8. PATTERNS     → /wroblewski "How does mobile work?"
9. MOTION       → /duarte     "How do things move?"
10. DATA VIZ    → /tufte      "How do we show data?"
11. GOVERNANCE  → /curtis     "How do we document this?"
12. HANDOFF     → /mall       "How do we ship this?"
```

## Quick Reference

### Colors (3 max)
```css
--accent: #3b82f6;        /* Primary actions only */
--text: #1f2937;          /* Not pure black */
--background: #ffffff;    /* Clean */
--gray-*: for everything else
```

### Spacing (4px base)
```css
--space: 4, 8, 12, 16, 24, 32, 48, 64, 96
/* Never 13px, 27px, or arbitrary values */
```

### Typography
```css
--font: system-ui, -apple-system, sans-serif;
--text-base: 16px;  /* Never smaller for body */
--max-width: 65ch;  /* Readable line length */
```

### Touch Targets
```css
min-width: 44px;
min-height: 44px;
/* Non-negotiable on mobile */
```

### Animation
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
/* No linear, no bounce, no > 500ms */
```

## The Prescriptive Difference

These experts don't give vague guidance like "make it intuitive." They give concrete rules:

| Vague | Prescriptive |
|-------|--------------|
| "Use appropriate spacing" | "Use 4px increments: 4, 8, 12, 16, 24, 32" |
| "Make buttons accessible" | "44px minimum touch target" |
| "Use readable fonts" | "16px minimum, 65ch max width, 1.5 line height" |
| "Animate smoothly" | "ease-out for enter, ease-in for exit, 300ms max" |
| "Design mobile-first" | "Primary actions in bottom 1/3, thumb zone" |

## Auto-Invoke Rules

```yaml
autoInvoke:
  - context: Building UI component
    action: INVOKE `/frost` then `/ive`

  - context: Designing forms
    action: INVOKE `/wroblewski` then `/norman`

  - context: Modals, dialogs, confirmations
    action: INVOKE `/cooper` for goal-directed design

  - context: Adding animation
    action: INVOKE `/duarte`

  - context: Data visualization
    action: INVOKE `/tufte`

  - context: Mobile design
    action: INVOKE `/wroblewski` then `/buxton`

  - context: Design system documentation
    action: INVOKE `/curtis`

  - context: Handoff to development
    action: INVOKE `/mall`
```

## Combined Score

Rate any UI against all 12 experts:

| Expert | Score (0-10) | Weight |
|--------|--------------|--------|
| Rams (simplicity) | | 12% |
| Norman (usability) | | 12% |
| Cooper (goal-directed) | | 12% |
| Ive (visual) | | 10% |
| Kruzeniski (typography) | | 8% |
| Duarte (motion) | | 5% |
| Buxton (interaction) | | 8% |
| Wroblewski (mobile) | | 10% |
| Frost (components) | | 10% |
| Curtis (documentation) | | 5% |
| Mall (collaboration) | | 4% |
| Tufte (data viz) | | 4% |
| **Total** | | **100%** |

**Passing score: 70+**

## Integration with Other Canon

The UI/UX canon integrates with:

- **Visualization canon** (`/tufte`, `/few`, `/bostock`, `/knaflic`) - For data-heavy interfaces
- **Testing canon** - Accessibility testing, visual regression
- **Security canon** - Form security, input validation

## File Locations

```
canon/ui-ux/
├── README.md         (this file)
├── rams/SKILL.md
├── norman/SKILL.md
├── cooper/SKILL.md
├── ive/SKILL.md
├── kruzeniski/SKILL.md
├── duarte/SKILL.md
├── buxton/SKILL.md
├── wroblewski/SKILL.md
├── frost/SKILL.md
├── curtis/SKILL.md
└── mall/SKILL.md

canon/visualization/
├── tufte/SKILL.md    (shared with UI/UX)
├── few/SKILL.md
├── bostock/SKILL.md
└── knaflic/SKILL.md
```
