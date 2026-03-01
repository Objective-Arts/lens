# React Rubric

Loaded when React signals detected. Covers hooks, rendering, state management, Server Components, concurrent features, and component composition.

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
10. **Suspense and Loading** — Use `Suspense` boundaries for lazy-loaded components and data fetching. Show skeleton screens or spinners, not blank content. Avoid layout shift on load.
11. **Server vs Client Components** — Default to Server Components (no `'use client'`). Add `'use client'` only for interactivity (state, effects, browser APIs, event handlers). Never import Server Components into Client Components — pass as `children` instead. No secrets or database access in Client Components.
12. **Server Actions** — Use `'use server'` for form mutations. Validate all inputs server-side — client can send anything. Return serializable data only. Revalidate cache after mutations with `revalidatePath`/`revalidateTag`. No side effects in render.
13. **useTransition / useDeferredValue** — Wrap expensive state updates in `useTransition` to keep the UI responsive. Use `useDeferredValue` for derived values from fast-changing inputs (search, filtering). Show `isPending` state to the user during transitions.
14. **Context Optimization** — Split large contexts by update frequency. Co-locate provider with the subtree that needs it. Memoize context value objects to prevent re-renders of all consumers. Prefer multiple small contexts over one large one.
15. **Custom Hook Extraction** — Extract reusable logic into custom hooks when the same state+effect pattern appears twice. Hooks compose — build complex hooks from simple ones. Each custom hook should do one thing. Name describes what it does, not how (`useAuth`, not `useStateAndEffect`).
16. **Accessibility** — Interactive elements are focusable and keyboard-operable. ARIA roles and labels on custom controls. Focus management on route changes and modal open/close. No `div` with `onClick` — use `button` or `a`. Color contrast meets WCAG AA.
17. **Data Fetching Patterns** — Fetch in Server Components or route loaders, not in `useEffect`. Client-side fetching via React Query, SWR, or `use()` with Suspense — not raw `fetch` in effects. Deduplicate requests. Handle loading, error, and empty states for every fetch.

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
| Server/Client | Server Components by default. 'use client' only for interactivity. |
| Data Fetching | Server-side or cache library. No raw fetch in useEffect. |
| Mutations | Server Actions with input validation. Cache revalidation after writes. |
| Accessibility | Keyboard nav. ARIA labels. Focus management. Contrast. |
