# React Patterns (Kent C. Dodds - Epic React)

Advanced patterns from Epic React course.

## Pattern 1: Composition Over Configuration

### Problem: Prop Explosion

```javascript
// BAD - endless props
<LoginForm
  onSubmit={handleSubmit}
  submitText="Login"
  submitIcon={<Icon />}
  showRememberMe={true}
  rememberMeLabel="Keep me logged in"
  showForgotPassword={true}
  forgotPasswordHref="/forgot"
  // ... 20 more props
/>
```

### Solution: Compound Components

```javascript
// GOOD - composition
<LoginForm onSubmit={handleSubmit}>
  <LoginForm.Email />
  <LoginForm.Password />
  <LoginForm.RememberMe>Keep me logged in</LoginForm.RememberMe>
  <LoginForm.Submit>Login</LoginForm.Submit>
  <LoginForm.ForgotPassword href="/forgot">
    Forgot password?
  </LoginForm.ForgotPassword>
</LoginForm>
```

### Implementation

```javascript
const LoginFormContext = createContext()

function LoginForm({ onSubmit, children }) {
  const [formData, setFormData] = useState({})

  return (
    <LoginFormContext.Provider value={{ formData, setFormData }}>
      <form onSubmit={(e) => {
        e.preventDefault()
        onSubmit(formData)
      }}>
        {children}
      </form>
    </LoginFormContext.Provider>
  )
}

LoginForm.Email = function Email() {
  const { setFormData } = useContext(LoginFormContext)
  return (
    <input
      type="email"
      onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
    />
  )
}

// ... other sub-components
```

---

## Pattern 2: Prop Getters

### Problem: Prop Collision

```javascript
// User wants to add their own onClick
const { onClick } = useToggle()
<button onClick={onClick}>Toggle</button>

// But also wants custom behavior
<button onClick={(e) => {
  track('button_clicked')  // Custom
  onClick(e)               // From hook - easy to forget!
}}>
```

### Solution: Prop Getters

```javascript
function useToggle() {
  const [on, setOn] = useState(false)
  const toggle = () => setOn(o => !o)

  function getTogglerProps({ onClick, ...props } = {}) {
    return {
      'aria-pressed': on,
      onClick: (e) => {
        onClick?.(e)  // User's handler
        toggle()       // Our handler
      },
      ...props,
    }
  }

  return { on, toggle, getTogglerProps }
}

// Usage - can't forget to call toggle
const { on, getTogglerProps } = useToggle()

<button {...getTogglerProps({
  onClick: () => track('clicked')
})}>
  {on ? 'ON' : 'OFF'}
</button>
```

---

## Pattern 3: State Reducer

### Problem: Need to Control Internal State

```javascript
// Hook manages state internally
const { on, toggle } = useToggle()

// But user wants to prevent toggle after 4 clicks
// Can't intercept the state change!
```

### Solution: State Reducer Pattern

```javascript
function toggleReducer(state, action) {
  switch (action.type) {
    case 'toggle':
      return { on: !state.on }
    default:
      return state
  }
}

function useToggle({ reducer = toggleReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { on: false })
  const toggle = () => dispatch({ type: 'toggle' })
  return { on: state.on, toggle }
}

// Usage - user can intercept
const [clickCount, setClickCount] = useState(0)

const { on, toggle } = useToggle({
  reducer: (state, action) => {
    if (action.type === 'toggle' && clickCount >= 4) {
      return state  // Prevent change
    }
    return toggleReducer(state, action)
  }
})

function handleClick() {
  setClickCount(c => c + 1)
  toggle()
}
```

---

## Pattern 4: Control Props

### Problem: Sometimes Controlled, Sometimes Not

```javascript
// User A wants uncontrolled
<Toggle />

// User B wants controlled
<Toggle on={isOn} onChange={setIsOn} />
```

### Solution: Control Props

```javascript
function useToggle({ on: controlledOn, onChange } = {}) {
  const [internalOn, setInternalOn] = useState(false)

  // Determine if controlled
  const isControlled = controlledOn !== undefined
  const on = isControlled ? controlledOn : internalOn

  function toggle() {
    if (!isControlled) {
      setInternalOn(prev => !prev)
    }
    onChange?.(!on)
  }

  return { on, toggle }
}

// Uncontrolled usage
function App() {
  const { on, toggle } = useToggle()
  return <button onClick={toggle}>{on ? 'ON' : 'OFF'}</button>
}

// Controlled usage
function App() {
  const [isOn, setIsOn] = useState(false)
  const { on, toggle } = useToggle({ on: isOn, onChange: setIsOn })
  return <button onClick={toggle}>{on ? 'ON' : 'OFF'}</button>
}
```

---

## Pattern 5: Layout Components

### Problem: Repeated Layout Boilerplate

```javascript
// Every page repeats this
function Dashboard() {
  return (
    <div className="page">
      <header>...</header>
      <nav>...</nav>
      <main>
        {/* actual content */}
      </main>
      <footer>...</footer>
    </div>
  )
}
```

### Solution: Layout Components

```javascript
function PageLayout({ children }) {
  return (
    <div className="page">
      <Header />
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

// Clean page components
function Dashboard() {
  return (
    <PageLayout>
      <DashboardContent />
    </PageLayout>
  )
}
```

---

## Pattern 6: Derived State

### Problem: Syncing State

```javascript
// WRONG - duplicated state
const [items, setItems] = useState([])
const [filteredItems, setFilteredItems] = useState([])
const [filter, setFilter] = useState('')

// Must sync filteredItems whenever items or filter changes
useEffect(() => {
  setFilteredItems(items.filter(i => i.name.includes(filter)))
}, [items, filter])
```

### Solution: Compute, Don't Store

```javascript
// RIGHT - derived value
const [items, setItems] = useState([])
const [filter, setFilter] = useState('')

// Computed on every render (usually fine)
const filteredItems = items.filter(i => i.name.includes(filter))

// Or memoize if expensive
const filteredItems = useMemo(
  () => items.filter(i => i.name.includes(filter)),
  [items, filter]
)
```

---

## Anti-Patterns to Avoid

### 1. Props in State

```javascript
// WRONG
function Component({ initialValue }) {
  const [value, setValue] = useState(initialValue)
  // value never updates when initialValue changes!
}

// RIGHT - use key to reset
<Component key={id} initialValue={data} />

// OR - sync explicitly (rarely needed)
useEffect(() => {
  setValue(initialValue)
}, [initialValue])
```

### 2. State for Everything

```javascript
// WRONG
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
const [fullName, setFullName] = useState('')

useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])

// RIGHT
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
const fullName = `${firstName} ${lastName}`  // Derived
```

### 3. Unnecessary Effects

```javascript
// WRONG - effect for derived data
useEffect(() => {
  setDisplayName(user ? user.name : 'Guest')
}, [user])

// RIGHT - compute inline
const displayName = user ? user.name : 'Guest'
```
