# React Rubric

Loaded when React signals detected. Covers hooks, rendering, state management, and component composition.

## Review Criteria

1. **Rules of Hooks** — Hooks called at the top level only. No hooks inside conditionals, loops, or nested functions. Custom hooks start with `use`. Enforce with `eslint-plugin-react-hooks`.
2. **Key Props** — Every list item rendered with `.map()` has a stable, unique `key`. Never use array index as key unless the list is static and never reordered. Keys derived from data identity (ID, slug).
3. **useMemo/useCallback** — Use `useMemo` for expensive computations. Use `useCallback` for callbacks passed to memoized children. Dependency arrays must be correct and complete — missing deps cause stale closures.
4. **useEffect Cleanup** — Effects that subscribe (WebSocket, event listeners, timers, intervals) must return a cleanup function. Abort controllers for fetch calls. No fire-and-forget subscriptions.
5. **Component Composition** — Prefer composition over prop drilling. Use `children`, render props, or compound components. Context for cross-cutting concerns (theme, auth, locale), not for all state.
6. **State Colocation** — State lives as close to where it's used as possible. Lift state only when siblings need it. Don't put form state in global store. URL state in the router, server state in the cache.
7. **Controlled vs Uncontrolled** — Pick one pattern per form and stick with it. Controlled: value + onChange on every input. Uncontrolled: refs + defaultValue. Don't mix within a form.
8. **Unnecessary Re-renders** — Use `React.memo` where profiling shows unnecessary re-renders (not preemptively). Object/array literals in JSX create new references every render — extract to constants or memoize.
9. **Error Boundaries** — Wrap route-level and feature-level components in error boundaries. Provide fallback UI. Log errors to monitoring. Don't catch errors in individual components unless recovery is possible.
10. **Suspense and Loading** — Use `Suspense` boundaries for lazy-loaded components and data fetching (React 18+). Show skeleton screens or spinners, not blank content. Avoid layout shift on load.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Hooks | Rules followed. Custom hooks extracted. Deps arrays correct. |
| Keys | Stable, unique keys on all list items. |
| Effects | Cleanup functions for subscriptions. Abort on unmount. |
| State | Colocated. Not over-lifted. Right tool for state type. |
| Rendering | Memoization where measured. No object literals in JSX. |
| Composition | Composition over prop drilling. Context for cross-cutting. |
| Errors | Error boundaries at route/feature level. Fallback UI. |
