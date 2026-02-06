# /reactivity Summary

> "The best runtime code is no runtime code."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Compile-time > runtime** | Shift work from browser to build |
| **Ship less JavaScript** | Every byte has download, parse, compile, execute cost |
| **Automatic reactivity** | Compiler tracks dependencies, not developers |

## Virtual DOM vs Compiled

```javascript
// Runtime (React): Ships diffing algorithm
const [count, setCount] = useState(0);
return <button onClick={() => setCount(count + 1)}>{count}</button>;

// Compiled (Svelte): Direct DOM manipulation
let count = 0;
<button on:click={() => count++}>{count}</button>
// Output: button.textContent = count;
```

## Tree Shaking

```javascript
// utils.js
export function used() { return 'used'; }
export function unused() { return 'unused'; }

// main.js - Rollup eliminates unused() completely
import { used } from './utils.js';
```

## Build Optimization

```javascript
// Before adding lodash for one function:
import { debounce } from 'lodash';  // 70KB

// Consider:
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}  // 200 bytes
```

## When to Use

- Bundle size optimization
- Performance-critical applications
- Framework selection decisions
- Evaluating compile-time options (Svelte, SolidJS)
