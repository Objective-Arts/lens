# UI/UX Canon

12 experts providing prescriptive, concrete rules for building beautiful interfaces without being a designer.

## The Experts

| Layer | Expert | Focus | Skill |
|-------|--------|-------|-------|
| **Philosophy** | Dieter Rams | 10 Principles - less but better | `/design` |
| **Psychology** | Don Norman | Affordances, feedback, mental models | `/usability` |
| **Goal Design** | Alan Cooper | Goal-directed design, eliminate excise | `/personas` |
| **Information** | Edward Tufte | Data-ink ratio, clarity, no chartjunk | `/charts` |
| **Visual** | Jony Ive | Minimalism, material honesty, depth | `/visual` |
| **Typography** | Mike Kruzeniski | Type-first hierarchy, Fluent | `/typography` |
| **Motion** | Matías Duarte | Material motion, meaningful transitions | `/motion` |
| **Interaction** | Bill Buxton | Input fundamentals, sketching UX | `/interaction` |
| **Patterns** | Luke Wroblewski | Mobile-first, forms, thumb zones | `/mobile` |
| **Components** | Brad Frost | Atomic design, reusable systems | `/components` |
| **Governance** | Nathan Curtis | Versioning, documentation, tokens | `/tokens` |
| **Collaboration** | Dan Mall | Designer-dev handoff, hot potato | `/handoff` |

## Design Workflow

Apply experts in this order:

```
1. PHILOSOPHY   → /design      "What can we remove?"
2. PSYCHOLOGY   → /usability   "How will users understand this?"
3. GOALS        → /personas    "What goal does this serve? Eliminate excise."
4. STRUCTURE    → /components  "What components do we need?"
5. VISUAL       → /visual      "How should it look?"
6. TYPOGRAPHY   → /typography  "How does type create hierarchy?"
7. INTERACTION  → /interaction "How do users interact?"
8. PATTERNS     → /mobile      "How does mobile work?"
9. MOTION       → /motion      "How do things move?"
10. DATA VIZ    → /charts      "How do we show data?"
11. GOVERNANCE  → /tokens      "How do we document this?"
12. HANDOFF     → /handoff     "How do we ship this?"
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
    action: INVOKE `/components` then `/visual`

  - context: Designing forms
    action: INVOKE `/mobile` then `/usability`

  - context: Modals, dialogs, confirmations
    action: INVOKE `/personas` for goal-directed design

  - context: Adding animation
    action: INVOKE `/motion`

  - context: Data visualization
    action: INVOKE `/charts`

  - context: Mobile design
    action: INVOKE `/mobile` then `/interaction`

  - context: Design system documentation
    action: INVOKE `/tokens`

  - context: Handoff to development
    action: INVOKE `/handoff`
```

## Combined Score

Rate any UI against all 12 experts:

| Expert | Score (0-10) | Weight |
|--------|--------------|--------|
| design (simplicity) | | 12% |
| usability (affordances) | | 12% |
| personas (goal-directed) | | 12% |
| visual (minimalism) | | 10% |
| typography (hierarchy) | | 8% |
| motion (transitions) | | 5% |
| interaction (input) | | 8% |
| mobile (responsive) | | 10% |
| components (atomic) | | 10% |
| tokens (documentation) | | 5% |
| handoff (collaboration) | | 4% |
| charts (data viz) | | 4% |
| **Total** | | **100%** |

**Passing score: 70+**

## Integration with Other Canon

The UI/UX canon integrates with:

- **Visualization canon** (`/charts`, `/dashboards`, `/d3`, `/data-story`) - For data-heavy interfaces
- **Testing canon** - Accessibility testing, visual regression
- **Security canon** - Form security, input validation

## File Locations

```
canon/ui-ux/
├── README.md         (this file)
├── design/SKILL.md
├── usability/SKILL.md
├── personas/SKILL.md
├── visual/SKILL.md
├── typography/SKILL.md
├── motion/SKILL.md
├── interaction/SKILL.md
├── mobile/SKILL.md
├── components/SKILL.md
├── tokens/SKILL.md
└── handoff/SKILL.md

canon/visualization/
├── charts/SKILL.md    (shared with UI/UX)
├── dashboards/SKILL.md
├── d3/SKILL.md
└── data-story/SKILL.md
```
