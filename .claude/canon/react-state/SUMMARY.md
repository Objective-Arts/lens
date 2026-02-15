# /react-state Summary

> "UI = f(state)" - Dan Abramov

## Core Mental Models

| Concept | Meaning |
|---------|---------|
| **Just JavaScript** | Components are functions. Props are arguments. JSX is syntax sugar |
| **Each render is a snapshot** | Props/state during a render are frozen in time |
| **Effects are synchronization** | Not lifecycle methods - sync React with external systems |

## Component Design

```jsx
// COMPOSITION over configuration
// Not this (prop explosion):
<Dialog showCloseButton closeButtonPosition="top-right" showFooter ... />

// This (composable):
<Dialog>
  <Dialog.Header><Dialog.CloseButton /></Dialog.Header>
  <Dialog.Body>Content</Dialog.Body>
  <Dialog.Footer><Button>OK</Button></Dialog.Footer>
</Dialog>
```

## You Might Not Need useEffect

| Instead of Effect | Just Do |
|-------------------|---------|
| Derived value | Compute during render: `const fullName = first + ' ' + last` |
| Event response | Handle in event handler, not effect |
| Initialization | Use lazy initializer in useState |

## State Management

| Scenario | Use |
|----------|-----|
| Local UI state | `useState` |
| Complex state logic | `useReducer` |
| Shared between siblings | Lift state up |
| Deep prop drilling | Context (sparingly) |
| Server state | React Query, SWR |

## Anti-Patterns

- Premature abstraction (wait for 3 occurrences)
- Props spreading blindly (`{...props}`)
- Unnecessary memoization (measure first)
- Storing derived state

## Concrete Checks (MUST ANSWER)

- [ ] Is every piece of state stored in the component closest to where it is read -- not hoisted to a parent "just in case"?
- [ ] Is every value computable from existing state/props calculated during render (e.g., `const fullName = first + ' ' + last`) rather than stored in `useState`?
- [ ] Is every `useEffect` synchronizing with an external system (DOM, network, subscription) -- not reacting to state changes that belong in an event handler?
- [ ] Is React Context used only for low-frequency, read-heavy data (theme, locale, auth) -- not as a general-purpose global store for frequently changing state?
- [ ] Does every `useEffect` return a cleanup function for subscriptions, timers, or event listeners it creates?
