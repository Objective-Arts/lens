# /frost Summary

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

## Checklist

- [ ] Components categorized (atom/molecule/organism)
- [ ] No component depends on its parent
- [ ] Variants exist instead of one-off styles
- [ ] All values use design tokens
- [ ] Naming follows BEM convention
