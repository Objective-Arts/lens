# /js-internals Summary

> "Know the language, not just the patterns."

## The Three Pillars

### Scope & Closures
- Lexical scope determined at author time, not runtime
- Closures = functions that remember their lexical scope
- Scope chain is one-way: inner → outer → global

### this & Object Prototypes
- `this` determined by call-site, not definition
- Four rules: new > explicit (call/apply/bind) > implicit (obj.fn) > default
- Prototype is delegation, not inheritance

### Types & Coercion
- Variables don't have types; values do
- Falsy: `false`, `0`, `""`, `null`, `undefined`, `NaN`

## this Binding Decision Tree

```
new used? → this = new object
call/apply/bind? → this = specified object
context object (obj.fn())? → this = context object
strict mode? → this = undefined
sloppy mode? → this = globalThis
Arrow function? → lexical this (inherits from enclosing)
```

## Common Gotcha: Loop Closure

```javascript
// BUG: prints 3, 3, 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}

// FIX: let creates new binding per iteration
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}
```

## Debugging Checklist

1. What is `this` at the call-site?
2. Is a closure capturing a variable?
3. Is coercion happening?
4. Is prototype chain being traversed?
5. Sync or async? Event loop state?
6. Strict mode?

## When to Use

- Debugging complex runtime behavior
- `this` binding issues
- Closure/scope mysteries
- Prototype chain confusion
- "Why does JavaScript do this?"

## HARD GATES (mandatory before writing code)

- [ ] **`this` binding audit:** For every use of `this`, verify the binding context. Arrow functions for callbacks (lexical `this`), regular functions for methods. If unsure, use arrow functions.
- [ ] **Closure leak check:** For every closure that captures variables, verify: does the captured variable's lifetime match the closure's lifetime? Long-lived closures capturing large objects = memory leak.
- [ ] **Event loop awareness:** Every long-running synchronous operation (>50ms) should be async or worker-based. Blocking the event loop blocks ALL requests.
- [ ] **Prototype safety:** No monkey-patching of built-in prototypes (Array.prototype, Object.prototype). Ever.

## Concrete Checks (MUST ANSWER)

1. **For every use of `this`, what is the call-site binding?** List each `this` reference. Is it inside an arrow function (lexical binding), a method call (implicit binding), or a standalone function (default binding)? If a regular function is passed as a callback, `this` will NOT be the object -- use an arrow function or `.bind()`.
2. **Do any closures capture variables that outlive their usefulness?** For each closure (function inside function): what variables does it close over? If a closure is stored long-term (event handler, cache, singleton) and captures a large object, DOM node, or module scope, it is a memory leak. Capture only what you need.
3. **Is there any code that blocks the event loop for >50ms?** Search for: synchronous file reads (`readFileSync`), tight loops over large datasets, `JSON.parse` on large strings, or heavy computation without yielding. Each one blocks ALL other operations. Move to async or a worker.
4. **Are `var` declarations used inside loops?** Search for `for (var`. Each is a closure-over-shared-variable bug waiting to happen. Replace with `let`.
5. **Does any code modify built-in prototypes?** Search for `Array.prototype.`, `Object.prototype.`, `String.prototype.` followed by `=`. If found, delete it. This breaks all code that depends on standard behavior.
