# Common Testing Mistakes (Kent C. Dodds)

Common mistakes from Kent's blog post and how to fix them.

## Mistake 1: Using wrapper as Variable Name

```javascript
// WRONG
const wrapper = render(<Component />)

// RIGHT
const { container } = render(<Component />)
// Or just use screen
render(<Component />)
expect(screen.getByRole('button')).toBeInTheDocument()
```

**Why:** `wrapper` implies Enzyme patterns. Testing Library returns a container, but you should use `screen` anyway.

---

## Mistake 2: Not Using screen

```javascript
// WRONG
const { getByRole } = render(<Component />)
getByRole('button')

// RIGHT
render(<Component />)
screen.getByRole('button')
```

**Why:** `screen` is always available, reduces destructuring, and makes tests cleaner.

---

## Mistake 3: Using cleanup

```javascript
// WRONG
import { cleanup, render } from '@testing-library/react'

afterEach(cleanup)

// RIGHT
import { render } from '@testing-library/react'

// cleanup happens automatically
```

**Why:** Testing Library auto-cleans. Manual cleanup can hide bugs.

---

## Mistake 4: Not Using act() Warnings Properly

```javascript
// If you see act() warnings, you're likely:
// 1. Not waiting for async updates
// 2. Not using userEvent.setup()

// WRONG
fireEvent.click(button)

// RIGHT
const user = userEvent.setup()
await user.click(button)
```

**Why:** `userEvent` handles act() wrapping automatically.

---

## Mistake 5: Using waitFor to Wait for Appearance

```javascript
// WRONG
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// RIGHT
expect(await screen.findByText('Success')).toBeInTheDocument()
```

**Why:** `findBy*` queries are designed for this. `waitFor` is for assertions, not queries.

---

## Mistake 6: Passing Empty Callback to waitFor

```javascript
// WRONG
await waitFor(() => {})
expect(screen.getByText('Success')).toBeInTheDocument()

// RIGHT
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

**Why:** Empty callbacks don't wait for anything meaningful.

---

## Mistake 7: Side Effects in waitFor

```javascript
// WRONG
await waitFor(() => {
  fireEvent.click(button) // Side effect!
  expect(result).toBe(true)
})

// RIGHT
fireEvent.click(button)
await waitFor(() => {
  expect(result).toBe(true)
})
```

**Why:** `waitFor` retries the callback. Side effects would run multiple times.

---

## Mistake 8: Using get* in waitFor

```javascript
// WRONG
await waitFor(() => {
  screen.getByText('Loading') // Throws if not found
})

// RIGHT
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument()
})
```

**Why:** `getBy*` throws immediately if not found. Use `queryBy*` for checking absence.

---

## Mistake 9: Query by Test ID as Default

```javascript
// WRONG
<button data-testid="submit-btn">Submit</button>
screen.getByTestId('submit-btn')

// RIGHT
<button>Submit</button>
screen.getByRole('button', { name: /submit/i })
```

**Why:** Test IDs are implementation details. Users don't see them.

---

## Mistake 10: Not Querying by Role

```javascript
// WRONG
screen.getByText('Submit')  // Could match any text

// RIGHT
screen.getByRole('button', { name: /submit/i })
```

**Why:** Role queries are more specific and test accessibility.

---

## Mistake 11: fireEvent Instead of userEvent

```javascript
// WRONG
fireEvent.change(input, { target: { value: 'hello' } })

// RIGHT
const user = userEvent.setup()
await user.type(input, 'hello')
```

**Why:** `userEvent` simulates real user behavior (focus, keydown, keyup, etc.).

---

## Mistake 12: Not Awaiting userEvent

```javascript
// WRONG
userEvent.click(button)
expect(result).toBe(true)

// RIGHT
const user = userEvent.setup()
await user.click(button)
expect(result).toBe(true)
```

**Why:** User events are async. Without await, assertions run before events complete.

---

## Query Priority Reference

1. **getByRole** - Accessible to everyone (best)
2. **getByLabelText** - Forms
3. **getByPlaceholderText** - Fallback for forms
4. **getByText** - Non-interactive elements
5. **getByDisplayValue** - Current input value
6. **getByAltText** - Images
7. **getByTitle** - Title attribute
8. **getByTestId** - Last resort only
