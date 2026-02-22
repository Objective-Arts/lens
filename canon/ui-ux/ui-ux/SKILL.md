---
name: ui-ux
description: "Unified UI/UX design principles — 12 masters distilled into one actionable reference"
---

# UI/UX Design — Unified Reference

Distilled from 12 design masters: Norman (usability), Ive (visual), Frost (components), Rams (philosophy), Wroblewski (mobile), Duarte (motion), Buxton (interaction), Kruzeniski (typography), Curtis (tokens), Cooper (personas), Mall (collaboration), and modern frontend aesthetics.

## 1. Philosophy

**Less, but better** (Rams). Every element earns its place or gets removed.

- Users don't want to use software — they want to accomplish goals (Cooper)
- The interface must teach itself — no manuals (Norman)
- Design for perpetual intermediates: they know basics, won't read help, want efficiency (Cooper)
- If everything is bold, nothing is bold. One focal point per screen (Rams)
- "Could this be simpler?" If yes, it's not done (Ive)

**Polite software** (Cooper): remembers preferences, doesn't ask the same question twice, anticipates needs, admits mistakes gracefully, never blames the user.

**Eliminate excise** — work that doesn't advance the user's goal:

| Excise Type | Example | Fix |
|-------------|---------|-----|
| Navigation | 5 clicks for one task | Flatten, direct access |
| Input | Re-entering known data | Auto-fill, remember choices |
| Confirmation | "Are you sure?" for reversible actions | Undo instead |
| Output | Raw data the user must interpret | Present meaningful info |

## 2. Visual System

### Color

```css
/* Neutral scale — use for 90% of UI (Ive) */
--gray-50: #f9fafb;   /* Backgrounds */
--gray-100: #f3f4f6;  /* Alt backgrounds */
--gray-200: #e5e7eb;  /* Borders, dividers */
--gray-400: #9ca3af;  /* Placeholder text */
--gray-500: #6b7280;  /* Secondary text */
--gray-600: #4b5563;  /* Body text */
--gray-800: #1f2937;  /* Headings (not pure black) */

/* ONE accent color, used sparingly (Rams: max 3 colors) */
--accent: #3b82f6;
--accent-hover: #2563eb;
--accent-light: #eff6ff;

/* Semantic — fixed meanings */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

**Rules:** Never use `#000000` for text. Body text is `--gray-600`, not primary. One accent color throughout the entire app.

### Shadows (Elevation)

```css
--shadow-1: 0 1px 2px rgba(0, 0, 0, 0.05);   /* Cards at rest */
--shadow-2: 0 4px 6px rgba(0, 0, 0, 0.07);   /* Hover, dropdowns */
--shadow-3: 0 10px 15px rgba(0, 0, 0, 0.1);  /* Modals */
--shadow-4: 0 20px 25px rgba(0, 0, 0, 0.15); /* Popovers */
```

Depth layers bottom-to-top: background > content surface > interactive elements > overlays > alerts (Ive).

### Spacing

```css
/* 4px base unit — never use arbitrary values (Rams) */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;
--space-16: 64px;
```

### Border Radius

```css
--radius-sm: 4px;     /* Buttons, inputs */
--radius-md: 8px;     /* Cards, panels */
--radius-lg: 12px;    /* Modals */
--radius-full: 9999px; /* Pills, avatars */
/* Nested elements decrease radius (Ive) */
```

## 3. Typography

**Type IS the interface** (Kruzeniski). Well-designed typography eliminates need for visual chrome — size creates hierarchy, weight creates emphasis, space creates grouping.

### Type Scale

```css
--text-xs: 12px;   /* Captions, timestamps */
--text-sm: 14px;   /* Labels, secondary */
--text-base: 16px; /* Body (never smaller) */
--text-lg: 18px;   /* Lead paragraphs */
--text-xl: 20px;   /* H4, card titles */
--text-2xl: 24px;  /* H3, section headers */
--text-3xl: 30px;  /* H2 */
--text-4xl: 36px;  /* H1 */
--text-5xl: 48px;  /* Display/hero */
```

### Weight, Spacing, Color

```css
--font-normal: 400;   /* Body */
--font-medium: 500;   /* Labels, nav */
--font-semibold: 600; /* Headings */
--font-bold: 700;     /* Hero only, rare */

/* Line height: tighter for headings, looser for body */
--leading-tight: 1.25;  /* Headings */
--leading-normal: 1.5;  /* Body (minimum) */

/* Letter spacing: tighten large, widen small */
.display { letter-spacing: -0.02em; }
.heading { letter-spacing: -0.01em; }
.caps { letter-spacing: 0.05em; }
```

**Rules:**
- Max 2 font families (prefer system fonts)
- Skip weights: 400 → 600, not 400 → 500 (invisible difference)
- Constrain reading width: `max-width: 65ch`
- Space before heading > space after (Kruzeniski)
- Never use pure `#000000` for text

### Font Stack

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

## 4. Component Architecture

**Atomic Design** (Frost): atoms → molecules → organisms → templates → pages.

| Level | What | Example |
|-------|------|---------|
| Atoms | HTML elements + styles | Button, input, label, icon |
| Molecules | Simple component groups | Search field (icon + input + button) |
| Organisms | Complex standalone sections | Site header, product grid, card |
| Templates | Page layouts, content-agnostic | Article layout, dashboard shell |
| Pages | Templates + real content | The actual screen |

**Rules:**
- Components are self-contained — never depend on parent context
- Variants over one-offs: `.btn--success` not `.special-checkout-button`
- All values use design tokens, never raw numbers
- BEM naming: `.card` (block), `.card__title` (element), `.card--featured` (modifier)
- Every component needs: variants, states (default/hover/active/focus/disabled/loading), props, accessibility spec

### Design Tokens (Curtis)

```
Global → Semantic → Component

/* Global: raw values */
--color-blue-500: #3b82f6;

/* Semantic: purpose aliases */
--color-primary: var(--color-blue-500);

/* Component: specific usage */
--button-color: var(--color-primary);
```

Tokens are contracts. Changes break consumers. Version them semantically.

## 5. Interaction & Affordances

### Affordances (Norman)

- Buttons must look pressable (raised, colored, bounded)
- Links must look clickable (underlined or colored)
- Text fields must look editable (bordered, lighter background)
- Draggable items need grab handles
- Hover states reveal what's interactive
- Cursor changes signal interaction type

### Feedback Timing

| Action | Response Time | Type |
|--------|--------------|------|
| Button click | < 100ms | Visual state change |
| Form validation | On blur | Inline error |
| API call start | Immediate | Loading indicator |
| API call success | On complete | Auto-dismiss success |
| API call failure | On complete | Persistent error |

### Fitts's Law (Buxton)

Time to target = f(distance, size). Implications:
- Primary action: largest button
- Related actions: grouped together
- Common actions: near content
- Dangerous actions: away from common actions
- Screen edges are infinite-size targets — use them

### Touch Targets

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 8px minimum gap between targets */
.button + .button {
  margin-left: 8px;
}
```

### Focus & Keyboard

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
/* NEVER outline: none without replacement */
/* Tab order: logical, top-to-bottom, left-to-right */
```

### Errors (Norman)

**Bad:** "Error", "Invalid input", "Something went wrong"
**Good:** "Email must include @ symbol", "Password must be at least 8 characters"

Rules: say what went wrong, say how to fix it, place message near the problem, use red + icon (for colorblind users).

### Dialogs (Cooper)

- Centered + backdrop = unmistakably modal
- One decision per modal. No modal stacking.
- Use verb buttons ("Save", "Delete"), never "OK"
- Prefer undo over "Are you sure?"
- Progressive disclosure: 80% of users use 20% of features — make that 20% immediately accessible

## 6. Mobile & Forms

**Mobile first** (Wroblewski): start with smallest screen, then add. Desktop is mobile with more space.

### Responsive

```css
/* Base styles = mobile */
.container { padding: 16px; }

@media (min-width: 640px)  { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

| Mobile | Tablet | Desktop |
|--------|--------|---------|
| 1 column | 2 columns | 3-4 columns |
| Bottom nav | Bottom nav or sidebar | Sidebar |
| Full-width cards | Card grid | Card grid + filters |

### Thumb Zones

```
┌─────────────────────┐
│   Hard to reach     │  ← Settings, nav
│   Natural reach     │  ← Content
│   Easy (thumb)      │  ← Primary actions
└─────────────────────┘
```

Primary actions in bottom 1/3. Destructive actions NOT in easy zone.

### Forms

- Semantic input types: `email`, `tel`, `number`, `date` (triggers correct keyboard)
- Labels above inputs, never beside (narrow screens)
- Validate on blur, not on change
- Error messages below the field, specific, show valid example
- Don't clear input on error — let users fix
- Smart defaults: pre-fill what you can infer
- Reduce fields: `[Full name]` not `[First] [Last]`

### Bottom Navigation

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom); /* iPhone notch */
}
```

Max 5 items. Icons + labels (not just icons). Active state visible.

## 7. Motion

**Animation is communication, not decoration** (Duarte). If "it looks cool" is the reason — remove it.

### Duration Scale

```css
--duration-instant: 50ms;  /* Button press */
--duration-fast: 150ms;    /* Hover states */
--duration-normal: 300ms;  /* Cards, modals */
--duration-slow: 500ms;    /* Page transitions */
/* NOTHING over 500ms */
```

### Easing

```css
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);    /* Entering */
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);       /* Exiting */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1); /* On-screen moves */
/* NEVER linear for UI motion */
```

**Rules:**
- Enter: slower (300ms, ease-out). Exit: faster (200ms, ease-in).
- Stagger list items at 50ms intervals, max 500ms total
- Respect `prefers-reduced-motion`
- Physical metaphors: objects accelerate/decelerate, don't teleport

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 8. Accessibility

- Touch targets: 44px minimum
- Focus states: always visible, never removed
- Tab order: logical reading order
- Every gesture has a visible button alternative (Buxton)
- No hover-only functionality (touch devices have no hover)
- Color is never the only indicator (add icons for colorblind)
- `aria-label` on icon-only buttons
- Screen reader + keyboard accessible

```css
@media (hover: none) {
  /* Touch device — no hover effects */
  .button:hover { background: inherit; }
}
```

## 9. Distinctive Design

Avoid generic AI aesthetics (frontend-design):

**Never:** Inter/Roboto/Arial as defaults, purple gradients on white, predictable cookie-cutter layouts, same design every time.

**Instead:** Choose a bold aesthetic direction and execute with precision. Typography that has character. Dominant colors with sharp accents. Unexpected layouts — asymmetry, overlap, generous negative space. Atmosphere through gradient meshes, noise textures, layered transparencies.

Match implementation to vision: maximalist needs elaborate animation; minimalist needs precision spacing and subtle detail.

## Review Checklist

### Visual (Ive + Rams)
- [ ] 3 or fewer colors, one accent
- [ ] Spacing follows 4px grid, no arbitrary values
- [ ] Shadows use consistent elevation scale
- [ ] Could anything be removed without loss?

### Typography (Kruzeniski)
- [ ] Max 2 font families
- [ ] Body text >= 16px
- [ ] Reading width <= 65ch
- [ ] Type alone creates hierarchy (remove boxes — does it still work?)

### Interaction (Norman + Buxton + Cooper)
- [ ] Every clickable element has hover/active/focus states
- [ ] Touch targets >= 44px
- [ ] Errors at point of failure with fix instructions
- [ ] Loading states for all async operations
- [ ] Undo over confirmation for reversible actions
- [ ] Verb buttons, not "OK"

### Mobile (Wroblewski)
- [ ] Semantic input types on all fields
- [ ] Labels above inputs
- [ ] Primary actions in thumb zone
- [ ] Safe area respected (notch devices)

### Motion (Duarte)
- [ ] No animation over 500ms
- [ ] No linear easing on UI elements
- [ ] `prefers-reduced-motion` respected
- [ ] Every animation has communicative purpose

### Components (Frost + Curtis)
- [ ] Components categorized (atom/molecule/organism)
- [ ] No component depends on parent context
- [ ] All values use design tokens
- [ ] Variants, not one-off styles

## Anti-Patterns

| Pattern | Why It's Bad | Fix |
|---------|-------------|-----|
| Gradient buttons | Dated, less accessible | Solid accent color |
| Multiple accent colors | Confused hierarchy | Pick one |
| 13px body text | Fails accessibility | 16px minimum |
| Full-width paragraphs | Exhausting to read | `max-width: 65ch` |
| Placeholder as label | Disappears on input | Real label above |
| Hover-only menus | Unusable on touch | Tap to open |
| Removing focus outline | Unusable with keyboard | Style it, don't remove |
| "Are you sure?" everywhere | Trains users to ignore | Undo instead |
| Modal on modal | Trapped, confusing | Redesign flow |
| > 500ms animations | Feels slow, blocking | Speed up |
| Linear easing | Robotic, unnatural | ease-out / ease-in |
| Hamburger for primary nav | Hidden = unused | Bottom nav |
| Animation without purpose | Decoration, not communication | Remove or justify |
| Pure black text (#000) | Harsh, vibrates on screens | Use #1f2937 |
| Over-the-wall handoff | No feedback loop | Hot potato collaboration |
