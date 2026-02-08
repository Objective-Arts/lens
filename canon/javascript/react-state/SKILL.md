---
name: react-state
description: "React mental models"
---
# Dan Abramov React Philosophy

Applying Dan Abramov's React mental models and "Just JavaScript" thinking when building React components, managing state, designing component APIs, or reviewing React code. Auto-triggers on .jsx/.tsx files, React component creation, hooks implementation, and state management decisions. Not for non-React JavaScript, not for build tooling, not for styling decisions.

---

## Core Mental Models

### React is "Just JavaScript"

Components are functions. Props are arguments. JSX is syntax sugar for function calls. State is variables that trigger re-renders. Effects are synchronization with external systems.

```jsx
// This JSX:
<Button onClick={handleClick}>Save</Button>

// Is just:
React.createElement(Button, { onClick: handleClick }, 'Save')

// Components are functions that return descriptions of UI
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}
```

**Apply when:** Developer seems confused about React "magic" - ground them in JavaScript fundamentals.

### UI as a Function of State

```
UI = f(state)
```

The component renders based on current state. Every render is a snapshot. Props and state during a render are frozen - they describe the UI at that moment in time.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    // This captures count at render time
    setTimeout(() => {
      alert(`Count was: ${count}`); // Shows value from THAT render
    }, 3000);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

**Apply when:** Debugging stale closure issues, explaining why async callbacks see "old" values.

### Each Render Has Its Own Everything

Every render has its own props, state, event handlers, and effects. They're all closures over that render's values.

```jsx
function Chat({ roomId }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // Effect "belongs" to this roomId
}
```

**Apply when:** Explaining useEffect dependencies, fixing infinite loops, understanding cleanup.

---

## Component Design Philosophy

### Composition Over Configuration

Prefer composing components over adding props/flags.

```jsx
// Configuration approach (prop explosion)
<Dialog
  title="Confirm"
  showCloseButton
  closeButtonPosition="top-right"
  showFooter
  footerAlignment="right"
  primaryButtonText="OK"
  secondaryButtonText="Cancel"
/>

// Composition approach
<Dialog>
  <Dialog.Header>
    <Dialog.Title>Confirm</Dialog.Title>
    <Dialog.CloseButton />
  </Dialog.Header>
  <Dialog.Body>Are you sure?</Dialog.Body>
  <Dialog.Footer>
    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    <Button variant="primary" onClick={onConfirm}>OK</Button>
  </Dialog.Footer>
</Dialog>
```

**Apply when:** Component has 5+ boolean props, props control layout/structure, different use cases need different DOM structure.

### Inversion of Control

Let the parent decide what to render. Pass components/elements as props when the child shouldn't dictate structure.

```jsx
// Child decides everything
<List items={users} />

// Parent controls rendering
<List>
  {users.map(user => (
    <UserCard key={user.id} user={user} />
  ))}
</List>

// Render props for complex cases
<DataFetcher url="/api/users">
  {({ data, loading, error }) => (
    loading ? <Spinner /> : <UserList users={data} />
  )}
</DataFetcher>
```

**Apply when:** Child component needs flexibility in what it renders, reusing logic but not UI.

### Lift State Up (Only When Needed)

State lives where it's used. Lift only when siblings need to share.

```jsx
// State lives in the component that needs it
function SearchPage() {
  return (
    <>
      <SearchInput />  {/* Has its own query state */}
      <FilterPanel />  {/* Has its own filter state */}
      <Results />      {/* Fetches based on URL params */}
    </>
  );
}

// Lift when siblings need to coordinate
function SearchPage() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <Results query={query} />  {/* Now they're synchronized */}
    </>
  );
}
```

---

## State Management

### useState for Local State

Simple, isolated state that doesn't need to be shared.

```jsx
function Toggle() {
  const [isOn, setIsOn] = useState(false);
  return <Switch checked={isOn} onChange={() => setIsOn(!isOn)} />;
}
```

### useReducer for Complex State Logic

When state updates depend on previous state, or when you have multiple sub-values that update together.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'reset':
      return { count: 0 };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}
```

### Context for "Global" State (Sparingly)

Context is for values that are truly global to a subtree: themes, locale, current user.

```jsx
// Good context usage
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Page />
    </ThemeContext.Provider>
  );
}

// Don't use context to avoid prop drilling
// Props are explicit and traceable - that's a feature
```

---

## Hooks Philosophy

### Custom Hooks Extract Logic, Not UI

Custom hooks are for reusing stateful logic, not for sharing UI.

```jsx
// Extracts reusable logic
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Usage
function Header() {
  const { width } = useWindowSize();
  return width < 768 ? <MobileHeader /> : <DesktopHeader />;
}
```

### useEffect is for Synchronization

Effects synchronize React with external systems. They're not lifecycle methods.

```jsx
// Synchronizing with external system
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);

// NOT for derived state - use computation instead
function Component({ items }) {
  // Wrong - useEffect for derived value
  const [filteredItems, setFilteredItems] = useState([]);
  useEffect(() => {
    setFilteredItems(items.filter(i => i.active));
  }, [items]);

  // Right - just compute it
  const filteredItems = items.filter(i => i.active);
}
```

### You Might Not Need an Effect

Many things that feel like effects are actually:
- **Derived values**: Just compute them during render
- **Event responses**: Handle in event handlers
- **Initialization**: Use lazy initializer in useState

```jsx
// Effect for derived value - wrong
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// Just compute it - right
const fullName = `${firstName} ${lastName}`;

// Effect for event response - wrong
useEffect(() => {
  if (submitted) {
    sendAnalytics('form_submitted');
  }
}, [submitted]);

// In the event handler - right
function handleSubmit() {
  setSubmitted(true);
  sendAnalytics('form_submitted');
}
```

---

## Anti-Patterns to Avoid

### Premature Abstraction

Don't create abstractions until you've seen the pattern at least 3 times.

```jsx
// Premature - creating "useApi" after one fetch
function useApi(url) { /* complex generic fetch hook */ }

// Start concrete, abstract later
function useUserData(userId) {
  // Specific to this use case
}
```

### Props Spreading Blindly

```jsx
// Hides what's actually passed
function Button(props) {
  return <button {...props} />;
}

// Explicit about supported props
function Button({ onClick, children, disabled, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}
```

### Unnecessary Memoization

Only memoize when you've measured a performance problem.

```jsx
// Premature optimization
const MemoizedComponent = React.memo(SimpleComponent);
const memoizedValue = useMemo(() => a + b, [a, b]);
const memoizedCallback = useCallback(() => doThing(), []);

// Memoize when:
// - Component re-renders with same props AND render is slow
// - Value is passed to dependency arrays of other hooks
// - Callback is passed to optimized children
```

---

## Decision Framework

### When to Split a Component

1. **It has multiple responsibilities** - Header renders nav AND user menu AND search
2. **Part of it re-renders independently** - Timer inside static card
3. **It's hard to name** - "HeaderWithSearchAndUserMenuAndNotifications"
4. **You want to reuse part of it** - The user avatar appears elsewhere

### When to Keep Components Together

1. **They always change together** - Form and its validation display
2. **One is meaningless without the other** - Tab and TabPanel
3. **Splitting adds prop drilling** - Without simplifying anything

### When to Use Which State Management

| Scenario | Approach |
|----------|----------|
| Local UI state | useState |
| Complex state logic | useReducer |
| Shared between siblings | Lift state up |
| Deep prop drilling (infrequent changes) | Context |
| Frequent updates needed everywhere | External library (Zustand, Jotai) |
| Server state | React Query, SWR |

---

## Code Review Checklist

When reviewing React code, verify:

- [ ] Components are functions, not classes (unless legacy)
- [ ] Props are destructured with explicit names
- [ ] State is minimal - no derived state stored
- [ ] Effects have correct dependencies (no suppressed warnings)
- [ ] Effects clean up subscriptions/timers
- [ ] Custom hooks start with "use"
- [ ] No unnecessary memoization
- [ ] Composition preferred over configuration props
- [ ] Keys are stable and unique (not index unless static list)
- [ ] Event handlers are in handlers, not effects

---

## Resources

- [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
- [Before You memo()](https://overreacted.io/before-you-memo/)
- [Writing Resilient Components](https://overreacted.io/writing-resilient-components/)
- [React as a UI Runtime](https://overreacted.io/react-as-a-ui-runtime/)
- [The Two Reacts](https://overreacted.io/the-two-reacts/)
