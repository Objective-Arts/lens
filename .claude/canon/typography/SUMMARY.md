# /typography Summary

> "Typography IS the interface."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Content first** | Chrome should be invisible |
| **Type as UI** | Size = hierarchy, weight = emphasis, space = grouping |
| **No decoration** | Type alone creates all hierarchy |

## Type Scale

```css
--text-base: 16px;  /* Body (never smaller) */
--text-lg: 18px;    /* Lead paragraphs */
--text-xl: 20px;    /* H4, card titles */
--text-2xl: 24px;   /* H3, section headers */
--text-3xl: 30px;   /* H2 */
--text-4xl: 36px;   /* H1 */
```

## Line Length

```css
.prose {
  max-width: 65ch;  /* 45-75 chars optimal */
}
```

## Weight Rules

```css
--font-normal: 400;    /* Body */
--font-medium: 500;    /* Labels */
--font-semibold: 600;  /* Headings */

/* Skip weights: 400 → 600, not 400 → 500 */
```

## Text Color

```css
--text-primary: #1f2937;   /* Headings */
--text-secondary: #4b5563; /* Body */
--text-tertiary: #6b7280;  /* Less important */

/* Never use #000000 */
```

## Anti-Patterns

| Bad | Fix |
|-----|-----|
| 13px body text | 16px minimum |
| Full-width paragraphs | max-width: 65ch |
| Many font weights | 3 weights max |
| Pure black text | Use #1f2937 |
| All caps buttons | Sentence case |

## The Test

Remove all boxes, borders, colors. Does type alone still create hierarchy?

## When to Use

- Typography systems
- Content-first design
- Fluent/Metro style interfaces

## Concrete Checks (MUST ANSWER)

- [ ] Is a type scale defined with explicit size tokens, and is body text at least 16px?
- [ ] Are all prose/content containers constrained to 45-75 characters line length (e.g., `max-width: 65ch`)?
- [ ] Is vertical rhythm consistent -- do all spacing values between text elements use the same base unit or multiples of it?
- [ ] Are no more than 3 font weights used across the entire interface?
- [ ] Does the hierarchy pass the squint test -- with all color and borders removed, can you identify heading levels by type alone?
