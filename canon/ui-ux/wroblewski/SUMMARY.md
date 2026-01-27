# /wroblewski Summary

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

## Checklist

- [ ] Semantic input types for all fields
- [ ] Labels above inputs
- [ ] Touch targets 44px minimum
- [ ] Inline validation on blur
- [ ] Error messages are specific
- [ ] Works on 3G connection
