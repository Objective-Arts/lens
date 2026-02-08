---
name: interaction
description: "Interaction design - input fundamentals, sketching UX"
---

# Bill Buxton - Interaction Design

Design for how humans actually interact with devices. Input is not an afterthought.

## Core Philosophy

### Sketching UX
Design is exploration. Sketches are not deliverables - they're thinking tools.

**Rules:**
- Low fidelity early (paper, whiteboard)
- Multiple alternatives, not one solution
- Test interactions, not visuals
- Discard freely (sketches are cheap)

### Input Fundamentals
Every input device has strengths and weaknesses. Design for the device.

### The Long Nose of Innovation
New interactions take decades from invention to mainstream. Don't force novel interactions on users.

## Input Characteristics

### Touch (Mobile/Tablet)

**Constraints:**
- Finger is 44px minimum target
- No hover state exists
- Two hands: thumbs reach zones
- One hand: bottom half only
- Fat finger problem: imprecise

**Rules:**
```css
/* Touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;  /* Generous padding */
}

/* Spacing between targets */
.button + .button {
  margin-left: 8px;  /* Minimum 8px gap */
}
```

### Mouse (Desktop)

**Constraints:**
- Precise but requires movement
- Hover exists and is expected
- Right-click context menus
- Scroll wheel for fast navigation

**Rules:**
```css
/* Hover states are mandatory */
.clickable:hover {
  background: var(--hover-bg);
}

/* Smaller targets acceptable */
.desktop-button {
  min-height: 32px;  /* Can be smaller than touch */
}
```

### Keyboard

**Constraints:**
- Fastest for experts
- Tab order matters
- Focus must be visible
- Shortcuts expected for power users

**Rules:**
```css
/* Focus must be visible (never outline: none without replacement) */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Tab order: logical, top-to-bottom, left-to-right */
```

## Fitts's Law

Time to reach a target depends on distance and size.

```
Time = a + b * log2(Distance/Size + 1)
```

**Implications:**
1. Large targets are faster (make primary actions big)
2. Close targets are faster (group related actions)
3. Edge/corner targets are infinite size (use screen edges)
4. Reduce travel distance (put actions near cursor)

**Rules:**
- Primary action: largest button
- Related actions: grouped together
- Common actions: near content
- Dangerous actions: away from common actions

## Thumb Zones (Mobile)

```
┌─────────────────────────┐
│      Hard to reach      │  ← Nav, settings
│                         │
│    ──────────────────   │
│                         │
│     Natural reach       │  ← Primary content
│                         │
│    ──────────────────   │
│                         │
│      Easy (thumb)       │  ← Primary actions
└─────────────────────────┘
```

**Rules:**
- Primary actions: bottom 1/3
- Content: middle 1/2
- Navigation: top (or bottom sheet)
- Destructive actions: not in easy zone

## Prescriptive Patterns

### Mobile Navigation
```html
<!-- Bottom navigation for primary actions -->
<nav class="fixed bottom-0 left-0 right-0">
  <a href="/" class="touch-target">Home</a>
  <a href="/search" class="touch-target">Search</a>
  <a href="/profile" class="touch-target">Profile</a>
</nav>
```

### Form Input
```html
<!-- Input + action in thumb zone -->
<div class="fixed bottom-0 left-0 right-0 p-4">
  <input type="text" class="w-full touch-target" />
  <button class="touch-target primary">Send</button>
</div>
```

### Confirmation Dialogs
```html
<!-- Destructive action away from confirm -->
<div class="dialog-actions">
  <button class="cancel">Cancel</button>
  <!-- Gap prevents accidental tap -->
  <button class="destructive">Delete</button>
</div>
```

## Multi-Input Design

Modern devices support multiple inputs. Design for all.

```css
/* Hover for mouse, active for touch */
.button:hover {
  background: var(--hover);
}

@media (hover: none) {
  /* Touch device: no hover state */
  .button:hover {
    background: inherit;
  }
}

.button:active {
  background: var(--active);  /* Works for both */
}
```

## Gesture Guidelines

| Gesture | Use For | Don't Use For |
|---------|---------|---------------|
| Tap | Primary action | (always works) |
| Long press | Context menu | Primary actions |
| Swipe | Delete, navigation | Required actions |
| Pinch | Zoom | (keep default behavior) |
| Drag | Reorder, move | (always provide alternative) |

**Rule:** Every gesture must have a visible alternative (button/menu).

## Accessibility

Input diversity includes assistive technology.

```html
<!-- Screen reader + keyboard accessible -->
<button
  aria-label="Delete item"
  tabindex="0"
  role="button"
  onkeydown="if(event.key==='Enter') handleDelete()"
>
  <svg aria-hidden="true">...</svg>
</button>
```

## Review Checklist

- [ ] Touch targets are 44px minimum
- [ ] Primary actions in thumb zone (mobile)
- [ ] All interactions have visible alternatives
- [ ] Focus states are visible
- [ ] Tab order is logical
- [ ] Hover states exist (desktop)
- [ ] No hover-only functionality
- [ ] Gestures have button alternatives

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| 24px buttons | Can't tap accurately | 44px minimum |
| Hover-only menus | Unusable on touch | Tap to open |
| Removing focus outline | Unusable with keyboard | Style it, don't remove |
| Swipe-only delete | Hidden, no undo | Add delete button |
| Close buttons in corners | Hard to reach | Larger target, visible |

## Buxton Score

| Score | Meaning |
|-------|---------|
| 10 | Works perfectly with all input types |
| 7-9 | Minor input-specific issues |
| 4-6 | One input type clearly favored |
| 0-3 | Unusable with some input types |

## Integration

Combine with:
- `/usability` - Affordances that signal input methods
- `/mobile` - Mobile-first input patterns
- `/motion` - Feedback motion for input acknowledgment
