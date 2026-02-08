---
name: motion
description: "Material motion - meaningful animation, physical metaphors"
---

# Matías Duarte - Motion Design

Animation is not decoration. Motion communicates relationships, hierarchy, and state changes.

## Core Philosophy

### Motion is Meaning
Every animation must answer: "What does this motion communicate?"

If the answer is "it looks cool" - remove it.

### Physical Metaphors
Digital objects should feel like they have mass and respond to physics:
- Heavy objects move slower
- Light objects move faster
- Objects accelerate and decelerate (no linear motion)
- Objects don't teleport - they travel through space

### Choreography
Multiple moving elements must be coordinated:
- Staggered, not simultaneous
- Parent leads, children follow
- Same direction = same intent

## Motion Principles

### 1. Responsive
Acknowledge user input instantly.

```css
/* Button feedback - immediate */
.button:active {
  transform: scale(0.98);
  transition: transform 0.05s ease-out;
}
```

### 2. Natural
Use easing that mimics physical objects.

```css
/* Standard easing curves */
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);     /* Decelerate - entering */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);        /* Accelerate - exiting */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);  /* Both - on-screen moves */

/* NEVER use linear for UI motion */
```

### 3. Aware
Elements know about each other.

```css
/* Card expand: other cards move away */
.card.expanded ~ .card {
  transform: translateY(100px);
  transition: transform 0.3s var(--ease-out);
}
```

### 4. Intentional
Motion creates hierarchy and focus.

```css
/* Important elements arrive first, leave last */
.modal {
  animation: modal-enter 0.3s var(--ease-out);
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}
```

## Prescriptive Rules

### Duration Scale

```css
/* Based on travel distance and importance */
--duration-instant: 50ms;    /* Micro-interactions (button press) */
--duration-fast: 150ms;      /* Small movements (hover states) */
--duration-normal: 300ms;    /* Standard transitions (cards, modals) */
--duration-slow: 500ms;      /* Large movements (page transitions) */

/* Rule: Nothing over 500ms except loading/progress indicators */
/* Rule: Faster is almost always better */
```

### Easing Usage

| Motion Type | Easing | Duration |
|-------------|--------|----------|
| Element entering | ease-out | 300ms |
| Element exiting | ease-in | 200ms |
| Element moving on-screen | ease-in-out | 300ms |
| Hover state | ease-out | 150ms |
| Button press | ease-out | 50ms |

### Transform Order

```css
/* Combine transforms in this order for natural motion */
.element {
  transform: translate() scale() rotate();
}

/* Scale from center (default) or transform-origin for cards */
.card {
  transform-origin: center center;
}
```

### Stagger Pattern

```javascript
// List items enter staggered
items.forEach((item, i) => {
  item.style.animationDelay = `${i * 50}ms`;
});

// Rule: 50ms delay between items (max 500ms total)
// After 10 items, enter remaining simultaneously
```

### Enter/Exit Asymmetry

```css
/* Enter: slower, more elaborate */
.modal-enter {
  animation: fade-in 0.3s ease-out,
             slide-up 0.3s ease-out;
}

/* Exit: faster, simpler */
.modal-exit {
  animation: fade-out 0.2s ease-in;
}

/* Rule: Exit is always faster than enter */
/* Rule: Exit uses fewer properties than enter */
```

## Common Patterns

### Fade
```css
.fade-enter {
  opacity: 0;
  animation: fade-in 0.2s ease-out forwards;
}

@keyframes fade-in {
  to { opacity: 1; }
}
```

### Slide
```css
.slide-enter {
  transform: translateY(20px);
  opacity: 0;
  animation: slide-in 0.3s ease-out forwards;
}

@keyframes slide-in {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### Scale
```css
.scale-enter {
  transform: scale(0.95);
  opacity: 0;
  animation: scale-in 0.2s ease-out forwards;
}

@keyframes scale-in {
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

### Expand/Collapse
```css
.expandable {
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.expandable.closed {
  max-height: 0;
}

.expandable.open {
  max-height: 500px; /* Must be greater than content */
}
```

## When NOT to Animate

- User has `prefers-reduced-motion` enabled
- Repeated actions (don't animate every keystroke)
- Background/utility actions (auto-save)
- When animation would delay task completion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Review Checklist

- [ ] No animation over 500ms
- [ ] No linear easing on UI elements
- [ ] Enter animations longer than exit
- [ ] Stagger delay is 50ms, max 500ms total
- [ ] prefers-reduced-motion is respected
- [ ] Every animation has a communicative purpose
- [ ] Related elements animate together

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Linear easing | Robotic, unnatural | Use ease-out/ease-in |
| > 500ms duration | Feels slow, blocking | Speed up |
| Bounce/elastic | Playful but distracting | Simple ease curves |
| Animation on scroll | Janky, performance issue | Use sparingly |
| Animation blocking input | Frustrating | Allow interruption |
| Same duration in/out | Exit should be faster | Asymmetric timing |

## Duarte Score

| Score | Meaning |
|-------|---------|
| 10 | Motion is communication, never decoration |
| 7-9 | Purposeful but some unnecessary animation |
| 4-6 | Decorative animation, inconsistent timing |
| 0-3 | Distracting, janky, or blocks interaction |

## Integration

Combine with:
- `/visual` - Material properties that motion must respect
- `/usability` - Feedback timing requirements
- `/interaction` - Input response expectations
