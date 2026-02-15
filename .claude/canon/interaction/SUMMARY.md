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

## Concrete Checks (MUST ANSWER)

- [ ] Does every user-initiated action (button click, form submit, toggle) produce visible feedback within 100ms (spinner, state change, animation, or disabled state)?
- [ ] Does every destructive action (delete, discard, overwrite) either require confirmation or provide an undo mechanism with a minimum 5-second window?
- [ ] Does every operation that takes >100ms show a loading indicator, and every operation >1 second show a progress indicator or skeleton screen?
- [ ] Does every gesture-based interaction (swipe, long-press, drag) have a visible button or menu alternative that performs the same action?
- [ ] Are all interactive elements reachable in the bottom 60% of the screen (thumb zone) on mobile, with infrequent actions placed in the top 40%?
