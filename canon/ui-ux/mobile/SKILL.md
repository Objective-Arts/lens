---
name: mobile
description: "Mobile-first patterns - forms, thumb zones, responsive"
---

# Luke Wroblewski - Mobile-First Patterns

Design for mobile constraints first. Desktop is mobile with more space.

## Core Philosophy

### Mobile First
Start with the smallest screen, then add. Don't start big and remove.

**Why:**
- Forces prioritization (no room for clutter)
- Mobile is the hard problem (desktop is easy)
- Touch constraints are stricter
- Performance matters more

### Forms are Conversations
Forms are not data entry. They're conversations with users.

## Mobile Form Patterns

### Input Types

```html
<!-- Use semantic input types for mobile keyboards -->
<input type="email">     <!-- @ symbol visible -->
<input type="tel">       <!-- Number pad -->
<input type="number">    <!-- Numeric keyboard -->
<input type="url">       <!-- .com button -->
<input type="search">    <!-- Search button -->
<input type="date">      <!-- Date picker -->
```

### Top-Aligned Labels

```html
<!-- Labels above inputs (not beside) -->
<div class="field">
  <label for="email">Email address</label>
  <input type="email" id="email">
</div>
```

```css
.field label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
}

.field input {
  width: 100%;
  min-height: 44px;
}
```

### Inline Validation

```javascript
// Validate on blur, not on change
input.addEventListener('blur', validateField);

// Show success, not just errors
function showValidation(field, isValid) {
  field.classList.remove('error', 'success');
  field.classList.add(isValid ? 'success' : 'error');
}
```

### Smart Defaults

```html
<!-- Pre-fill when possible -->
<input type="tel" autocomplete="tel">
<input type="email" autocomplete="email">
<select>
  <option selected>United States</option> <!-- Most common -->
</select>

<!-- Reduce typing -->
<input type="date" value="2024-01-15"> <!-- Today's date -->
```

## Prescriptive Form Rules

### Field Order
```
1. Required fields first
2. Related fields grouped
3. Optional fields last (or behind "Show more")
4. Never ask for info you can infer
```

### Reducing Input
```
DON'T                           DO
─────────────────────────────────────────
Name: [First] [Last]     →     Name: [Full name]
Address line 2           →     (Remove - rarely used)
Country dropdown         →     (Auto-detect from IP)
Confirm email            →     (Just show what they typed)
Phone format             →     (Accept any format, parse)
```

### Error Messages

```html
<!-- Bad -->
<span class="error">Invalid input</span>

<!-- Good -->
<span class="error">
  <svg><!-- Error icon --></svg>
  Enter a valid email like name@example.com
</span>
```

**Rules:**
- Specific, not generic
- Show what valid looks like
- Place below the field
- Don't clear the input (let them fix it)

## Mobile Navigation

### Bottom Navigation (Primary)

```html
<nav class="bottom-nav">
  <a href="/" class="nav-item active">
    <svg><!-- Home icon --></svg>
    <span>Home</span>
  </a>
  <a href="/search" class="nav-item">
    <svg><!-- Search icon --></svg>
    <span>Search</span>
  </a>
  <a href="/profile" class="nav-item">
    <svg><!-- Profile icon --></svg>
    <span>Profile</span>
  </a>
</nav>
```

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  border-top: 1px solid var(--gray-200);
  padding-bottom: env(safe-area-inset-bottom); /* iPhone notch */
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  min-height: 56px;
}
```

**Rules:**
- Maximum 5 items
- Icons + labels (not just icons)
- Active state visible
- Safe area for notch devices

### Hamburger Alternative

Instead of hidden menus, use:
- Bottom navigation (most common actions)
- Tab bar (content categories)
- Priority+ pattern (show what fits, ... for rest)

```html
<!-- Priority+ navigation -->
<nav class="priority-nav">
  <a href="/home">Home</a>
  <a href="/products">Products</a>
  <a href="/about">About</a>
  <button class="more">More...</button>
</nav>
```

## Responsive Breakpoints

```css
/* Mobile first: base styles are mobile */
.container {
  padding: 16px;
}

/* Tablet */
@media (min-width: 640px) {
  .container {
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Content Adaptation

| Mobile | Tablet | Desktop |
|--------|--------|---------|
| Stack (1 col) | 2 columns | 3-4 columns |
| Bottom nav | Bottom nav or sidebar | Sidebar |
| Full-width cards | Card grid | Card grid with filters |
| Single action | Multiple actions visible | All actions visible |

## Touch Targets

```css
/* Minimum sizes */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* Spacing between targets */
.button + .button {
  margin-left: 8px;
}

/* Padding over size for links */
a.touch-target {
  padding: 12px;
  margin: -12px;  /* Expand hit area without visual change */
}
```

## Performance Rules

```
1. Critical CSS inline
2. Images lazy-loaded
3. Font loading: swap (show text immediately)
4. No blocking resources
5. First meaningful paint < 1.5s on 3G
```

```html
<!-- Lazy loading -->
<img src="placeholder.jpg" data-src="real-image.jpg" loading="lazy">

<!-- Font display -->
<link rel="preload" href="font.woff2" as="font" crossorigin>
```

## Review Checklist

- [ ] Semantic input types for all fields
- [ ] Labels above inputs (not beside)
- [ ] Touch targets 44px minimum
- [ ] Bottom navigation for primary actions
- [ ] Inline validation on blur
- [ ] Error messages are specific
- [ ] Safe area respected (notch devices)
- [ ] Works on 3G connection

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Labels beside inputs | Hard on narrow screens | Labels above |
| Hamburger for primary nav | Hidden = unused | Bottom nav |
| Placeholder as label | Disappears on input | Real label |
| Dropdown for < 5 options | Requires two taps | Radio buttons |
| Confirm password field | Annoying, little value | Show/hide toggle |
| Country dropdown first | Rare use case | Auto-detect, last |

## Wroblewski Score

| Score | Meaning |
|-------|---------|
| 10 | Mobile-native, forms are effortless |
| 7-9 | Works on mobile but desktop-first thinking |
| 4-6 | Pinch/zoom required, forms painful |
| 0-3 | Unusable on mobile |

## Integration

Combine with:
- `/interaction` - Input fundamentals these patterns build on
- `/usability` - Psychology of form completion
- `/components` - Components that implement these patterns
