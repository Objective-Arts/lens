---
name: typography
description: "Typography-first design - type hierarchy, Fluent principles"
---

# Mike Kruzeniski - Typography

Typography is not decoration - it IS the interface. Type-first design means hierarchy through type alone.

## Core Philosophy

### Content First
The content is the interface. Chrome (buttons, borders, containers) should be invisible.

### Type as UI
Well-designed typography eliminates the need for visual chrome:
- Size creates hierarchy (no boxes needed)
- Weight creates emphasis (no colors needed)
- Space creates grouping (no borders needed)

### Metro/Fluent Principles
- Clean, light, fast
- Celebrate typography
- Content over chrome
- Authentically digital (not skeuomorphic)

## The Type System

### Font Stack

```css
/* System fonts - fast, native, consistent */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;

/* Monospace for code */
--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;

/* Rule: Never use more than 2 font families */
/* Rule: Prefer system fonts over web fonts (faster, native feel) */
```

### Type Scale

```css
/* Perfect Fourth scale (1.333 ratio) - harmonious */
--text-xs: 12px;    /* Captions, timestamps */
--text-sm: 14px;    /* Secondary text, labels */
--text-base: 16px;  /* Body text (never smaller) */
--text-lg: 18px;    /* Lead paragraphs */
--text-xl: 20px;    /* H4, card titles */
--text-2xl: 24px;   /* H3, section headers */
--text-3xl: 30px;   /* H2, page sections */
--text-4xl: 36px;   /* H1, page titles */
--text-5xl: 48px;   /* Display, heroes */
```

### Line Height

```css
/* Tighter for headings, looser for body */
--leading-none: 1;       /* Display text only */
--leading-tight: 1.25;   /* Headings */
--leading-normal: 1.5;   /* Body text (minimum) */
--leading-relaxed: 1.625; /* Long-form reading */
--leading-loose: 2;      /* Legal, fine print */
```

### Font Weight

```css
/* Meaningful weight differences */
--font-normal: 400;    /* Body text */
--font-medium: 500;    /* Labels, nav items */
--font-semibold: 600;  /* Headings, emphasis */
--font-bold: 700;      /* Rare: hero text only */

/* Rule: Skip weights (400 → 600), not adjacent (400 → 500) */
/* Small weight changes are invisible */
```

### Letter Spacing

```css
/* Tighten large text, leave small text alone */
.display { letter-spacing: -0.02em; }  /* 48px+ */
.heading { letter-spacing: -0.01em; }  /* 24-36px */
.body { letter-spacing: 0; }           /* 14-20px */
.small { letter-spacing: 0.01em; }     /* 12px */
.caps { letter-spacing: 0.05em; }      /* All caps needs space */
```

## Prescriptive Rules

### Hierarchy Through Type Alone

```html
<!-- BAD: Using boxes and colors for hierarchy -->
<div class="card with-border blue-header">
  <h3 class="blue-text">Title</h3>
  <p>Content</p>
</div>

<!-- GOOD: Type alone creates hierarchy -->
<article>
  <h3 class="text-xl font-semibold">Title</h3>
  <p class="text-base text-gray-600">Content</p>
</article>
```

### Spacing with Type

```css
/* Space after headings = smaller than space before */
h2 {
  margin-top: 48px;    /* Big gap before (new section) */
  margin-bottom: 16px; /* Small gap after (connected to content) */
}

/* Paragraphs */
p + p {
  margin-top: 16px;    /* Consistent paragraph spacing */
}
```

### Maximum Line Length

```css
/* Optimal reading: 45-75 characters per line */
.prose {
  max-width: 65ch;  /* ch = width of '0' character */
}

/* Rule: ALWAYS constrain body text width */
/* Full-width text is exhausting to read */
```

### Text Color

```css
/* Not pure black - too harsh */
--text-primary: #1f2937;   /* Headings, important */
--text-secondary: #4b5563; /* Body text */
--text-tertiary: #6b7280;  /* Less important */
--text-muted: #9ca3af;     /* Timestamps, hints */

/* Rule: Never use #000000 for text */
/* Rule: Body text should be secondary, not primary */
```

## Component Typography

### Buttons
```css
.button {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: none;  /* Not uppercase */
}
```

### Form Labels
```css
.label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
```

### Navigation
```css
.nav-item {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.nav-item.active {
  font-weight: 600;
  color: var(--text-primary);
}
```

### Data Tables
```css
.table-header {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.table-cell {
  font-size: 14px;
  font-weight: 400;
}
```

## Review Checklist

- [ ] Maximum 2 font families
- [ ] Body text is 16px minimum
- [ ] Line length under 75 characters
- [ ] Headings have negative letter-spacing
- [ ] Weight jumps are visible (skip 500 between 400 and 600)
- [ ] Text is not pure black (#000)
- [ ] Type alone creates hierarchy (remove boxes, does it still work?)

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| 13px body text | Too small, fails accessibility | 16px minimum |
| Full-width paragraphs | Exhausting to read | max-width: 65ch |
| Many font weights | Muddy hierarchy | 3 weights max |
| Pure black text | Harsh, vibrates | Use #1f2937 |
| All caps buttons | Aggressive, dated | Sentence case |
| Decorative fonts | Reduces readability | System fonts |

## Kruzeniski Score

| Score | Meaning |
|-------|---------|
| 10 | Typography alone creates all hierarchy |
| 7-9 | Mostly type-driven, some unnecessary chrome |
| 4-6 | Relies on boxes/colors instead of type |
| 0-3 | Typography is an afterthought |

## Integration

Combine with:
- `/visual` - Visual system that type lives within
- `/design` - Philosophy of "less but better" applies to fonts too
- `/components` - Components built on this type system
