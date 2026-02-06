# /interaction Summary

> "Design for how humans actually interact with devices."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Sketching UX** | Low fidelity early, multiple alternatives |
| **Input fundamentals** | Every device has strengths/weaknesses |
| **Long nose of innovation** | Don't force novel interactions |

## Touch Constraints

```css
/* Minimum 44px touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 8px minimum gap between targets */
```

## Fitts's Law

Time = distance / size

- Large targets are faster
- Close targets are faster
- Screen edges are infinite size
- Put common actions near content

## Thumb Zones (Mobile)

```
Top:    Hard to reach → Nav, settings
Middle: Natural reach → Content
Bottom: Easy (thumb) → Primary actions
```

## Multi-Input Design

```css
/* Hover for mouse */
.button:hover { background: var(--hover); }

/* Touch: no hover */
@media (hover: none) {
  .button:hover { background: inherit; }
}

/* Active works for both */
.button:active { background: var(--active); }
```

## Gesture Rules

- Every gesture must have a visible alternative (button/menu)
- Tap for primary action
- Long press for context menu (never primary)
- Swipe for delete/nav (always provide button alternative)

## When to Use

- Mobile/touch interface design
- Cross-platform input handling
- Accessibility considerations
