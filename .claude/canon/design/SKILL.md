---
name: design
description: "10 Principles of Good Design - less but better"
---

# Dieter Rams - Design Philosophy

Apply Dieter Rams' 10 Principles when making any design decision. These are non-negotiable quality gates.

## The 10 Principles

### 1. Good design is innovative
- Don't copy existing patterns blindly
- Solve the actual problem, not the assumed one
- Technology enables new solutions - use it

### 2. Good design makes a product useful
- Every element must serve a purpose
- If it doesn't help the user accomplish their goal, remove it
- Useful > Beautiful (but both is best)

### 3. Good design is aesthetic
- Visual quality is not optional
- Ugly software signals careless thinking
- Well-executed details build trust

### 4. Good design makes a product understandable
- The interface should explain itself
- No manual required for basic operations
- Progressive disclosure for complexity

### 5. Good design is unobtrusive
- Tools should not demand attention
- The user's work is the focus, not the UI
- Neutral, restrained, leave room for user expression

### 6. Good design is honest
- Don't promise more than you deliver
- Don't manipulate users (dark patterns)
- Don't disguise what something is

### 7. Good design is long-lasting
- Avoid trendy for trendy's sake
- Classic over fashionable
- Will this look dated in 2 years?

### 8. Good design is thorough down to the last detail
- Nothing is arbitrary
- Every pixel, every spacing choice is intentional
- Consistency in the small things

### 9. Good design is environmentally friendly
- In software: performance is environmental
- Don't waste CPU cycles on animations nobody needs
- Respect bandwidth, battery, attention

### 10. Good design is as little design as possible
- Less, but better
- Remove until it breaks, then add back one thing
- Concentration on essential aspects

## Prescriptive Rules

### Color
```
- Maximum 3 colors in any interface
- 1 primary action color (use sparingly)
- 1 text color (with lighter variant for secondary)
- 1 background color (with subtle variant for cards/sections)
- Gray for everything else
```

### Spacing
```
- Use a 4px base unit
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Never use arbitrary values (no 13px, no 27px)
- Consistent spacing = professional appearance
```

### Typography
```
- Maximum 2 font families (1 is better)
- Type scale: 12, 14, 16, 18, 20, 24, 30, 36, 48
- Line height: 1.5 for body, 1.2 for headings
- Never go below 14px for body text
```

### Visual Weight
```
- One focal point per screen
- Hierarchy: Size > Color > Position > Style
- If everything is bold, nothing is bold
- White space is not wasted space
```

## Review Checklist

Before shipping any UI:

- [ ] Can any element be removed without loss of function?
- [ ] Is there exactly ONE primary action visible?
- [ ] Does spacing follow the 4px grid?
- [ ] Are there 3 or fewer colors?
- [ ] Would this look good in 5 years?
- [ ] Is the design honest about what the product does?

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Gradient buttons | Trendy, dates quickly | Solid color |
| Drop shadows everywhere | Visual noise | Use for elevation only |
| 5+ colors | Chaotic, unprofessional | Reduce to 3 |
| Random spacing | Looks unfinished | Use spacing scale |
| Decorative icons | Noise without meaning | Remove or make functional |

## Rams Score

Rate any design 0-10:

| Score | Meaning |
|-------|---------|
| 10 | Nothing can be removed, everything earns its place |
| 7-9 | Minor excess, could be simpler |
| 4-6 | Significant clutter, redesign needed |
| 0-3 | Violates multiple principles, start over |

## Integration

This skill sets the philosophical foundation. Combine with:
- `/usability` - Psychology of how users perceive this design
- `/components` - Component structure that embodies these principles
- `/charts` - Data visualization aligned with "less but better"
