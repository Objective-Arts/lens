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

## Concrete Checks (MUST ANSWER)

- [ ] Does every test query elements by `getByRole` or `getByLabelText` first -- with zero uses of `container.querySelector`, `getByTestId` as a primary query, or DOM structure traversal?
- [ ] Does every test assert on visible output (rendered text, element presence, ARIA state) rather than internal state, hook return values, or component instance properties?
- [ ] Does every user interaction use `userEvent` (e.g., `userEvent.click`, `userEvent.type`) with zero uses of `fireEvent` for clicks, typing, or form submission?
- [ ] Are mocks limited to the network boundary (e.g., MSW, fetch mocks) -- not mocking child components, hooks, or internal modules?
- [ ] Is every snapshot test justified by testing stable visual structure only -- with zero snapshot tests used to verify logic, state changes, or dynamic content?
