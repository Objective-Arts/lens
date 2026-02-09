# /components Summary

> "Design the components, not the pages. Pages are just assemblies."

## Atomic Hierarchy

```
ATOMS (HTML elements)     →  button, input, label, icon
    ↓
MOLECULES (simple groups) →  search-field, form-field, card
    ↓
ORGANISMS (sections)      →  header, footer, product-grid
    ↓
TEMPLATES (layouts)       →  article-template, dashboard-layout
    ↓
PAGES (templates + data)  →  actual rendered content
```

## File Structure

```
components/
├── atoms/       (button, input, label, icon)
├── molecules/   (search-field, form-field)
├── organisms/   (header, footer, product-grid)
├── templates/   (article, dashboard)
└── pages/
```

## Naming (BEM)

```css
.card              /* Block */
.card__title       /* Element */
.card--featured    /* Modifier */

Atoms:     single word (button, input)
Molecules: two words (search-field, form-field)
Organisms: descriptive (site-header, product-grid)
```

## Rules

| Rule | Bad | Good |
|------|-----|------|
| Independence | `.sidebar .card { }` | `.card--compact { }` |
| Props over hardcode | `<button>Submit</button>` | `<button>{{ label }}</button>` |
| Variants over one-offs | `.special-checkout-btn` | `.btn--success` |
| Tokens over values | `padding: 12px` | `padding: var(--space-3)` |

## Load Full Skill When

- Building a new design system
- Auditing existing components
- Component naming debates
- Setting up Storybook

## Concrete Checks (MUST ANSWER)

- [ ] Does every atom component contain zero business logic -- no API calls, no conditional rendering based on application state, no imported services or stores?
- [ ] Does every molecule compose only atoms (and native HTML elements) -- not importing or rendering other molecules or organisms?
- [ ] Does every template component contain only layout (grid, flex, spacing) with slot/children placeholders -- zero hardcoded content, zero data fetching, zero business logic?
- [ ] Does every component use design tokens (`var(--space-3)`, `var(--color-primary)`) for all spacing, color, and typography values -- zero hardcoded `px`, hex, or `rem` values?
- [ ] Can every component render in isolation (e.g., in Storybook) without requiring a specific parent component or global state?
