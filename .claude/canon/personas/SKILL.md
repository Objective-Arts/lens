---
name: personas
description: "Goal-Directed Design - personas, polite software, eliminate excise"
---

# Alan Cooper - Interaction Design

Apply Cooper's Goal-Directed Design principles from "About Face" to create software that helps users achieve their goals without unnecessary friction.

## Core Philosophy

### Goal-Directed Design
Users don't want to use software - they want to accomplish goals. Design for the goal, not the task.

**Test:** For every feature, ask "What goal does this help the user achieve?" If you can't answer clearly, reconsider the feature.

### Perpetual Intermediates
Most users are neither beginners nor experts - they're perpetual intermediates who:
- Know the basics
- Don't read manuals
- Want to get things done efficiently
- Will never use "advanced" features

**Rule:** Design for intermediates first. Beginners will learn. Experts will adapt.

### Polite Software
Software should behave like a considerate human assistant:
- Remembers user preferences
- Doesn't ask the same question twice
- Anticipates needs
- Admits mistakes gracefully
- Doesn't blame the user

## Prescriptive Rules

### Eliminate Excise
Excise = work users must do that doesn't directly advance their goal.

| Type | Example | Fix |
|------|---------|-----|
| Navigation excise | Clicking through 5 screens to do one thing | Flatten hierarchy, direct access |
| Input excise | Re-entering data the system already knows | Auto-fill, remember choices |
| Confirmation excise | "Are you sure?" for reversible actions | Just do it, provide undo |
| Output excise | Forcing users to interpret raw data | Present meaningful information |

### Modal vs Modeless

```
PREFER MODELESS:
- Let users work without interruption
- Don't trap users in dialogs
- Allow parallel activities

WHEN MODAL IS NECESSARY:
- Make it obviously modal (centered, backdrop, clear boundaries)
- Provide clear escape (X button, Escape key, backdrop click)
- Keep it focused on ONE decision
- Don't stack modals on modals
```

### Dialog Design (Cooper's Rules)

```css
/* Modals must be unmistakably modal */
dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);  /* Centered = important */
  z-index: 1000;                      /* Above everything */
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);     /* Dim background = focus here */
}
```

**Dialog Content Rules:**
1. Clear title stating the decision/action
2. Minimal text - users don't read dialogs
3. Primary action on the right (Western reading order)
4. Cancel always available
5. No "OK" - use verbs ("Save", "Delete", "Send")

### Undo Over Confirmation

```
BAD:  "Are you sure you want to delete?" [Yes] [No]
GOOD: *deletes immediately* [Undo] (visible for 5 seconds)

WHY:
- Confirmation dialogs train users to click "Yes" without reading
- Undo respects user intent while allowing recovery
- Faster workflow, fewer interruptions
```

### Smart Defaults

```
Every input should have a sensible default:
- Date picker: today's date
- Country: detected from browser
- Format: most common choice
- Quantity: 1

NEVER:
- Blank required fields when you could guess
- "Select one..." as default in dropdowns
- Default to destructive option
```

### Progressive Disclosure

```
Level 1: Essential controls (always visible)
Level 2: Common options (one click away)
Level 3: Advanced options (settings/preferences)
Level 4: Power user features (keyboard shortcuts, CLI)

RULE: 80% of users use 20% of features.
      Make that 20% immediately accessible.
```

## Persona Thinking

Before designing, define who you're designing for:

```yaml
Primary Persona:
  name: "Regular User"
  goal: Complete task quickly
  behavior: Uses app weekly, knows basics
  frustration: Unnecessary steps, confusion

Secondary Persona:
  name: "Power User"
  goal: Maximum efficiency
  behavior: Daily use, keyboard shortcuts
  frustration: Missing features, forced mouse use

Negative Persona (don't design for):
  name: "Edge Case"
  behavior: Unusual workflow nobody else needs
  decision: Document limitation, don't add complexity
```

## Review Checklist

Before shipping any interaction:

- [ ] What user goal does this serve?
- [ ] Is there excise that can be eliminated?
- [ ] Would a perpetual intermediate understand this immediately?
- [ ] Are modals truly necessary, or could this be modeless?
- [ ] Do dialogs have verb buttons (not "OK")?
- [ ] Is undo available instead of confirmation?
- [ ] Are smart defaults provided?
- [ ] Does the software remember user preferences?

## Anti-Patterns

| Bad | Why | Fix |
|-----|-----|-----|
| "Are you sure?" everywhere | Trains users to ignore, adds excise | Undo instead |
| Wizard interfaces | Forces linear path, slow | Direct manipulation |
| Modal on modal | Confusing, trapped feeling | Redesign flow |
| "OK" / "Cancel" buttons | Unclear what "OK" does | Use verbs: "Save", "Delete" |
| Blank form fields | User must guess format | Smart defaults, examples |
| "Advanced" section with common features | Hides what users need | Reorganize by frequency |
| Error messages that blame user | Rude, unhelpful | Explain how to fix |

## Cooper Score

| Score | Meaning |
|-------|---------|
| 10 | Invisible interface - user achieves goal without noticing UI |
| 7-9 | Smooth flow, minimal excise, polite behavior |
| 4-6 | Functional but user fights the interface |
| 0-3 | Software-centered, not goal-centered |

## Integration

Combine with:
- `/usability` - Psychology of why Cooper's patterns work
- `/design` - Visual simplicity that supports goal-directed design
- `/mobile` - Form design that eliminates input excise
