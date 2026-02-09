# /mobile Summary

> "Mobile first. Desktop is mobile with more space."

## Core Rules

| Rule | Why |
|------|-----|
| **Mobile first** | Forces prioritization, mobile is the hard problem |
| **Forms are conversations** | Not data entry - guide users through |
| **Labels above inputs** | Works on all screen sizes |
| **Validate on blur** | Not on change (too aggressive) |

## Input Types (Use Them!)

```html
<input type="email">   <!-- @ key visible -->
<input type="tel">     <!-- Number pad -->
<input type="number">  <!-- Numeric keyboard -->
<input type="url">     <!-- .com button -->
<input type="date">    <!-- Native date picker -->
```

## Form Reduction

```
DON'T                        DO
───────────────────────────────────────
[First] [Last]          →    [Full name]
Address line 2          →    (remove - rarely used)
Country dropdown        →    Auto-detect from IP
Confirm email           →    Show what they typed
Phone format required   →    Accept any, parse it
```

## Touch & Mobile

- **44px minimum** touch targets
- **Bottom nav** for primary actions (max 5 items, icons + labels)
- **Safe area** padding for notch devices: `padding-bottom: env(safe-area-inset-bottom)`

## Error Messages

**Bad:** "Invalid input"

**Good:** "Enter a valid email like name@example.com"

Rules: Specific + show valid example + below field + don't clear input

## Anti-Patterns

| Bad | Fix |
|-----|-----|
| Labels beside inputs | Labels above |
| Hamburger for primary nav | Bottom nav |
| Placeholder as label | Real label |
| Dropdown for <5 options | Radio buttons |
| Confirm password | Show/hide toggle |

## Load Full Skill When

- Designing mobile forms
- Optimizing checkout flows
- Responsive navigation decisions

## Concrete Checks (MUST ANSWER)

- [ ] Does every interactive element (button, link, icon-button, toggle) have a minimum touch target of 44x44px with at least 8px gap between adjacent targets?
- [ ] Does every `<input>` use the most specific `type` attribute (`email`, `tel`, `url`, `number`, `date`) to trigger the correct mobile keyboard?
- [ ] Are all form labels positioned above their inputs (not beside, not as placeholder-only) and visible at all viewport widths?
- [ ] Is all content critical to the user's primary task visible above the fold on a 375px-wide viewport without scrolling?
- [ ] Does the page load and become interactive within 3 seconds on a throttled 3G connection (verified via Lighthouse or DevTools network throttling)?
