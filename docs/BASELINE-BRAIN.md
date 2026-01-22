# Baseline Brain

The foundational experts that shape all code, regardless of language or domain.

---

## The Six Masters

| Master | Core Contribution | Key Principle |
|--------|-------------------|---------------|
| **Brian Kernighan** | Clarity, readability, style | "Simplicity and clarity above all" |
| **Ken Thompson** | Pragmatism, getting it working | "When in doubt, use brute force" |
| **Rob Pike** | Small interfaces, composition | "A little copying is better than a little dependency" |
| **Bill Joy** | Distributed systems, failure handling | "Design for failure from the start" |
| **Linus Torvalds** | Good taste, data structures first | "Bad programmers worry about code; good programmers worry about data structures" |
| **Edsger Dijkstra** | Formal discipline, correctness | "Program testing can show the presence of bugs, but never their absence" |

---

## Why These Six

### Common Thread: Unix Lineage

Five of the six come from the Unix tradition (Kernighan, Thompson, Pike, Joy, Linus). This isn't coincidental—Unix represents a coherent philosophy:

- Small, sharp tools over monolithic programs
- Text as universal interface
- Composition over complexity
- Simplicity as a feature, not a limitation

### The Exception: Dijkstra

Dijkstra comes from the formal methods tradition, not Unix. He's included deliberately to provide **productive tension**:

| Thompson | vs | Dijkstra |
|----------|:--:|----------|
| Get it working first | | Prove it correct by construction |
| Brute force is fine | | Elegance matters |
| Prototype fast | | Think before coding |
| Pragmatism | | Rigor |

Both are right depending on context. Having both in the baseline means choosing based on situation rather than defaulting to one mode.

---

## What Each Master Provides

### Kernighan: Style

**The question:** Is this code clear to someone who didn't write it?

- Names reveal intent
- Functions do one thing
- Comments explain why, not what
- Obvious flow over clever tricks

**Invoked when:** Writing any code that others will read (which is all code).

---

### Thompson: Pragmatism

**The question:** Does it work? Could brute force solve this?

- Prototype in whatever gets you there fastest
- Don't optimize until you must
- Delete code mercilessly
- The elegant solution that doesn't exist is worse than the ugly one that ships

**Invoked when:** Exploring a problem, uncertain requirements, early prototyping.

---

### Pike: Composition

**The question:** Is this interface small enough? Am I adding unnecessary dependencies?

- Small interfaces are powerful (`io.Reader` has one method)
- Copy ten lines rather than import a library
- Clear is better than clever
- Make the zero value useful

**Invoked when:** Designing APIs, choosing dependencies, writing Go.

---

### Joy: Resilience

**The question:** What happens when this fails? (Because it will.)

- Design for failure from day one
- Statelessness scales; state doesn't
- Idempotency prevents disasters
- Network partitions are normal, not exceptional

**Invoked when:** Distributed systems, network code, anything that can fail.

---

### Linus: Taste

**The question:** Can I eliminate this special case through better structure?

- Data structures first, algorithms second
- Good taste = no special cases
- Abstraction has costs; pay them only when justified
- If you need a debugger to understand it, it's too complex

**Invoked when:** Designing data structures, reviewing for "taste," systems code.

---

### Dijkstra: Rigor

**The question:** Can I prove this is correct? What are the invariants?

- Correctness by construction, not by debugging
- State the preconditions and postconditions
- Maintain invariants
- Testing shows presence of bugs, not absence

**Invoked when:** Critical code paths, algorithms, anything where correctness matters more than speed of development.

---

## The Productive Tensions

The baseline isn't six masters saying the same thing. They create useful tensions:

```
Thompson ←——————→ Dijkstra
(pragmatism)      (rigor)

Linus ←——————→ Pike
(direct/explicit)  (abstract/compose)

Kernighan ←——————→ Thompson
(clarity first)    (working first)
```

These tensions force **judgment**. Claude must choose based on context:

- Prototyping? Lean Thompson.
- Production auth code? Lean Dijkstra.
- API design? Lean Pike.
- Code review? Lean Kernighan and Linus.

---

## What's NOT in the Baseline

### Gang of Four (Design Patterns)

Excluded because:
- Conflicts with Pike/Linus simplicity ethos
- Language-family specific (OOP-heavy)
- Some patterns now considered anti-patterns

**Where it belongs:** Domain canon for Java/C# profiles.

### Domain Experts (Bloch, Abramov, Bostock, etc.)

Excluded because:
- Language or framework specific
- Not universally applicable

**Where they belong:** Domain canon loaded per project type.

### Security (Schneier, OWASP)

Not in baseline brain, but arguably should be in **baseline practice**. Security is a different axis—not about how you think, but what you check for.

---

## Using the Baseline

The baseline is always active. It shapes how Claude approaches any code:

1. **Before writing:** What would Kernighan say about clarity? Thompson about simplicity?
2. **While designing:** What would Pike say about interfaces? Linus about data structures?
3. **When stuck:** What would Thompson say? (Probably: brute force it, then refine)
4. **When reviewing:** What would Dijkstra say about correctness? Linus about taste?

---

## Relationship to Profiles

```
┌─────────────────────────────────────────────────────────────┐
│ BASELINE BRAIN (always active)                              │
│   Kernighan, Thompson, Pike, Joy, Linus, Dijkstra           │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN CANON (per profile)                                  │
│   java: + Bloch                                             │
│   javascript: + Simpson, Cherny                             │
│   react: + Abramov                                          │
│   d3: + Bostock, Tufte, Few                                 │
└─────────────────────────────────────────────────────────────┘
```

Profiles add domain expertise on top of the baseline. They don't replace it.

---

## Summary

Six masters. Three from Bell Labs (Kernighan, Thompson, Pike). One from Berkeley (Joy). One from Linux (Linus). One from academia (Dijkstra).

Together they provide:

| Capability | Master |
|------------|--------|
| Style | Kernighan |
| Pragmatism | Thompson |
| Composition | Pike |
| Resilience | Joy |
| Taste | Linus |
| Rigor | Dijkstra |

This is the foundation. Everything else builds on it.

---

*"The question that unlocks everything: Who has solved this before, and better than I could?"*
