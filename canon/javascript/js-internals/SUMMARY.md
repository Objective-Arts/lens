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
