---
name: components
description: "Atomic Design - atoms, molecules, organisms, templates, pages"
---

# Brad Frost - Atomic Design

Build design systems from small, reusable pieces. Components compose into larger patterns.

## Core Philosophy

### Atoms → Molecules → Organisms → Templates → Pages

Each level builds on the previous:

```
ATOMS (HTML elements + styles)
  ↓
MOLECULES (simple component groups)
  ↓
ORGANISMS (complex, standalone sections)
  ↓
TEMPLATES (page layouts, content-agnostic)
  ↓
PAGES (templates + real content)
```

### Interface Inventory First
Before building, catalog what exists. Consistency comes from constraint.

### The System, Not the Page
Design the components, not the pages. Pages are just assemblies.

## The Levels

### Atoms
Smallest units. Cannot be broken down further.

```html
<!-- Button atom -->
<button class="btn btn-primary">Label</button>

<!-- Input atom -->
<input type="text" class="input" placeholder="Enter text">

<!-- Label atom -->
<label class="label">Field name</label>

<!-- Icon atom -->
<svg class="icon icon-search">...</svg>
```

### Molecules
Groups of atoms functioning together as a unit.

```html
<!-- Search molecule: input + button + icon -->
<div class="search-field">
  <svg class="icon icon-search"></svg>
  <input type="search" class="input" placeholder="Search...">
  <button class="btn btn-primary">Search</button>
</div>

<!-- Form field molecule: label + input + error -->
<div class="form-field">
  <label class="label" for="email">Email</label>
  <input class="input" type="email" id="email">
  <span class="error-message">Please enter a valid email</span>
</div>
```

### Organisms
Complex components that form a distinct section of interface.

```html
<!-- Header organism -->
<header class="site-header">
  <a href="/" class="logo">Logo</a>
  <nav class="main-nav">
    <a href="/products">Products</a>
    <a href="/about">About</a>
  </nav>
  <div class="search-field">...</div>
  <div class="user-menu">...</div>
</header>

<!-- Card organism -->
<article class="card">
  <img class="card-image" src="..." alt="...">
  <div class="card-body">
    <h3 class="card-title">Title</h3>
    <p class="card-description">Description text...</p>
    <button class="btn btn-primary">Action</button>
  </div>
</article>
```

### Templates
Page layouts without real content. Structure, not data.

```html
<!-- Article template -->
<main class="article-template">
  <header class="article-header">
    <h1>{{ title }}</h1>
    <p class="byline">By {{ author }} on {{ date }}</p>
  </header>
  <article class="article-body">
    {{ content }}
  </article>
  <aside class="article-sidebar">
    {{ relatedPosts }}
  </aside>
</main>
```

### Pages
Templates with real content. Where everything comes together.

```html
<!-- Article page (template + data) -->
<main class="article-template">
  <header class="article-header">
    <h1>How to Build Design Systems</h1>
    <p class="byline">By Brad Frost on January 15, 2024</p>
  </header>
  <article class="article-body">
    <p>Design systems help teams work more efficiently...</p>
  </article>
  <aside class="article-sidebar">
    <h4>Related Posts</h4>
    <ul>
      <li><a href="/atomic-design">Atomic Design</a></li>
    </ul>
  </aside>
</main>
```

## Component Structure

### File Organization

```
components/
├── atoms/
│   ├── button/
│   │   ├── button.html
│   │   ├── button.css
│   │   └── button.stories.js
│   ├── input/
│   ├── label/
│   └── icon/
├── molecules/
│   ├── search-field/
│   ├── form-field/
│   └── card/
├── organisms/
│   ├── header/
│   ├── footer/
│   └── product-grid/
├── templates/
│   ├── article/
│   ├── product-list/
│   └── dashboard/
└── pages/
    └── (assembled from templates)
```

### Component Specification

Each component needs:

```yaml
# button.yml
name: components
description: Primary action element
category: atoms

variants:
  - primary
  - secondary
  - ghost
  - destructive

states:
  - default
  - hover
  - active
  - disabled
  - loading

props:
  - name: label
    type: string
    required: true
  - name: variant
    type: enum
    default: primary
  - name: disabled
    type: boolean
    default: false

usage: |
  Use primary buttons for main actions (one per view).
  Use secondary for alternate actions.
  Use destructive for delete/remove actions.

accessibility:
  - Requires visible focus state
  - Loading state needs aria-busy="true"
  - Disabled buttons should use aria-disabled
```

## Prescriptive Rules

### Naming Convention

```
Block__Element--Modifier (BEM)

.card              /* Block */
.card__title       /* Element */
.card--featured    /* Modifier */

Rules:
- Atoms: single word (button, input, label)
- Molecules: two words (search-field, form-field)
- Organisms: descriptive (site-header, product-grid)
```

### Component Independence

```css
/* BAD: Component depends on parent */
.sidebar .card {
  width: 100%;
}

/* GOOD: Component is self-contained */
.card--compact {
  width: 100%;
}
```

### Props Over Hardcoding

```html
<!-- BAD: Hardcoded content -->
<button class="btn">Submit</button>

<!-- GOOD: Prop-driven -->
<button class="btn">{{ label }}</button>
```

### Variants Over One-offs

```css
/* BAD: One-off style */
.special-button-for-checkout {
  background: green;
}

/* GOOD: Variant of existing component */
.btn--success {
  background: var(--success);
}
```

## Design Token Integration

```css
/* Atoms use tokens, not raw values */
.btn {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
}
```

## Review Checklist

- [ ] Components are categorized (atom/molecule/organism)
- [ ] No component depends on its parent
- [ ] Variants exist instead of one-off styles
- [ ] All values use design tokens
- [ ] Each component has clear documentation
- [ ] Components are tested in isolation
- [ ] Naming follows BEM convention

## Component Inventory

Before designing new:

1. **Audit existing** - Screenshot every unique component
2. **Categorize** - Sort into atom/molecule/organism
3. **Deduplicate** - Merge similar components
4. **Name consistently** - One name per concept
5. **Document** - Create specification for each

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Page-specific styles | Not reusable | Create component variant |
| Deep nesting | Fragile, hard to override | Flatten with BEM |
| Magic numbers | Inconsistent | Use design tokens |
| Inline styles | Can't track/update | Use component classes |
| Copy-paste components | Drift over time | Single source of truth |

## Frost Score

| Score | Meaning |
|-------|---------|
| 10 | Full atomic system, components compose cleanly |
| 7-9 | Good component structure, minor inconsistencies |
| 4-6 | Components exist but poorly organized |
| 0-3 | Page-based thinking, no reusable components |

## Integration

Combine with:
- `/visual` - Visual design language components implement
- `/typography` - Typography system within components
- `/tokens` - Governance for component maintenance
- `/handoff` - Handoff of components to developers
