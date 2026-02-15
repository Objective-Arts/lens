# /usability Summary

> "Users don't read manuals - the interface must teach itself."

## Core Concepts

| Concept | Rule |
|---------|------|
| **Affordances** | Buttons look pressable, links look clickable, text fields look editable |
| **Signifiers** | Hover states, cursor changes, icons+labels reveal what's interactive |
| **Feedback** | Every action gets visible response (<100ms for clicks) |
| **Mapping** | Controls relate spatially to what they affect |
| **Constraints** | Prevent errors by making them impossible |
| **Mental Models** | Logo top-left = home, X = close. Don't fight convention |

## Feedback Timing

| Action | Timing | Type |
|--------|--------|------|
| Button click | <100ms | Visual state change |
| Form validation | On blur | Inline error |
| API call start | Immediate | Loading indicator |
| API success | When complete | Auto-dismiss message |
| API failure | When complete | Persist until dismissed |

## Error Messages

**Bad:** "Error", "Invalid input", "Something went wrong"

**Good:** "Email must include @", "Password needs 8+ characters"

Rules: Say what's wrong + how to fix it + place near problem + use icon (colorblind)

## Touch Targets

- Minimum 44x44px
- 8px spacing between targets
- Dangerous actions require confirmation

## Load Full Skill When

- Designing forms (combine with /mobile)
- Complex interaction patterns
- Accessibility audits

## Concrete Checks (MUST ANSWER)

- [ ] Does every interactive element (button, link, input) have visible affordances -- distinct hover, active, and focus states defined in CSS?
- [ ] Does every error message state what went wrong AND how to fix it, positioned adjacent to the element that caused it?
- [ ] Is there a loading/progress indicator shown within 100ms of every async operation starting?
- [ ] Are all touch targets at least 44x44px with at least 8px spacing between adjacent targets?
- [ ] Does the UI follow a consistent mental model -- does the logo link home, does X mean close, do breadcrumbs show location?
- [ ] Do all destructive actions (delete, overwrite, send) require explicit confirmation before executing?
