# /visual Summary

> "The best designs feel inevitable - like there's no other way it could have been."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Inevitability** | If it could be simpler, it's not done |
| **Material honesty** | Glass blurs, paper casts shadows, buttons depress |
| **Depth hierarchy** | Background → Content → Interactive → Overlays → Alerts |

## Shadow System

```css
--shadow-1: 0 1px 2px rgba(0,0,0,0.05);    /* Cards at rest */
--shadow-2: 0 4px 6px rgba(0,0,0,0.07);    /* Hover, dropdowns */
--shadow-3: 0 10px 15px rgba(0,0,0,0.1);   /* Modals */
--shadow-4: 0 20px 25px rgba(0,0,0,0.15);  /* Popovers */
```

## Color Discipline

```css
/* 90% of UI = grayscale */
--gray-500: #6b7280;  /* Secondary text */
--gray-600: #4b5563;  /* Body text */

/* ONE accent color, used sparingly */
--accent: #3b82f6;

/* Fixed semantic colors */
--success: #10b981;
--error: #ef4444;
```

## Border Radius Scale

```css
--radius-sm: 4px;    /* Buttons, inputs */
--radius-md: 8px;    /* Cards */
--radius-lg: 12px;   /* Modals */

/* Nested elements decrease radius */
```

## Anti-Patterns

| Bad | Fix |
|-----|-----|
| Gradient buttons | Solid accent color |
| Multiple accents | Pick one |
| Heavy shadows | Subtle shadows |
| Colorful icons | Monochrome |

## When to Use

- Visual design systems
- Color and shadow decisions
- Creating consistent UI
