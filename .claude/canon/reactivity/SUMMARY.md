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

## Concrete Checks (MUST ANSWER)

- [ ] Are reactive declarations (`$:` in Svelte, `createMemo` in Solid, `computed` in Vue) used for every derived value instead of manually syncing state in event handlers or lifecycle hooks?
- [ ] Are side effects (DOM manipulation, network calls, subscriptions) placed exclusively in proper lifecycle functions (`onMount`, `createEffect`, `$effect`) and not at module top-level or inside reactive declarations?
- [ ] Does every third-party dependency added to the bundle justify its size -- can it be replaced by a <1KB hand-written utility or native API?
- [ ] Is tree shaking verified by checking that unused exports are eliminated from the production bundle (via bundle analyzer or build output)?
- [ ] Does the production build output zero runtime framework code that could have been resolved at compile time (no virtual DOM diffing for static content)?
