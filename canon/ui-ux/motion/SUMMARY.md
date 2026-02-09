# /motion Summary

> "Animation is not decoration. Motion communicates."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Motion is meaning** | If it's just "cool" - remove it |
| **Physical metaphors** | Heavy = slow, light = fast, no teleporting |
| **Choreography** | Staggered, parent leads children |

## Duration Scale

```css
--duration-instant: 50ms;   /* Button press */
--duration-fast: 150ms;     /* Hover states */
--duration-normal: 300ms;   /* Cards, modals */
--duration-slow: 500ms;     /* Page transitions */

/* Nothing over 500ms except loading indicators */
```

## Easing Rules

```css
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);    /* Entering */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);       /* Exiting */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1); /* On-screen moves */

/* NEVER use linear for UI motion */
```

## Enter/Exit Asymmetry

```css
/* Enter: slower, more elaborate */
.modal-enter { animation: fade-in 0.3s ease-out; }

/* Exit: faster, simpler */
.modal-exit { animation: fade-out 0.2s ease-in; }
```

## Stagger Pattern

```javascript
items.forEach((item, i) => {
  item.style.animationDelay = `${i * 50}ms`;
});
// 50ms between items, max 500ms total
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

## Anti-Patterns

| Bad | Fix |
|-----|-----|
| Linear easing | Use ease-out/ease-in |
| > 500ms duration | Speed up |
| Bounce/elastic | Simple ease curves |
| Same in/out timing | Exit faster than enter |

## When to Use

- UI animation design
- Transition timing
- Motion choreography

## Concrete Checks (MUST ANSWER)

- [ ] Is every animation duration 300ms or less for standard UI transitions (only page transitions may reach 500ms)?
- [ ] Does each animation communicate a specific hierarchy change, state change, or spatial relationship (not purely decorative)?
- [ ] Is `@media (prefers-reduced-motion: reduce)` handled, either removing or replacing every animation?
- [ ] Are exit animations faster than their corresponding enter animations (asymmetric timing)?
- [ ] Is `linear` easing absent from all UI motion (ease-out for enter, ease-in for exit, ease-in-out for on-screen moves)?
