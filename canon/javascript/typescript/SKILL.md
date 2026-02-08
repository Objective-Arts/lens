---
name: typescript
description: "Advanced TypeScript"
---

# Boris Cherny TypeScript Principles

Applying Boris Cherny's TypeScript expertise from "Programming TypeScript" (O'Reilly) and his work on developer tools. Type safety is a feature, not a burden.

---

## Core Philosophy

### Let TypeScript Work For You

> "The goal isn't to annotate everything—it's to annotate the minimum necessary and let TypeScript infer the rest."

TypeScript's power comes from its type inference. Over-annotating defeats the purpose.

```typescript
// OVER-ANNOTATED: Fighting TypeScript
const numbers: Array<number> = [1, 2, 3];
const doubled: Array<number> = numbers.map((n: number): number => n * 2);

// IDIOMATIC: Let inference work
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2);
// TypeScript knows: number[] → number[]
```

### Types as Documentation

Types should tell the story of what code does. If you need comments to explain types, the types aren't clear enough.

```typescript
// UNCLEAR: What does this do?
type T = { [K in keyof U]: U[K] extends F ? K : never }[keyof U];

// CLEAR: Self-documenting
type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

// Usage is obvious
type ArrayMethods = MethodNames<Array<unknown>>;
// "push" | "pop" | "map" | "filter" | ...
```

---

## Type Inference Patterns

### Const Assertions for Literal Types

```typescript
// Without const: types widen
const config = {
  endpoint: '/api/users',
  method: 'GET'
};
// Type: { endpoint: string; method: string }

// With const: types stay narrow
const config = {
  endpoint: '/api/users',
  method: 'GET'
} as const;
// Type: { readonly endpoint: "/api/users"; readonly method: "GET" }

// Perfect for discriminated unions
const actions = ['increment', 'decrement', 'reset'] as const;
type Action = typeof actions[number]; // "increment" | "decrement" | "reset"
```

### Inference from Usage

```typescript
// Let return types be inferred
function createUser(name: string, age: number) {
  return {
    id: crypto.randomUUID(),
    name,
    age,
    createdAt: new Date()
  };
}
// TypeScript infers the full return type

// Extract it when needed
type User = ReturnType<typeof createUser>;
```

### Generic Inference

```typescript
// Don't specify what can be inferred
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// TypeScript infers T from usage
first([1, 2, 3]);        // T inferred as number
first(['a', 'b']);       // T inferred as string
first([{ id: 1 }]);      // T inferred as { id: number }
```

---

## Generic Patterns

### Constrained Generics

```typescript
// Constrain to ensure properties exist
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 30 };
getProperty(user, 'name');  // string
getProperty(user, 'age');   // number
getProperty(user, 'email'); // Error: 'email' not in keyof user
```

### Generic Defaults

```typescript
// Provide sensible defaults
type Container<T = unknown> = {
  value: T;
  timestamp: Date;
};

// Can use without specifying
const box: Container = { value: 'anything', timestamp: new Date() };

// Or be specific
const numberBox: Container<number> = { value: 42, timestamp: new Date() };
```

### Generic Factories

```typescript
// Factory function with generic constraints
function createStore<State extends object>(initialState: State) {
  let state = initialState;

  return {
    getState: () => state,
    setState: (newState: Partial<State>) => {
      state = { ...state, ...newState };
    },
    subscribe: (listener: (state: State) => void) => {
      // Implementation
    }
  };
}

// Type-safe store creation
const userStore = createStore({ name: '', loggedIn: false });
userStore.setState({ name: 'Alice' });  // OK
userStore.setState({ invalid: true });  // Error
```

---

## Mapped Types

### Transform Object Types

```typescript
// Make all properties optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties required
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Custom: Make all properties nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
```

### Key Remapping

```typescript
// Prefix all keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K];
};

type User = { name: string; age: number };
type PrefixedUser = Prefixed<User, 'user_'>;
// { user_name: string; user_age: number }

// Filter keys by value type
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
```

---

## Conditional Types

### Type-Level Branching

```typescript
// Basic conditional
type IsString<T> = T extends string ? true : false;

// Extract from unions
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

// Practical example: extract function parameters
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
type ReturnType<T> = T extends (...args: any) => infer R ? R : never;
```

### Distributive Conditionals

```typescript
// Distributes over unions automatically
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[] (not (string | number)[])

// Prevent distribution with tuple wrapper
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNonDist<string | number>;
// (string | number)[]
```

### Infer Keyword

```typescript
// Extract inner types
type Unpacked<T> =
  T extends Array<infer U> ? U :
  T extends Promise<infer U> ? U :
  T extends (...args: any) => infer U ? U :
  T;

type A = Unpacked<string[]>;           // string
type B = Unpacked<Promise<number>>;    // number
type C = Unpacked<() => boolean>;      // boolean
type D = Unpacked<string>;             // string
```

---

## Discriminated Unions

### Exhaustive Pattern Matching

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      // Exhaustiveness check
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

### Result Types

```typescript
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: 'Division by zero' };
  }
  return { success: true, value: a / b };
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.value); // TypeScript knows: number
} else {
  console.log(result.error); // TypeScript knows: string
}
```

---

## Function Types

### Overloads for Complex Signatures

```typescript
// Overloads for different behaviors
function createElement(tag: 'a'): HTMLAnchorElement;
function createElement(tag: 'canvas'): HTMLCanvasElement;
function createElement(tag: 'div'): HTMLDivElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const anchor = createElement('a');     // HTMLAnchorElement
const canvas = createElement('canvas'); // HTMLCanvasElement
const div = createElement('div');       // HTMLDivElement
```

### Type Guards

```typescript
// User-defined type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Assertion function
function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Not a number');
  }
}

// Usage
function process(input: unknown) {
  if (isString(input)) {
    console.log(input.toUpperCase()); // TypeScript knows: string
  }

  assertIsNumber(input);
  console.log(input.toFixed(2)); // TypeScript knows: number
}
```

---

## Module Patterns

### Barrel Exports

```typescript
// types/index.ts - Central type exports
export type { User, UserRole } from './user';
export type { Product, ProductCategory } from './product';
export type { Order, OrderStatus } from './order';

// Usage: Clean imports
import type { User, Product, Order } from './types';
```

### Type-Only Imports

```typescript
// Explicitly import types (helps tree-shaking)
import type { User } from './user';
import { createUser } from './user';

// Or combined
import { createUser, type User } from './user';
```

---

## Best Practices

### Prefer Interfaces for Objects

```typescript
// Interfaces: extensible, better error messages
interface User {
  id: string;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}

// Types: for unions, intersections, mapped types
type ID = string | number;
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### Avoid `any`, Embrace `unknown`

```typescript
// BAD: any disables type checking
function parse(json: string): any {
  return JSON.parse(json);
}

// GOOD: unknown requires type narrowing
function parse(json: string): unknown {
  return JSON.parse(json);
}

const data = parse('{"name": "Alice"}');
// Must narrow before use
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log(data.name);
}
```

### Use `satisfies` for Validation

```typescript
// satisfies: validates type while preserving inference
const config = {
  endpoint: '/api',
  timeout: 5000,
  retries: 3
} satisfies Record<string, string | number>;

// Type is preserved as literal
config.endpoint; // Type: "/api" (not string)
config.timeout;  // Type: 5000 (not number)
```

---

## When to Apply

| Scenario | Apply Cherny |
|----------|--------------|
| Designing type-safe APIs | Yes - generic patterns |
| Type-level programming | Yes - conditionals, mapped types |
| Reducing type annotations | Yes - leverage inference |
| Complex function signatures | Yes - overloads, guards |
| React component types | Partially - see react-state for React specifics |
| Build configuration | No - see reactivity |

---

## Source Material

- "Programming TypeScript" (O'Reilly, 2019)
- TypeScript documentation contributions
- Conference talks on type-level programming
- Open source TypeScript projects

