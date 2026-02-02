# /rams Summary

> "Less, but better." - Dieter Rams

## The 10 Principles (Condensed)

| # | Principle | In Practice |
|---|-----------|-------------|
| 1 | **Innovative** | Solve the actual problem, not the assumed one |
| 2 | **Useful** | If it doesn't help the user's goal, remove it |
| 3 | **Aesthetic** | Visual quality signals careful thinking |
| 4 | **Understandable** | Interface explains itself, no manual needed |
| 5 | **Unobtrusive** | User's work is focus, not the UI |
| 6 | **Honest** | No dark patterns, don't overpromise |
| 7 | **Long-lasting** | Classic over trendy. Will this look dated in 2 years? |
| 8 | **Thorough** | Every pixel intentional, nothing arbitrary |
| 9 | **Environmentally friendly** | Respect CPU, bandwidth, battery, attention |
| 10 | **As little as possible** | Remove until it breaks, add back one thing |

## Prescriptive Rules

```
COLORS:    Max 3. 1 primary action, 1 text, 1 background. Gray for rest.
SPACING:   4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64. No arbitrary values.
TYPE:      Max 2 fonts (1 better). Scale: 12, 14, 16, 18, 20, 24, 30, 36, 48.
HIERARCHY: One focal point per screen. If everything is bold, nothing is.
```

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Gradient buttons | Dates quickly | Solid color |
| Drop shadows everywhere | Visual noise | Elevation only |
| 5+ colors | Chaotic | Reduce to 3 |
| Random spacing | Unfinished look | Use spacing scale |
| Decorative icons | Noise | Remove or make functional |

## Load Full Skill When

- Starting a new design system
- Auditing existing UI for clutter
- Making "should we add this?" decisions

## Checklist

- [ ] Can any element be removed without loss of function?
- [ ] Is there exactly ONE primary action visible?
- [ ] Does spacing follow the 4px grid?
- [ ] Are there 3 or fewer colors?
- [ ] Would this look good in 5 years?
