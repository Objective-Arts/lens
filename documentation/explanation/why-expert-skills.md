---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Why Expert Skills?

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

Even with explicit requirements, Claude's code remains **generic**—following the letter without the spirit. A developer who has internalized Effective Java produces better code not because they know more, but because they've adopted a **lens** that filters every decision. Claude has access to more knowledge than any developer. But without a lens, that knowledge remains inert.

---

## What a Lens Does

### 1. Focuses Attention

With the java skill active, Claude sees opportunities for static factories, the need for ThreadLocal with SimpleDateFormat, and the wrongness of mutable return values. Without it, these patterns exist in Claude's knowledge but don't surface.

### 2. Shapes Interpretation

A constructor through the java lens: "Should this be a static factory?"
A data structure through the data-first lens: "Is this the right data representation?"
An API through the simplicity lens: "Is this interface minimal and composable?"

### 3. Guides Decisions

Without a lens: "Both approaches work, I'll pick one."
With the java lens: "Best practice says prefer ThreadLocal—I'll use that."

---

## Why Skills, Not "Best Practices"?

"Best practices" are generic and context-free. Skills embody **judgment**—knowing when and how to apply principles, and when to break them.

The java skill doesn't just say "prefer immutability." It explains:
- When (value types, thread-shared objects)
- Why (simpler reasoning, thread safety)
- How (defensive copies, unmodifiable wrappers)
- And when to break the rule (performance-critical inner loops)

Skills provide **concrete, actionable principles** with examples and rationale.

### What Makes a Good Skill?

| Criterion | Why It Matters |
|-----------|----------------|
| **Published, citable principles** | Encode what experts wrote |
| **Demonstrated impact** | Widespread adoption |
| **Specific techniques** | Implementation patterns |
| **Clear scope** | Known domain |
| **No vibes** | Citable or excluded |

---

## The Three-Layer Stack

Skills organize into three layers:

### Baseline Brain (Always Active)

Ten core skills that shape HOW you think:

- **clarity**: Clear code above all
- **pragmatism**: Get it working first
- **simplicity**: Small interfaces, composition
- **composition**: Unix philosophy, do one thing well
- **distributed**: Design for failure
- **data-first**: Data structures first
- **correctness**: Correctness by construction
- **algorithms**: Algorithmic rigor, literate programming
- **abstraction**: Substitution principle, type contracts
- **optimization**: Measure before optimizing

These provide **productive tensions**:
- pragmatism (get it working) vs. correctness (rigor)
- data-first (direct) vs. simplicity (abstract)

Claude must choose based on context. Prototyping? Lean pragmatism. Production auth? Lean correctness.

### Base Practices (Always Active)

WHAT you check for, regardless of domain:

- **Security**: security-mindset, owasp
- **Testing**: react-test, test-doubles, legacy
- **Documentation**: docs
- **Engineering Philosophy**: failure, safety, resilience

### Domain Skills (Per Project)

WHERE-specific expertise:

- Java? java skill
- React? react-state skill
- C#? csharp-depth, async skills
- D3? d3, charts skills
- UI/UX? components, usability, design, visual (12 skills total)

---

## How It Works in Practice

When you apply a profile like `javascript+react`, Claude's perspective shifts:

```
WITHOUT LENS           WITH LENS
─────────────         ─────────────
General React     →   React through react-state lens
"Components work"     "Composition over inheritance"

General async     →   Async through js-internals lens
"Promise resolves"    "Event loop, microtask queue"

General security  →   Security through security-mindset lens
"Input validated"     "What could an attacker do here?"

General dialog    →   Dialog through personas lens
"Shows message"       "Undo over confirmation, eliminate excise"

General CSS       →   CSS through design lens
"Looks fine"          "3 colors max, 4px grid, less but better"

General design    →   Design through failure lens
"This works"          "What failures shaped this? What will fail?"

General arch      →   Architecture through resilience lens
"Efficient"           "Fragile. Where's the redundancy? The optionality?"
```

This isn't about knowing more. It's about **seeing differently**.

---

## The Result

Code that passes Claude's own expert-lens review is code that survives external review. Instead of:

> "This works but has issues..."

You get:

> "This follows established patterns consistently."

That's the value of expert skills: transforming Claude's vast knowledge into applied expertise.

---

## Further Reading

- [How Skills Get Loaded](how-skills-load.md) — The 4-layer loading system
