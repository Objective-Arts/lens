# Why Canon Masters?

*Understanding the philosophy behind expert lenses.*

---

## The Problem We're Solving

Claude Code produces **working code**. But "working" isn't enough.

When external reviewers examine Claude's output—whether AI tools like Gemini and Qodana, or human experts—they consistently flag the same issues:

- 150-line functions doing 8 different things
- Data processing mixed with rendering logic
- Inconsistent patterns (innerHTML here, data-join there)
- Generic code that doesn't follow framework idioms
- Missing thread-safety considerations

This isn't a capability problem. Claude *knows* about single responsibility, separation of concerns, and framework best practices. The issue is **optimization target**: Claude optimizes for "satisfies the request" rather than "survives expert review."

---

## Knowledge vs. Perspective

Here's the deeper insight: even with explicit requirements, Claude's code remains **generic**. It follows the letter of the rules without the spirit.

Consider two developers who have both read Effective Java:

**Developer A** read it once, remembers some items, applies them when consciously thinking about it.

**Developer B** has internalized Bloch's perspective. When they see code, they automatically think: "Would this survive Bloch's review? What items apply here?"

Developer B produces better Java—not because they know more, but because they've adopted a **lens** that filters all their decisions.

Claude has access to more knowledge than any developer. But without a lens, that knowledge remains inert—available but not applied.

---

## What a Lens Does

A lens does three things:

### 1. Focuses Attention

You see what the lens reveals, not everything equally.

With the Bloch lens active, Claude sees:
- Opportunities for static factories
- The need for ThreadLocal with SimpleDateFormat
- The wrongness of mutable return values

Without it, these patterns exist in Claude's knowledge but don't surface.

### 2. Shapes Interpretation

The same code looks different through different lenses.

A constructor through Bloch's lens: "Should this be a static factory instead?"
A data structure through Linus's lens: "Is this the right data representation?"
An API through Pike's lens: "Is this interface minimal and composable?"

### 3. Guides Decisions

When choices arise, the lens provides criteria.

Without a lens: "Both approaches work, I'll pick one."
With Bloch's lens: "Item 17 says prefer ThreadLocal—I'll use that."

---

## Why Masters, Not "Best Practices"?

"Best practices" are generic and context-free. Masters embody **judgment**—knowing when and how to apply principles, and when to break them.

Bloch doesn't just say "prefer immutability." He explains:
- When (value types, thread-shared objects)
- Why (simpler reasoning, thread safety)
- How (defensive copies, unmodifiable wrappers)
- And when to break the rule (performance-critical inner loops)

He provides **items**—concrete, numbered, actionable principles with examples and rationale.

### What Makes Someone Canon?

Masters must meet criteria:

| Criterion | Why It Matters |
|-----------|----------------|
| **Published, citable principles** | We encode what they wrote, not our interpretation |
| **Demonstrated impact** | Validated by widespread adoption |
| **Specific techniques** | Not just philosophy—implementation patterns |
| **Clear scope** | Known domain of expertise |
| **No vibes** | If we can't cite it, we don't include it |

---

## The Three-Layer Stack

Canon organizes into three layers:

### Baseline Brain (Always Active)

Six masters that shape HOW you think:

- **Kernighan**: Clarity above all
- **Thompson**: Pragmatism, get it working
- **Pike**: Small interfaces, composition
- **Joy**: Design for failure
- **Linus**: Data structures first
- **Dijkstra**: Correctness by construction

These provide **productive tensions**:
- Thompson (pragmatism) vs. Dijkstra (rigor)
- Linus (direct) vs. Pike (abstract)

Claude must choose based on context. Prototyping? Lean Thompson. Production auth? Lean Dijkstra.

### Base Practices (Always Active)

WHAT you check for, regardless of domain:

- **Security**: Schneier, OWASP
- **Testing**: Dodds, Meszaros, Feathers
- **Documentation**: Procida

### Domain Canon (Per Project)

WHERE-specific expertise:

- Java? Bloch
- React? Abramov
- C#? Skeet, Cleary, Hejlsberg
- D3? Bostock, Tufte

---

## How It Works in Practice

When you apply a profile like `javascript+react`, Claude's perspective shifts:

```
WITHOUT LENS           WITH LENS
─────────────         ─────────────
General React     →   React through Abramov's eyes
"Components work"     "Composition over inheritance"

General async     →   Async through Simpson's eyes
"Promise resolves"    "Event loop, microtask queue"

General security  →   Security through Schneier's eyes
"Input validated"     "What could an attacker do here?"
```

This isn't about knowing more. It's about **seeing differently**.

---

## The Result

Code that passes Claude's own expert-lens review is code that survives external review. Instead of:

> "This works but has issues..."

You get:

> "This follows established patterns consistently."

That's the value of canon masters: transforming Claude's vast knowledge into applied expertise.

---

## Further Reading

- [The Three-Layer Canon Stack](three-layer-stack.md) - Detailed layer explanation
- [Quality Through Perspective](quality-through-perspective.md) - How lenses compound
- [Canon Masters Reference](../reference/canon-catalog.md) - Complete catalog
