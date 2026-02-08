---
name: visual
description: "Visual design - minimalism, material honesty, depth"
---

# Jony Ive - Visual Design

Create interfaces with intentional restraint, material honesty, and meaningful depth.

## Core Philosophy

### Inevitability
The best designs feel inevitable - like there's no other way it could have been.

**Test:** Look at your design and ask "Could this be simpler?" If yes, it's not done.

### Material Honesty
Digital materials should behave consistently.

**Rules:**
- Glass blurs what's behind it
- Paper casts shadows
- Buttons depress when pressed
- Cards lift when dragged
- Don't mix metaphors (skeuomorphism is dead, but physics isn't)

### Depth and Hierarchy
Use depth to show relationships and importance.

**Layers (bottom to top):**
1. Background (static, muted)
2. Content surface (cards, panels)
3. Interactive elements (buttons, inputs)
4. Overlays (modals, dropdowns)
5. Alerts (toasts, notifications)

## Prescriptive Rules

### Shadow System

```css
/* Elevation levels */
--shadow-1: 0 1px 2px rgba(0, 0, 0, 0.05);     /* Cards at rest */
--shadow-2: 0 4px 6px rgba(0, 0, 0, 0.07);     /* Hover, dropdowns */
--shadow-3: 0 10px 15px rgba(0, 0, 0, 0.1);    /* Modals, dialogs */
--shadow-4: 0 20px 25px rgba(0, 0, 0, 0.15);   /* Popovers */

/* Usage */
.card { box-shadow: var(--shadow-1); }
.card:hover { box-shadow: var(--shadow-2); }
.modal { box-shadow: var(--shadow-3); }
```

### Color Palette

```css
/* Neutral scale (use for 90% of UI) */
--gray-50: #f9fafb;   /* Backgrounds */
--gray-100: #f3f4f6;  /* Alt backgrounds */
--gray-200: #e5e7eb;  /* Borders, dividers */
--gray-300: #d1d5db;  /* Disabled borders */
--gray-400: #9ca3af;  /* Placeholder text */
--gray-500: #6b7280;  /* Secondary text */
--gray-600: #4b5563;  /* Body text */
--gray-700: #374151;  /* Headings */
--gray-800: #1f2937;  /* High contrast text */
--gray-900: #111827;  /* Maximum contrast */

/* Accent (ONE color, used sparingly) */
--accent: #3b82f6;        /* Primary actions */
--accent-hover: #2563eb;  /* Hover state */
--accent-light: #eff6ff;  /* Backgrounds, badges */

/* Semantic (fixed meanings) */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

### Border Radius

```css
/* Consistent radius scale */
--radius-sm: 4px;   /* Buttons, inputs, chips */
--radius-md: 8px;   /* Cards, panels */
--radius-lg: 12px;  /* Modals, large cards */
--radius-xl: 16px;  /* Feature cards */
--radius-full: 9999px;  /* Pills, avatars */

/* Rule: Nested elements decrease radius */
.card { border-radius: var(--radius-md); }          /* 8px */
.card .button { border-radius: var(--radius-sm); }  /* 4px */
```

### Background Treatments

```css
/* Subtle texture without noise */
.surface-primary {
  background: #ffffff;
}

.surface-secondary {
  background: #f9fafb;
}

/* Blur for overlays (glassmorphism, used sparingly) */
.overlay {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

/* NEVER use */
/* background-image: url(noise.png); */
/* Gradients on surfaces */
/* Patterns */
```

### Icon Style

```
- Stroke weight: 1.5px (consistent)
- Corner radius: 2px on corners
- Size: 20px or 24px (never between)
- Color: inherit from text color
- Style: Outlined (not filled) for most
- Filled: Only for selected/active states
```

## Visual Hierarchy

### Size Scale
```
Display: 48px / 56px (marketing only)
H1: 36px / 40px
H2: 30px / 36px
H3: 24px / 32px
H4: 20px / 28px
Body: 16px / 24px
Small: 14px / 20px
Caption: 12px / 16px
```

### Weight Usage
```
Regular (400): Body text, descriptions
Medium (500): Labels, navigation, subtle emphasis
Semibold (600): Headings, buttons, key values
Bold (700): Hero text only, use very sparingly
```

## Review Checklist

- [ ] Maximum 4 shadow levels in entire app
- [ ] One accent color throughout
- [ ] Consistent border radius (no mixing 4px and 5px)
- [ ] Gray scale used for 90%+ of UI
- [ ] No gradients on interactive elements
- [ ] Icons same stroke weight throughout
- [ ] Depth increases toward user attention

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Gradient buttons | Dated, less accessible | Solid accent color |
| Multiple accent colors | Confused hierarchy | Pick one |
| Heavy shadows | Looks dated, heavy | Use subtle shadows |
| Inconsistent radius | Unpolished feeling | Use radius scale |
| Colorful icons | Compete for attention | Monochrome, inherit color |

## Ive Score

| Score | Meaning |
|-------|---------|
| 10 | Inevitable, nothing extraneous |
| 7-9 | Clean but minor inconsistencies |
| 4-6 | Visual noise, unclear hierarchy |
| 0-3 | Chaotic, needs complete rethink |

## Integration

Combine with:
- `/design` - The "why" behind minimalism
- `/typography` - Typography that complements this visual system
- `/motion` - Motion that respects material properties
