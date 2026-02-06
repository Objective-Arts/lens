# /react-test Summary

> "Write tests. Not too many. Mostly integration."

## Testing Trophy (Not Pyramid)

```
      /\      E2E (few)
     /  \     Integration (most)  ← Focus here
    /    \    Unit (some)
   /──────\   Static (TypeScript, ESLint)
```

**Key insight:** Integration tests give best confidence-to-effort ratio.

## Essential Testing Rules

| Rule | Wrong | Right |
|------|-------|-------|
| **Query Priority** | `getByTestId` | `getByRole`, `getByLabelText` |
| **User Events** | `fireEvent.click` | `userEvent.click` |
| **Test Behavior** | `expect(state.isOpen)` | `expect(screen.getByRole('dialog'))` |
| **Semantic HTML** | `<div onClick>` | `<button onClick>` |

## Query Priority (In Order)

1. `getByRole('button', { name: /submit/i })` - Best
2. `getByLabelText('Email')` - Forms
3. `getByText('Welcome')` - Visible text
4. `getByTestId('submit')` - Last resort only

**Never use:** `container.querySelector`, DOM structure queries

## Load Full Skill When

- Implementing compound components
- State reducer pattern for complex state
- Control props for hybrid controlled/uncontrolled components
- Focus management and ARIA patterns

## Quick Reference

```
INSTEAD OF              USE
──────────────────────────────────────────────────────
fireEvent.click()     → userEvent.click()
getByTestId()         → getByRole() or getByLabelText()
wrapper.find()        → screen.getByRole()
expect(state)         → expect(screen.getBy...)
Mock everything       → Mock at network boundary
<div onClick>         → <button onClick>
```

## Testing Checklist

- [ ] Tests use accessible queries (getByRole, getByLabelText)?
- [ ] Tests use userEvent, not fireEvent?
- [ ] Tests check behavior, not implementation?
- [ ] Error states tested?
