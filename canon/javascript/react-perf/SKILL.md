---
name: react-perf
description: "React performance optimization patterns"
---
# React Team: Performance Guidance

The React team's core belief: **Don't optimize what you haven't measured.** Most components don't need memoization. The ones that do need it applied correctly, or it's worse than nothing.

## The Foundational Principle

> "Premature optimization is the root of all evil, but missing obvious optimization is the root of all jank."

React performance: fewer renders, less JavaScript shipped, only visible rows rendered, always measured first.

---

## Core Principles

### 1. React.memo: The Three-Part Decision

React.memo skips re-rendering when props haven't changed. It only helps when ALL three are true: same props frequently, expensive render, and stable prop identity.

**Not this:**
```tsx
// Cheap component -- memo adds overhead for nothing
const Badge = React.memo(({ label }: { label: string }) => {
  return <span className="badge">{label}</span>;
});
```

**This:**
```tsx
// Expensive + frequently receives same props
const Chart = React.memo(({ data, config }: ChartProps) => {
  const paths = computePathsFromData(data); // expensive SVG calculations
  return <svg>{paths.map(p => <path key={p.id} d={p.d} fill={p.color} />)}</svg>;
});
```

**When NOT to use it:** component is cheap to render, props almost always differ, or props include unstabilized children/inline objects/inline functions.

### 2. useMemo: Two Distinct Use Cases

**A -- Referential stability (keeping same object reference):**
```tsx
function Dashboard({ userId }: { userId: string }) {
  // Without useMemo, filter is new every render, causing DataGrid's useEffect to re-fire
  const filter = useMemo(() => ({ userId, active: true }), [userId]);
  return <DataGrid filter={filter} />;
}
```

**B -- Expensive computation:**
```tsx
function Analytics({ transactions }: { transactions: Transaction[] }) {
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.amount - a.amount),
    [transactions]
  );
  return <TransactionTable rows={sorted} />;
}
```

**Not this** -- useMemo for trivial work:
```tsx
// String concat is not expensive. Just compute it.
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
// This:
const fullName = `${first} ${last}`;
```

**Dependency array pitfall:**
```tsx
// BUG: options is a new object every render, useMemo never caches
const options = { threshold: 10, limit: 100 };
const result = useMemo(() => processItems(items, options), [items, options]);

// FIX: inline the values so the dependency is stable
const result = useMemo(() => processItems(items, { threshold: 10, limit: 100 }), [items]);
```

### 3. useCallback: Stable Function References

useCallback only matters when the callback is passed to a React.memo component.

**Not this** -- useCallback without a memoized consumer:
```tsx
function SearchPage() {
  const handleChange = useCallback((e) => setQuery(e.target.value), []);
  return <SearchInput onChange={handleChange} />; // SearchInput isn't memoized, pointless
}
```

**This** -- paired with React.memo:
```tsx
const SearchInput = React.memo(({ onChange }: SearchInputProps) => {
  return <input onChange={onChange} />;
});

function SearchPage() {
  const [query, setQuery] = useState('');
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <>
      <SearchInput onChange={handleChange} />
      <Results query={query} />
    </>
  );
}
```

**The relationship:** useCallback is the supplier, React.memo is the consumer. One without the other does nothing.

### 4. React Compiler: Auto-Memoization

React Compiler (formerly React Forget) inserts memoization at build time, making manual memo largely unnecessary.

```tsx
// You write (no manual memoization):
function ProductList({ products, onSelect }: ProductListProps) {
  const sorted = products.toSorted((a, b) => a.price - b.price);
  return (
    <ul>
      {sorted.map(p => <ProductCard key={p.id} product={p} onSelect={onSelect} />)}
    </ul>
  );
}
// Compiler auto-memoizes sorted, the map output, and ProductCard props
```

**What to do today:** new projects on React 19+ enable the compiler; existing projects keep manual memo until migration; either way follow Rules of React (pure render, stable hooks) so the compiler can optimize.

### 5. Code Splitting: Load Only What's Needed

**Route-based splitting (the baseline):**
```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
```

**Preloading on hover/intent:**
```tsx
const Settings = lazy(() => import('./pages/Settings'));

function NavLink() {
  const preload = () => import('./pages/Settings');
  return <Link to="/settings" onMouseEnter={preload} onFocus={preload}>Settings</Link>;
}
```

**Not this:** static imports for every page, forcing one giant bundle on first load.

### 6. Virtualization: Render Only What's Visible

For long lists (100+ items), render only visible rows with TanStack Virtual.

**Not this:**
```tsx
// 10,000 DOM nodes
<ul>{users.map(u => <UserCard key={u.id} user={u} />)}</ul>
```

**This:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function UserList({ users }: { users: User[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(row => (
          <div key={row.key} style={{
            position: 'absolute', top: row.start, height: row.size, width: '100%',
          }}>
            <UserCard user={users[row.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Windowing:** ~20 DOM nodes exist regardless of list length. 10,000 items? Still ~20 nodes.

### 7. Keys and Reconciliation

**Not this** -- index keys on a dynamic list:
```tsx
{todos.map((todo, index) => (
  // Inserting at top shifts all indexes -- React unmounts/remounts every item
  <TodoItem key={index} todo={todo} />
))}
```

**This** -- stable unique keys:
```tsx
{todos.map(todo => (
  <TodoItem key={todo.id} todo={todo} /> // React knows exactly which items moved
))}
```

**Index keys are fine** for static lists that never reorder and have no component state. **Index keys break** lists that reorder, filter, insert, or have local state (inputs, toggles).

### 8. State Colocation: Keep State Close

Every state update re-renders the owning component and all descendants. Push state down.

**Not this:**
```tsx
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  return (
    <div>
      <Header />          {/* re-renders on tooltip change */}
      <SearchBar query={searchQuery} onChange={setSearchQuery} />
      <Sidebar />         {/* re-renders on search change */}
      <Tooltip open={isTooltipOpen} onToggle={setIsTooltipOpen} />
    </div>
  );
}
```

**This:**
```tsx
function App() {
  return (
    <div>
      <Header />
      <SearchSection />   {/* owns its own query state */}
      <Sidebar />
      <TooltipWrapper />  {/* owns its own open state */}
    </div>
  );
}
```

**The rule:** if only one subtree uses a piece of state, that subtree owns it. Lift only when siblings genuinely share.

### 9. Children as Props Pattern

Children passed as props are already created -- they skip re-rendering when the parent re-renders.

**Not this:**
```tsx
function App() {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      <ExpensiveTree />  {/* re-renders every keystroke */}
    </div>
  );
}
```

**This:**
```tsx
function ColorPicker({ children }: { children: ReactNode }) {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={e => setColor(e.target.value)} />
      {children}  {/* same object reference, skips re-render */}
    </div>
  );
}

function App() {
  return (
    <ColorPicker>
      <ExpensiveTree />
    </ColorPicker>
  );
}
```

**Why:** `<ExpensiveTree />` is created in App's render. App doesn't re-render when ColorPicker's state changes, so the element reference is stable.

### 10. Profiler and DevTools: Measure First

**DevTools Profiler workflow:** Record > interact > stop > read flame chart. Wide bars = slow renders. Gray = skipped. Focus on components that render often AND take long.

**Programmatic Profiler:**
```tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  if (actualDuration > 16) { // longer than one frame at 60fps
    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(1)}ms`);
  }
};

function App() {
  return (
    <Profiler id="Navigation" onRender={onRender}>
      <Navigation />
    </Profiler>
  );
}
```

**The optimization loop:** Profile > rendering too often? React.memo + stable props. Each render slow? useMemo or virtualize. Re-profile to verify.

---

## Anti-Patterns

1. **Memo everything** -- comparison overhead without benefit. Memoize selectively.
2. **Unstable keys** -- `Math.random()` or index on dynamic lists forces full DOM recreation.
3. **Inline objects in JSX** -- `style={{ color: 'red' }}` defeats React.memo with a new reference every render.
4. **State too high** -- top-level state re-renders the entire tree on every change.
5. **Giant context values** -- one context with many fields re-renders all consumers on any change. Split by update frequency.
6. **useEffect for derived state** -- filtering in useEffect + setState causes double renders. Compute during render.
7. **Premature code splitting** -- splitting tiny components adds waterfall latency. Split at routes first.

---

## Decision Framework

### Should I Memoize?

```
Is the component visibly slow when profiled?
  No  -> Don't memoize.
  Yes -> Rendering too often with same props?
    Yes -> React.memo + stabilize props (useCallback/useMemo)
    No  -> Each render expensive?
      Yes -> useMemo the expensive part, or virtualize
      No  -> Problem is elsewhere. Check parent.
```

### Should I Code-Split?

| Target | Action |
|--------|--------|
| Route/page | Always split |
| Heavy component (editor, chart, map) | Split with lazy + Suspense |
| Small UI element | Keep in main bundle |

---

## Code Review Checklist

- [ ] No React.memo without a measured performance problem
- [ ] useCallback only when passed to memoized children
- [ ] useMemo only for referential stability or expensive computation
- [ ] Dynamic lists use stable unique keys (not index)
- [ ] Long lists (100+ items) virtualized or paginated
- [ ] Routes code-split with React.lazy
- [ ] State lives in the lowest component that needs it
- [ ] No inline objects/arrays passed to memoized components
- [ ] No derived state in useState + useEffect
- [ ] Performance claims backed by Profiler measurements

---

## Sources

- React documentation -- Performance section (react.dev)
- Dan Abramov, "Before You memo()" (overreacted.io)
- React Compiler RFC and documentation
- TanStack Virtual documentation
- Kent C. Dodds, "State Colocation" and "useMemo and useCallback"

---

*"Profile first. Fix what's slow. Skip the rest."* -- React Performance Guidance
