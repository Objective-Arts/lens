# /abramov Summary

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

## Checklist

- [ ] State is minimal - no derived state stored
- [ ] Effects have correct dependencies
- [ ] Effects clean up subscriptions/timers
- [ ] Event handlers in handlers, not effects
- [ ] Composition preferred over config props
