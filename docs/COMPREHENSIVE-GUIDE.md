# Claude-Optimal: Comprehensive Guide

> A deep treatment of making Claude Code produce expert-quality code through explicit standards and master perspectives.

---

# Introduction

## The Problem We're Solving

Claude Code produces **working code**. But "working" isn't enough.

When external reviewers examine Claude's output—whether AI tools like Codex, Gemini, and Qodana, or human experts—they consistently flag the same issues:

- 150-line functions doing 8 different things
- Data processing mixed with rendering logic
- Inconsistent patterns (innerHTML here, data-join there)
- Generic code that doesn't follow framework idioms
- Missing thread-safety considerations
- Calculations embedded in presentation code

This isn't a capability problem. Claude *knows* about single responsibility, separation of concerns, and framework best practices. The issue is **optimization target**: Claude optimizes for "satisfies the request" rather than "survives expert review."

Without explicit quality standards, Claude picks "good enough." With explicit standards, Claude produces reviewable code.

## The Two Core Insights

### Insight 1: Quality Must Be Explicit

Claude has access to vast knowledge about software engineering best practices. But knowledge isn't the same as application. When you ask Claude to "build a timeline view," it produces something that works. It doesn't spontaneously:

- Decompose into single-responsibility functions
- Separate data preparation from rendering
- Apply framework-specific idioms
- Consider thread safety
- Match existing codebase patterns

These qualities emerge only when explicitly required. Claude-Optimal makes them explicit.

### Insight 2: Perspective Matters More Than Knowledge

Here's the deeper insight: even with explicit requirements, Claude's code remains **generic**. It follows the letter of the rules without the spirit. The code is correct but not expert.

The difference between generic code and expert code isn't what you know—it's **whose lens you apply**.

```
WITHOUT LENS           WITH LENS
─────────────         ─────────────
General Java      →   Java through Bloch's eyes
"Works correctly"     "Effective Java patterns"

General D3        →   D3 through Bostock's eyes
"Renders data"        "Idiomatic selections"

General React     →   React through Abramov's eyes
"Components work"     "Composition over inheritance"
```

A lens isn't knowledge—it's a **perspective that shapes decisions**. When you read code through Bloch's lens, you see opportunities for static factories, recognize the need for ThreadLocal, and feel the wrongness of mutable return values. Without that lens, you might know these patterns exist but not recognize where they apply.

---

# Part I: The Canon-Master Strategy

## The Philosophical Foundation

### Why Perspective > Knowledge

Consider two developers, both of whom have read Effective Java:

**Developer A** read it once, remembers some items, applies them when consciously thinking about it.

**Developer B** has internalized Bloch's perspective. When they see code, they automatically think: "Would this survive Bloch's review? What items apply here?"

Developer B produces better Java—not because they know more, but because they've adopted a **lens** that filters all their decisions.

Claude has access to more knowledge than any developer. But without a lens, that knowledge remains inert—available but not applied. The canon-master strategy gives Claude lenses.

### The Lens Metaphor

A lens does three things:

1. **Focuses attention**: You see what the lens reveals, not everything equally
2. **Shapes interpretation**: The same code looks different through different lenses
3. **Guides decisions**: When choices arise, the lens provides criteria

When Claude writes Java with the Bloch lens active, it:
- **Focuses** on API design, immutability, method signatures
- **Interprets** a constructor as an opportunity for a static factory
- **Decides** to use ThreadLocal for SimpleDateFormat because Item 17 is present

Without the lens, Claude might write correct code that misses these improvements.

### Why Masters, Not Best Practices?

"Best practices" are generic and context-free. Masters embody **judgment**—knowing when and how to apply principles, and when to break them.

Bloch doesn't just say "prefer immutability." He explains when, why, and the specific patterns that achieve it. He provides **items**—concrete, numbered, actionable principles with examples and rationale.

Masters have:
- **Published, citable principles**: Not interpretations or vibes
- **Demonstrated judgment**: Validated by widespread adoption
- **Specific techniques**: Not just philosophy, but implementation patterns
- **Clear scope**: Known domain of expertise

This is why we encode masters, not abstract best practices.

## The Canon Structure

### Three Layers: Baseline Brain + Base Practices + Domain Canon

Every project operates with three layers of canon, all always active:

```
┌─────────────────────────────────────────────────────────────┐
│ BASELINE BRAIN (always active)                              │
│   Six masters that shape HOW you think about code           │
│   Kernighan, Thompson, Pike, Joy, Linus, Dijkstra           │
├─────────────────────────────────────────────────────────────┤
│ BASE PRACTICES (always active)                              │
│   Security, testing, documentation standards                │
│   Schneier, OWASP, Dodds, Procida                           │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN CANON (per project)                                  │
│   Language/framework-specific expertise                     │
└─────────────────────────────────────────────────────────────┘
```

### The Baseline Brain

The Baseline Brain is the foundational layer—six masters whose perspectives shape all code, regardless of language or domain:

| Master | Core Contribution | Key Principle |
|--------|-------------------|---------------|
| **Brian Kernighan** | Clarity, readability, style | "Simplicity and clarity above all" |
| **Ken Thompson** | Pragmatism, getting it working | "When in doubt, use brute force" |
| **Rob Pike** | Small interfaces, composition | "A little copying is better than a little dependency" |
| **Bill Joy** | Distributed systems, failure handling | "Design for failure from the start" |
| **Linus Torvalds** | Good taste, data structures first | "Bad programmers worry about code; good programmers worry about data structures" |
| **Edsger Dijkstra** | Formal discipline, correctness | "Program testing can show the presence of bugs, but never their absence" |

Five come from the Unix tradition (Kernighan, Thompson, Pike, Joy, Linus). Dijkstra comes from formal methods—providing **productive tension**:

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

### Base Practices

Base practices apply to all software, regardless of domain:

- **Security mindset** (Schneier) - Think like an attacker
- **Vulnerability awareness** (OWASP) - Know the patterns to avoid
- **Testing philosophy**:
  - **Dodds** - Testing Trophy, Testing Library
  - **Meszaros** - xUnit Test Patterns (test doubles, setup patterns)
  - **Feathers** - Working Effectively with Legacy Code (characterization tests)
- **Documentation structure** (Procida) - Right doc type for the purpose

### Domain Canon

Domain canon provides language and framework-specific expertise:
- Language idioms (Bloch for Java, Simpson for JS)
- Framework patterns (Abramov for React, Bostock for D3)
- Specialized expertise (Tufte for visualization design)

All three layers are **always alive**. They're not invoked per-task—they form the persistent lens through which all work is viewed.

### Why Three Layers?

**Baseline Brain** shapes HOW you think:
- What makes code "good"? (Kernighan, Linus)
- When to be pragmatic vs. rigorous? (Thompson vs. Dijkstra)
- How to design interfaces? (Pike)
- How to handle failure? (Joy)

**Base Practices** define WHAT you check for:
- Security vulnerabilities (Schneier, OWASP)
- Test coverage and strategy (Dodds)
- Documentation completeness (Procida)

**Domain Canon** provides WHERE-specific expertise:
- Java? Apply Bloch's patterns
- D3? Apply Bostock's data-join philosophy
- React? Apply Abramov's mental models

The three-layer structure separates thinking patterns, quality practices, and domain expertise.

### Software Canon Stack

```
SOFTWARE PROJECTS
┌─────────────────────────────────────────────────────────────┐
│ BASELINE BRAIN (always active - shapes HOW you think)       │
│                                                             │
│   Kernighan - Clarity, readability, style                   │
│   Thompson - Pragmatism, "when in doubt, use brute force"   │
│   Pike - Small interfaces, composition                      │
│   Joy - Distributed systems, failure handling               │
│   Linus - Good taste, data structures first                 │
│   Dijkstra - Formal discipline, correctness                 │
├─────────────────────────────────────────────────────────────┤
│ BASE PRACTICES (always active - defines WHAT you check for) │
│                                                             │
│   SECURITY                                                  │
│   ├── Schneier - Security mindset                           │
│   │   Think like an attacker, threat model first            │
│   │                                                         │
│   ├── OWASP - Vulnerability patterns                        │
│   │   Injection, XSS, CSRF, auth failures                   │
│   │                                                         │
│   TESTING                                                   │
│   ├── Dodds - Testing Trophy                                │
│   │   Integration > Unit > E2E                              │
│   │   Test behavior, not implementation                     │
│   │                                                         │
│   ├── Meszaros - xUnit Test Patterns                        │
│   │   Test doubles: stub, spy, mock, fake                   │
│   │   Setup patterns, test organization                     │
│   │                                                         │
│   ├── Feathers - Working Effectively with Legacy Code       │
│   │   Characterization tests, seams, safe refactoring       │
│   │                                                         │
│   DOCUMENTATION                                             │
│   └── Procida - Diátaxis framework                          │
│       Tutorials, how-tos, reference, explanation            │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN CANON (per project - provides WHERE-specific)        │
│                                                             │
│   JAVA                                                      │
│   ├── Bloch - Effective Java                                │
│   │   Static factories, immutability, defensive copies      │
│   │                                                         │
│   JAVASCRIPT                                                │
│   ├── Simpson - You Don't Know JS                           │
│   │   Closures, this binding, async patterns                │
│   │                                                         │
│   ├── Cherny - Programming TypeScript                       │
│   │   Type-level programming, generics, inference           │
│   │                                                         │
│   ├── Crockford - JavaScript: The Good Parts               │
│   │   Avoiding bad parts, disciplined subset                │
│   │                                                         │
│   REACT                                                     │
│   ├── Abramov - React mental models                         │
│   │   Composition, hooks, unidirectional flow               │
│   │                                                         │
│   D3/VISUALIZATION                                          │
│   ├── Bostock - D3 patterns                                 │
│   │   Selections, data-joins, scales, transitions           │
│   │                                                         │
│   ├── Tufte - Visual Display of Quantitative Information    │
│   │   Data-ink ratio, chartjunk, small multiples            │
│   │                                                         │
│   ├── Few - Information Dashboard Design                    │
│   │   Clarity, context, comparison                          │
│   │                                                         │
│   ANGULAR                                                   │
│   ├── Hevery - Angular architecture                         │
│   │   Dependency injection, change detection, signals       │
│   │                                                         │
│   ├── Papa - Angular style guide                            │
│   │   File structure, naming, patterns                      │
│   │                                                         │
│   GO                                                        │
│   └── Pike - Go Proverbs (note: Pike also in Baseline Brain)│
│       Applied specifically to Go idioms                     │
└─────────────────────────────────────────────────────────────┘
```

### Business Canon Stack

```
BUSINESS PROJECTS
┌─────────────────────────────────────────────────────────────┐
│ BASE CANON (always active)                                  │
│                                                             │
│   WRITING CLARITY                                           │
│   ├── Strunk & White - Elements of Style                    │
│   │   Omit needless words, active voice                     │
│   │   Clarity through brevity                               │
│   │                                                         │
│   ├── Zinsser - On Writing Well                             │
│   │   Simplicity, clutter removal, humanity                 │
│   │   Writing as thinking                                   │
│   │                                                         │
│   MANAGEMENT                                                │
│   └── Grove - High Output Management                        │
│       Leverage, output orientation, meetings that work      │
│       Management as production                              │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN CANON (selected per focus)                           │
│                                                             │
│   STRATEGY                                                  │
│   ├── Porter - Competitive Advantage                        │
│   │   Five Forces, value chains, generic strategies         │
│   │   The foundation of strategic thinking                  │
│   │                                                         │
│   ├── Rumelt - Good Strategy Bad Strategy                   │
│   │   Kernel of strategy, coherent actions                  │
│   │   Distinguishing real strategy from fluff               │
│   │                                                         │
│   ├── Helmer - 7 Powers                                     │
│   │   Scale, network effects, switching costs               │
│   │   Durable competitive advantage                         │
│   │                                                         │
│   TECH ANALYSIS                                             │
│   ├── Thompson - Stratechery                                │
│   │   Aggregation theory, platform dynamics                 │
│   │   Tech industry strategic patterns                      │
│   │                                                         │
│   STARTUPS/ORG                                              │
│   └── Horowitz - The Hard Thing About Hard Things           │
│       Peacetime/wartime CEO, hard decisions                 │
│       Operational wisdom from the trenches                  │
└─────────────────────────────────────────────────────────────┘
```

### CS Foundations (Reference Canon)

These masters provide deep foundations, available as reference. Note: Dijkstra is now part of the Baseline Brain (always active), but his full EWD corpus remains available as reference for deeper formal methods work.

```
CS FOUNDATIONS (available as reference)
┌─────────────────────────────────────────────────────────────┐
│ Knuth - Literate Programming, TAOCP                         │
│   Programs for humans, algorithms as craft                  │
│   The art and science of programming                        │
│                                                             │
│ Liskov - Data Abstraction, LSP                              │
│   Substitutability, behavioral contracts                    │
│   Types that mean what they say                             │
│                                                             │
│ Carmack - GDC talks, .plan files                            │
│   Performance discipline, focused iteration                 │
│   Shipping high-quality software at scale                   │
│                                                             │
│ McIlroy - Unix Philosophy                                   │
│   Do one thing well, composition                            │
│   Pipes and filters                                         │
└─────────────────────────────────────────────────────────────┘
```

## How Canon Shapes Code: Extended Examples

### Example 1: Java Through Bloch's Lens

**Scenario**: Refactoring a date parsing utility

**Without Bloch lens**:
```java
public class DateUtil {
    private SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");

    public Date parse(String dateStr) {
        try {
            return formatter.parse(dateStr);
        } catch (ParseException e) {
            return null;
        }
    }
}
```

This code "works" but has issues Bloch would immediately flag:

**With Bloch lens applied**:

```java
// Bloch Item 4: Enforce noninstantiability with private constructor
public final class DateParser {

    // Bloch Item 17: Prefer ThreadLocal to synchronization
    // SimpleDateFormat is not thread-safe
    private static final ThreadLocal<SimpleDateFormat> FORMATTER =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

    // Bloch Item 4: Private constructor prevents instantiation
    private DateParser() {
        throw new AssertionError("No instances");
    }

    // Bloch Item 1: Consider static factory methods instead of constructors
    // (Applied conceptually - this is a utility, not a value type)
    public static Date parse(String dateStr) {
        // Bloch Item 49: Check parameters for validity
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            return FORMATTER.get().parse(dateStr.trim());
        } catch (ParseException e) {
            return null;
        }
    }
}
```

**What the lens revealed**:
- Thread-safety issue (Item 17)
- Missing non-instantiability enforcement (Item 4)
- Missing parameter validation (Item 49)
- Opportunity for cleaner API design (Item 1 philosophy)

Without the Bloch lens, these improvements might not occur to the developer (or Claude).

### Example 2: D3 Through Bostock's Lens

**Scenario**: Rendering a list of items from data

**Without Bostock lens**:
```javascript
function renderItems(data) {
    const container = document.getElementById('items');
    container.innerHTML = '';

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `<span>${item.name}</span>`;
        div.onclick = () => handleClick(item);
        container.appendChild(div);
    });
}
```

This "works" but violates core D3 philosophy.

**With Bostock lens applied**:

```javascript
function renderItems(data) {
    // Bostock: Data-join pattern - let D3 manage DOM lifecycle
    d3.select('#items')
        .selectAll('.item')
        .data(data, d => d.id)  // Key function for identity
        .join(
            // Enter: new items
            enter => enter.append('div')
                .attr('class', 'item')
                .call(div => div.append('span'))
                .on('click', (event, d) => handleClick(d)),

            // Update: existing items
            update => update,

            // Exit: removed items (handled automatically)
            exit => exit.remove()
        )
        .select('span')
        .text(d => d.name);
}
```

**What the lens revealed**:
- Use data-join, not innerHTML (declarative vs imperative)
- Key function for stable identity
- Enter/update/exit pattern for lifecycle
- Event delegation through D3 instead of per-element handlers
- Separation of structure (join) from content (text)

The Bostock lens doesn't just know about data-joins—it sees innerHTML as wrong and immediately reaches for the selection pattern.

### Example 3: React Through Abramov's Lens

**Scenario**: A component that fetches and displays user data

**Without Abramov lens**:
```jsx
function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/users/${userId}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setLoading(false);
            });
    }, [userId]);

    if (loading) return <Spinner />;
    return (
        <div className="profile">
            <img src={user.avatar} style={{ width: 100, height: 100 }} />
            <h2>{user.name}</h2>
            <p>{user.bio}</p>
        </div>
    );
}
```

**With Abramov lens applied**:

```jsx
// Abramov: Extract data fetching into custom hook
function useUser(userId) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;  // Abramov: Handle race conditions

        setLoading(true);
        setError(null);

        fetch(`/api/users/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (!cancelled) {
                    setUser(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err);
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };  // Cleanup
    }, [userId]);

    return { user, loading, error };
}

// Abramov: Presentational component - receives data, renders UI
function UserProfileView({ user }) {
    return (
        <div className="profile">
            <img src={user.avatar} alt={user.name} width={100} height={100} />
            <h2>{user.name}</h2>
            <p>{user.bio}</p>
        </div>
    );
}

// Abramov: Container component - handles data, delegates rendering
function UserProfile({ userId }) {
    const { user, loading, error } = useUser(userId);

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage error={error} />;
    return <UserProfileView user={user} />;
}
```

**What the lens revealed**:
- Extract data fetching to custom hook (reusability, testability)
- Handle race conditions with cancellation
- Error state (the original silently failed)
- Container/Presentational split
- No inline style objects (causes re-renders)
- Accessibility (alt text, explicit dimensions)

The Abramov lens sees the mixed concerns and immediately separates them.

## Master Selection Criteria

Not everyone is canon. Masters must meet criteria:

### 1. Published, Citable Principles

The master has written books, given talks, or produced code that documents their principles. We encode what they've published, not our interpretation.

**Yes**: Bloch's Effective Java (90 numbered items with rationale)
**No**: "What a senior developer might think"

### 2. Demonstrated Impact

The principles have been validated by widespread adoption and stood the test of time.

**Yes**: Gang of Four patterns (25+ years of influence)
**No**: Blog post with interesting ideas but no validation

### 3. Specific Techniques

The master provides actionable patterns, not just philosophy.

**Yes**: Bostock's data-join pattern (concrete, implementable)
**No**: "Code should be elegant" (true but not actionable)

### 4. Clear Scope

We know what the master is an expert in and don't overextend.

**Yes**: Bloch for Java API design
**No**: Bloch for JavaScript (outside his domain)

### 5. No Vibes

If we can't cite the source, we don't include it.

**Yes**: "Bloch Item 17: ThreadLocal for thread-confinement"
**No**: "Bloch would probably prefer immutability here"

---

# Part II: The Claude-Optimal Methodology

## Overview

Claude-Optimal operationalizes the canon-master strategy through three mechanisms:

| Component | Purpose | Answers |
|-----------|---------|---------|
| **Profiles** | Which expertise to load | "What masters apply to this project?" |
| **Standards** | What good code looks like | "What rules must code follow?" |
| **Flags** | When to enforce | "How do we trigger quality checks?" |

Together, they form a complete system:
- Profiles load the right canon
- Standards define the quality bar
- Flags enforce at runtime

## Profiles: Deep Dive

### What Is a Profile?

A profile is a named configuration that bundles:
- Canon skills (masters to load)
- Agents to enable (code-reviewer, security-auditor, etc.)
- Auto-invoke rules (when to activate which skill)

```yaml
# Example: react profile
name: react
extends: javascript

canon:
  domain:
    - abramov      # React mental models

agents:
  - accessibility-tester

auto_invoke:
  - context: "React components"
    action: "INVOKE /abramov"
```

### Profile Inheritance

Profiles compose through extension:

```
base (implicit)
└── javascript
    ├── react
    │   └── react-native
    ├── angular
    └── d3
        └── d3-dashboard
```

When you apply `d3`, you get:
- Everything from `javascript` (Simpson, Cherny, Crockford)
- Plus D3-specific canon (Bostock, Tufte, Few, Knaflic)

### The Profile Stack

Profiles are designed to stack. Common combinations:

| Project Type | Profile Stack | Canon You Get |
|--------------|---------------|---------------|
| React SPA | `javascript + react` | Simpson, Cherny, Crockford, Abramov |
| React + D3 | `javascript + react + d3` | Simpson, Cherny, Crockford, Abramov, Bostock, Tufte, Few, Knaflic |
| Angular enterprise | `javascript + angular` | Simpson, Cherny, Crockford, Hevery, Papa |
| Java backend | `java` | Bloch |
| Full-stack Java/Angular | `fullstack + angular` | Bloch, Simpson, Cherny, Crockford, Hevery, Papa |

**Note**: Base practices (Schneier, OWASP, Dodds, Meszaros, Feathers, Procida) are always active with any profile.

### Applying Profiles

**With cc-config CLI**:
```bash
# Apply to project
cc-config profile apply javascript+react -p /path/to/project

# Preview what would be applied
cc-config profile show javascript+react

# Dry run (show changes without applying)
cc-config profile apply javascript+react --dry-run -p /path/to/project
```

**What happens when you apply**:
1. Canon skills are symlinked to project `.claude/skills/`
2. Auto-invoke rules are added to project CLAUDE.md
3. Agents are enabled in project settings

**Manual application**:
```bash
# Create skills directory
mkdir -p /path/to/project/.claude/skills

# Symlink canon skills
ln -sf ~/.claude/skills/canon/javascript/simpson .
ln -sf ~/.claude/skills/canon/javascript/abramov .
# etc.
```

### Profile Configuration in CLAUDE.md

After applying, your project CLAUDE.md should include:

```markdown
## Project Type
Software

## Canon Stack (always alive)

### Baseline Brain
Kernighan (clarity), Thompson (pragmatism), Pike (composition), Joy (resilience), Linus (taste), Dijkstra (rigor)

### Base Practices
- Security: Schneier (mindset), OWASP (vulnerabilities)
- Testing: Dodds (Testing Trophy), Meszaros (test patterns), Feathers (legacy)
- Documentation: Procida (Diátaxis)

### Domain Canon
Simpson (JS runtime), Cherny (TypeScript), Crockford (disciplined JS), Abramov (React patterns)

## Auto-Invoke Rules

| Context | Action |
|---------|--------|
| React components | INVOKE /abramov |
| Complex JS logic | INVOKE /simpson |
| TypeScript types | INVOKE /cherny |
| Testing | INVOKE /dodds |
```

## Standards: Deep Dive

### Why Explicit Standards?

Claude knows best practices. But "knowing" isn't "applying."

Standards make quality requirements explicit. When standards are in CLAUDE.md, Claude treats them as requirements, not suggestions.

### Universal Standards

These apply to ALL code, regardless of framework:

#### Function Design

```markdown
## Function Design Standards

### Single Responsibility
- Each function does ONE thing
- If you need "and" to describe it, split it
- Test: Can you name it without using "and"?

### Size Limits
- Maximum 30 lines per function
- If longer, extract helper functions
- Exception: pure data declarations (large objects are fine)

### Naming
- Names describe WHAT, not HOW
- `calculateTotal()` not `loopAndSum()`
- `fetchUser()` not `makeAPICall()`

### Purity
- Prefer pure functions (same input → same output)
- Side effects at the edges, pure logic in the middle
- Test: Could this function be memoized?
```

#### Data Flow

```markdown
## Data Flow Standards

### Pipeline Pattern
All data processing follows: raw → transform → present

```
BAD (mixed):
function render(data) {
    data.forEach(item => {
        const calc = item.a * item.b;  // calculation
        container.innerHTML += `<div>${calc}</div>`;  // presentation
    });
}

GOOD (pipeline):
const enriched = data.map(item => ({
    ...item,
    total: item.a * item.b  // calculation
}));
render(enriched);  // presentation only
```

### Separation of Concerns
- Data fetching: separate functions
- Data transformation: pure functions
- Presentation: receives complete data, touches only DOM/UI
- Never mix levels
```

#### Consistency

```markdown
## Consistency Standards

### Pattern Unity
- One pattern per concern
- NEVER mix innerHTML and data-join
- NEVER mix callbacks and promises in same module
- NEVER mix class and functional components in same feature

### Match Existing
- Before writing, examine existing patterns
- New code matches established patterns EXACTLY
- If pattern is bad, refactor all or match it
- Never create pattern inconsistency
```

### Framework Standards

Each framework has specific idioms. Copy the relevant section to your project CLAUDE.md.

#### D3 Standards

```markdown
## D3 Standards (Non-Negotiable)

### DOM Manipulation
- ALWAYS use `.selectAll().data().join()` for data-driven elements
- NEVER use innerHTML for anything data-bound
- NEVER use document.createElement for D3-managed elements

### Data-Join Pattern
```javascript
// REQUIRED pattern for all data rendering
selection
    .selectAll('.item')
    .data(data, d => d.id)  // Key function required
    .join(
        enter => enter.append('div').attr('class', 'item'),
        update => update,
        exit => exit.remove()
    );
```

### Event Handling
- Attach handlers in .join() enter phase
- Use D3's event handling, not addEventListener
- Event delegation where possible

### Anti-Patterns (Never Do)
- `container.innerHTML = data.map(...)` - Use data-join
- `data.forEach(d => container.appendChild(...))` - Use data-join
- `d3.select(...).html(...)` for data content - Use data-join
```

#### Angular Standards

```markdown
## Angular Standards (Non-Negotiable)

### Subscriptions
- Async pipe ALWAYS over manual subscribe
- If you must subscribe, unsubscribe in ngOnDestroy
- Use takeUntil pattern for complex cases

### Change Detection
- trackBy on ALL *ngFor (no exceptions)
- OnPush strategy for presentational components
- No function calls in template bindings

### Component Architecture
- Smart components: handle data, inject services
- Dumb components: @Input/@Output only, OnPush
- Max 200 lines per component file

### Anti-Patterns (Never Do)
- `.subscribe()` without cleanup
- `*ngFor` without trackBy
- `{{ calculateSomething() }}` in templates
```

#### React Standards

```markdown
## React Standards (Non-Negotiable)

### Component Composition
- Container/Presenter split for data-connected components
- Custom hooks for reusable stateful logic
- Composition over prop drilling

### Performance
- No inline object literals in JSX props
- useCallback for handlers passed to children
- useMemo for expensive calculations
- Keys must be stable identifiers, never indices

### State Management
- Lift state only as high as needed
- Derived state computed, not stored
- useReducer for complex state logic

### Anti-Patterns (Never Do)
- `<Component style={{ margin: 10 }} />` - Creates new object each render
- `<List items={items.filter(...)} />` - Filter in useMemo
- `key={index}` - Use stable identifier
```

### Adding Standards to Your Project

1. Copy universal standards to CLAUDE.md
2. Copy relevant framework standards
3. Add project-specific standards (naming conventions, etc.)

Example project CLAUDE.md structure:

```markdown
# Project: MyApp

## Project Type
Software - React + D3 Dashboard

## Canon Stack
Baseline Brain: Kernighan, Thompson, Pike, Joy, Linus, Dijkstra
Base Practices: Schneier, OWASP, Dodds, Meszaros, Feathers, Procida
Domain: Simpson, Cherny, Crockford, Abramov, Bostock, Tufte

## Standards

### Universal
[Copy from STRUCTURAL-STANDARDS.md]

### React
[Copy React section from FRAMEWORK-TEMPLATES.md]

### D3
[Copy D3 section from FRAMEWORK-TEMPLATES.md]

### Project-Specific
- Component files: PascalCase.tsx
- Hooks: useFeatureName.ts
- Services: featureName.service.ts
```

## Flags: Deep Dive

### What Flags Do

Flags modify Claude's behavior at runtime. They trigger specific workflows that enforce quality at key moments.

### Flag Catalog

Flags can also be used as standalone slash commands for convenience:

| Flag | Command | When to Use | What It Triggers |
|------|---------|-------------|------------------|
| `--structure-first` | *(flag only)* | New features | Plan → Approve → Implement |
| `--plan` | *(flag only)* | Complex features | Full plan mode with .plan.md |
| `--build-from-plan` | `/build-from-plan` | Resume from plan | Implement from existing .plan.md |
| `--review-hard` | `/review-hard` | Before completion | Adversarial self-review |
| `--refactor-clean` | `/refactor-clean` | Legacy cleanup | Systematic decomposition |
| `--test [level]` | `/test [level]` | After code | Write tests at level |
| `--doc-code` | `/doc-code` | After implementation | Generate docs (Procida/Diátaxis) |

**Use flags** when chaining: `Build X --structure-first --test all --review-hard`

**Use commands** when standalone: `/review-hard` or `/test unit src/services/`

### --structure-first: Lightweight Planning

**Purpose**: Prevent architectural drift without heavyweight process.

**When to use**:
- New features or components
- Moderate complexity work
- When you want planning without formality

**Workflow**:

```
USER: Build the user dashboard --structure-first

CLAUDE:
1. Analyze requirements
2. Design structure (functions, data flow, separation)
3. Present plan and WAIT for approval
4. [User approves]
5. Implement per plan
6. Self-verify: "Does this match the plan?"
```

**Example response**:

```markdown
## Structure Plan

### Functions (single responsibility each):
1. `fetchDashboardData()` - API calls only
2. `transformForDisplay(raw)` - data shaping
3. `calculateMetrics(data)` - derived values
4. `DashboardLayout` - container component
5. `MetricCard` - presentational component
6. `ActivityChart` - D3 visualization

### Data Flow:
```
fetch → transform → calculate → render
  ↓         ↓           ↓          ↓
API      shape       derive      present
```

### Separation:
- Data layer: functions 1-3 (pure, testable)
- Presentation: components 4-6 (React + D3)

### Key Decisions:
- MetricCard is generic, takes any metric shape
- ActivityChart uses D3 data-join inside React ref
- No prop drilling - context for shared state

Ready to implement? [Awaiting approval]
```

### --plan: Full Plan Mode

**Purpose**: Rigorous planning for complex features with exploration.

**When to use**:
- Complex features spanning multiple files
- Architectural decisions with multiple valid approaches
- When exploration is needed before committing
- Higher-stakes changes requiring documentation

**Workflow**:

```
USER: Build the authentication system --plan

CLAUDE:
1. Enter plan mode (EnterPlanMode tool)
2. Explore codebase (read-only: Glob, Grep, Read)
3. Write .plan.md with full analysis
4. Exit plan mode (ExitPlanMode tool)
5. [User reviews and approves]
6. Implement per plan
```

**Differences from --structure-first**:

| Aspect | --structure-first | --plan |
|--------|-------------------|--------|
| Output | Inline markdown | Persistent .plan.md file |
| Exploration | Can read files | Enforced read-only mode |
| Persistence | Gone after session | File remains for reference |
| Formality | Low | High |
| Best for | Quick features | Complex architecture |

### --build-from-plan: Resume from Plan

**Purpose**: Implement from an existing `.plan.md` file without re-exploring.

**When to use**:
- Returning to work after creating a plan in a previous session
- Plan was approved but implementation was deferred
- Team member picking up a task from another's plan
- Resuming after context window exhaustion

**Workflow**:

```
USER: --build-from-plan

CLAUDE:
1. Read .plan.md (or specified plan file)
2. Validate plan is current (check referenced files exist)
3. Summarize: "Found plan with 3 files to create, 2 to modify"
4. Implement per plan structure exactly
5. Update plan with implementation status
6. Report completion
```

**Key difference from fresh start**:

| Fresh Start | --build-from-plan |
|-------------|-------------------|
| Explores codebase | Trusts plan's analysis |
| Asks questions | Uses plan's decisions |
| May propose alternatives | Follows plan exactly |

**Example**:
```
Day 1: > Build auth system --plan
       [Creates .plan.md, session ends]

Day 2: > --build-from-plan --test all --review-hard
       [Implements per plan, tests, reviews]
```

**Example .plan.md**:

```markdown
# Authentication System Plan

## Context
Adding JWT-based authentication to the existing Express API.

## Exploration Findings
- Existing session handling: cookie-based in /lib/session.js
- User model: /models/user.js has email/password hash
- Middleware pattern: /middleware/*.js, uses async handler wrapper

## Approach
JWT with refresh tokens, matching existing middleware patterns.

### Option A: JWT Only (chosen)
+ Stateless, scales horizontally
+ Works with mobile clients
- Requires refresh token mechanism

### Option B: Extend Cookie Sessions
+ Simpler, matches existing code
- Doesn't work well for API-first

## Files to Create
- src/auth/tokens.js - JWT generation/verification
- src/auth/middleware.js - Route protection
- src/routes/auth.js - Login/logout/refresh endpoints

## Files to Modify
- src/routes/index.js - Mount auth routes
- src/models/user.js - Add refreshToken field

## Data Flow
```
Login:
  credentials → validate → generateTokens → response

Protected Route:
  request → extractToken → verifyJWT → attachUser → next

Refresh:
  refreshToken → verify → generateNewAccess → response
```

## Function Signatures
```javascript
// tokens.js
generateAccessToken(user: User): string
generateRefreshToken(user: User): string
verifyAccessToken(token: string): Payload | null
verifyRefreshToken(token: string): Payload | null

// middleware.js
requireAuth(req, res, next): void
optionalAuth(req, res, next): void
```

## Security Considerations
- Access token: 15min expiry, in memory only
- Refresh token: 7day expiry, httpOnly cookie
- Refresh rotation on each use
- Rate limiting on login endpoint

## Risks
- Token revocation requires blacklist (defer to v2)
- Clock skew can cause issues (add 30s grace)

## Test Strategy
- Unit: Token generation/verification
- Integration: Full login flow with MockMvc equivalent
- E2E: Login → Protected route → Refresh cycle
```

### --review-hard: Adversarial Self-Review

**Purpose**: Catch issues before external reviewers do.

**When to use**:
- Before presenting code as complete
- Before commit/PR
- Whenever quality matters

**Workflow**:

```
USER: That looks done. --review-hard

CLAUDE:
1. Read back through all code written
2. Check against project CLAUDE.md standards
3. Ask: "What would Codex/Gemini/Qodana flag?"
4. Ask: "What would a hostile human reviewer criticize?"
5. Fix all issues found
6. Report what was fixed
7. Present verified code
```

**What Claude looks for**:
- Mixed concerns (data + presentation)
- Long functions (>30 lines)
- Inconsistent patterns
- Missing error handling
- Security issues (if relevant)
- Performance issues (inline objects, missing memoization)
- Accessibility issues (if UI)
- Framework anti-patterns

**Example response**:

```markdown
## Adversarial Review Findings

### Issues Fixed:

1. **Mixed concerns in `Dashboard.tsx:45-89`**
   - Calculation logic was inside JSX
   - Extracted to `useDashboardMetrics()` hook

2. **Long function `processData()` (67 lines)**
   - Split into `groupByCategory()`, `enrichWithTotals()`, `sortByDate()`
   - Each now under 20 lines

3. **Inconsistent data fetching**
   - Some components used fetch directly
   - Others used the api service
   - Unified all to use api service

4. **Inline object in JSX**
   - `<Chart config={{ ... }} />` created new object each render
   - Moved to useMemo

5. **Missing key stability**
   - `key={index}` in activity list
   - Changed to `key={activity.id}`

### Verification Checklist:
- [x] No function exceeds 30 lines
- [x] Data prep separate from rendering
- [x] Consistent patterns throughout
- [x] No inline objects in JSX
- [x] Stable keys on all lists
- [x] Error states handled
- [x] Loading states handled

Code is now review-ready.
```

### --refactor-clean: Systematic Decomposition

**Purpose**: Clean up messy code with clear before/after.

**When to use**:
- Tech debt sessions
- Before adding features to messy code
- Cleaning up discovered code smells

**Workflow**:

```
USER: --refactor-clean src/views/UserView.js

CLAUDE:
1. Read entire file
2. Identify all issues through canon lenses
3. Plan decomposition
4. Execute refactoring
5. Show before/after summary
6. Verify build passes
```

**Example response**:

```markdown
## Refactoring: UserView.js

### Analysis Through Canon Lenses

**Kernighan (Clarity)**:
- Function names describe HOW not WHAT
- 3 functions over 50 lines

**Liskov (SRP)**:
- `renderUser()` has 6 responsibilities
- Changes for any of 6 reasons

**Bloch (if Java)**:
- N/A (JavaScript file)

### Before
```
UserView.js (1 file, 234 lines)
└── renderUser() - 147 lines
    ├── fetch user data
    ├── validate response
    ├── transform for display
    ├── calculate derived values
    ├── render HTML
    └── attach event handlers
```

### After
```
userView/
├── index.js (40 lines)
│   └── UserView() - orchestration only
├── api.js (25 lines)
│   └── fetchUser()
├── transform.js (35 lines)
│   ├── validateUserResponse()
│   ├── transformForDisplay()
│   └── calculateMetrics()
├── UserCard.jsx (45 lines)
│   └── Presentational component
└── useUserView.js (30 lines)
    └── Custom hook for state/effects
```

### Changes Made:
1. Extracted API call to dedicated module
2. Extracted transformations to pure functions
3. Separated presentation into component
4. Created custom hook for state management
5. Orchestration function now 15 lines

### Metrics:
| Metric | Before | After |
|--------|--------|-------|
| Max function length | 147 | 30 |
| Files | 1 | 5 |
| Responsibilities per file | 6 | 1 |
| Testable units | 1 | 5 |

Build verified passing.
```

### --test [level]: Write Tests

**Purpose**: Write tests at the appropriate level using testing canon.

**Levels**:
- `--test unit` - Unit tests with mocks
- `--test integration` - Integration tests
- `--test e2e` - End-to-end tests
- `--test all` - Analyze and write at all appropriate levels

**Testing Canon Applied**:
- **Dodds**: Testing Trophy - integration tests as sweet spot, test behavior not implementation
- **Meszaros**: xUnit Test Patterns - test doubles (stub/spy/mock/fake), setup patterns
- **Feathers**: Working Effectively with Legacy Code - characterization tests, finding seams

**Decision Tree**:

```
Is it pure logic (no I/O)?
├── Yes → Unit test
└── No → Does it access external services?
    ├── Yes → Integration test
    └── No → Is it a critical user journey?
        ├── Yes → E2E test
        └── No → Integration test
```

### --doc-code: Generate Documentation

**Purpose**: Generate documentation using Procida's Diátaxis framework.

**When to use**:
- After implementing a feature
- After creating public APIs
- When complex systems need explanation
- Combined with other flags in the pipeline

**Also available as**: `/doc-code [target]` for standalone documentation

**Diátaxis Framework** (Procida Canon):

| Type | Purpose | When to Generate |
|------|---------|------------------|
| **Tutorial** | Learning-oriented | New capability users need to learn |
| **How-To** | Task-oriented | New feature with specific use cases |
| **Reference** | Information-oriented | Public API (functions, classes) |
| **Explanation** | Understanding-oriented | Complex system, architecture decisions |

**Behavior**:

1. **Analyze what was built** → Determine doc type needed
2. **Apply Procida lens** → Structure for that doc type
3. **Generate documentation** → Inline (JSDoc) + external docs
4. **Verify completeness** → All public APIs documented, examples runnable

**Decision Tree**:

```
What was built?
│
├── Public function/class/API?
│   └── Reference documentation (inline + docs/api/)
│
├── New feature users will use?
│   └── How-to guide (docs/how-to/)
│
├── Complex internal system?
│   └── Explanation document (docs/architecture/)
│
└── New capability to learn?
    └── Tutorial (docs/tutorials/) - rare
```

**Example Response**:

```markdown
## Documentation Generated

### Analysis:
- Built: AuthService with login/logout/refresh methods
- Type: Public API → Reference documentation
- Additional: Complex token flow → Explanation needed

### Documents Created:

**1. Reference (inline + docs/api/auth.md)**
- All public methods have JSDoc
- Parameters, return types, exceptions documented
- Runnable examples for each method

**2. Explanation (docs/architecture/auth-flow.md)**
- Why JWT over sessions
- Token refresh mechanism
- Security considerations

### Verification:
- [x] All public APIs documented
- [x] Examples are runnable
- [x] Links verified
```

**Auto-Invoke Rules** (add to project CLAUDE.md):

```markdown
| Context | Action |
|---------|--------|
| New public API (exported function/class) | INVOKE --doc-code |
| New feature completed | INVOKE --doc-code |
| Complex system or architecture | INVOKE --doc-code --type=explanation |
| After --test completes successfully | INVOKE --doc-code |
```

**Options**:

| Option | Effect |
|--------|--------|
| `--type=tutorial` | Force tutorial format |
| `--type=how-to` | Force how-to format |
| `--type=reference` | Force reference format |
| `--type=explanation` | Force explanation format |
| (no option) | Auto-detect appropriate type |

### Combining Flags

Flags compose. Order matters:

```
> Build the dashboard --structure-first --test all --doc-code --review-hard
```

Execution order:
1. `--structure-first` → Plan shown, wait for approval
2. Implement per plan
3. `--test all` → Write tests at all levels
4. `--doc-code` → Generate documentation
5. `--review-hard` → Adversarial review

**Common combinations**:

| Combination | Use Case |
|-------------|----------|
| `--structure-first --test all` | Normal feature development |
| `--structure-first --test all --doc-code` | Feature with documentation |
| `--plan --test all --doc-code` | Complex feature, full pipeline |
| `--refactor-clean --test unit` | Refactoring with coverage |
| `--plan --review-hard` | Architectural changes |
| `--doc-code --review-hard` | Document existing code |

---

# Part III: Integration Mechanics

## How the Pieces Fit Together

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT SETUP                           │
│                                                             │
│  1. Profile Applied                                         │
│     cc-config profile apply javascript+react                │
│              ↓                                              │
│  2. Canon Stack Configured                                  │
│     Baseline Brain: Kernighan, Thompson, Pike,             │
│                     Joy, Linus, Dijkstra                   │
│     Base Practices: Schneier, OWASP, Dodds, Procida        │
│     Domain: Simpson, Abramov                               │
│              ↓                                              │
│  3. Standards in CLAUDE.md                                  │
│     Universal + Framework-specific rules                    │
│              ↓                                              │
│  4. Auto-Invoke Rules Active                                │
│     React → /abramov, Testing → /dodds                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT FLOW                         │
│                                                             │
│  USER: Build user dashboard --structure-first               │
│              ↓                                              │
│  CANON LENS ACTIVATES                                       │
│     Abramov lens shapes component design                    │
│     Kernighan lens ensures clarity                          │
│              ↓                                              │
│  FLAG TRIGGERS WORKFLOW                                     │
│     --structure-first shows plan, waits for approval        │
│              ↓                                              │
│  STANDARDS ENFORCED                                         │
│     30-line max, separation of concerns, etc.               │
│              ↓                                              │
│  QUALITY SEQUENCE (if configured)                           │
│     test-engineer → code-reviewer → security-auditor        │
│              ↓                                              │
│  HOOKS (if configured)                                      │
│     Pre-commit: tests pass, lint clean                      │
└─────────────────────────────────────────────────────────────┘
```

## The Quality Layers

Quality compounds through layers:

```
┌─────────────────────────────────────────┐
│ Layer 1: BASELINE BRAIN (Thinking)      │
│ Six masters shape HOW you approach code │
│ Kernighan, Thompson, Pike, Joy, Linus,  │
│ Dijkstra - productive tensions          │
├─────────────────────────────────────────┤
│ Layer 2: BASE PRACTICES (Checking)      │
│ Security, testing, docs standards       │
│ Schneier, OWASP, Dodds, Procida         │
├─────────────────────────────────────────┤
│ Layer 3: DOMAIN CANON (Expertise)       │
│ Language/framework-specific patterns    │
│ Bloch, Simpson, Abramov, Bostock, etc.  │
├─────────────────────────────────────────┤
│ Layer 4: STANDARDS (Declarative)        │
│ Explicit rules checked during writing   │
│ 30-line max, separation of concerns     │
├─────────────────────────────────────────┤
│ Layer 5: FLAGS (Procedural)             │
│ Workflows that enforce quality moments  │
│ Plan before implement, review before    │
│ present                                 │
├─────────────────────────────────────────┤
│ Layer 6: AGENTS (Verification)          │
│ Specialist review catches what slipped  │
│ test-engineer, code-reviewer, etc.      │
├─────────────────────────────────────────┤
│ Layer 7: HOOKS (Enforcement)            │
│ Must-pass gates, cannot be bypassed     │
│ Tests must pass, lint must be clean     │
└─────────────────────────────────────────┘
```

Each layer catches what others miss:
- Canon prevents issues from being created
- Standards catch issues during creation
- Flags enforce quality checkpoints
- Agents provide specialist verification
- Hooks provide final enforcement

## Configuration Strategy

### The STRATEGY.md Pattern

Every configured project should have a STRATEGY.md explaining WHY:

```markdown
# Project Strategy

## Project Type
Software - React Dashboard with D3 Visualizations

## Quality Priorities
1. Correctness (healthcare data, errors are costly)
2. Maintainability (long-lived product, team changes)
3. Performance (large datasets, real-time updates)

## Canon Stack Rationale

### Baseline Brain
- Kernighan: Clarity is priority for maintenance
- Thompson: Pragmatic prototyping for fast iteration
- Pike: Clean interfaces for system boundaries
- Joy: Resilience patterns for data pipeline
- Linus: Data structure design for performance
- Dijkstra: Rigor for healthcare calculations

### Base Practices
- Schneier: Healthcare data requires security mindset
- OWASP: Compliance requirement (HIPAA adjacent)
- Dodds: Integration tests catch real issues
- Procida: Onboarding new team members

### Domain Canon
- Simpson: Complex async patterns in data pipeline
- Abramov: React is primary framework
- Bostock: D3 visualizations are core feature
- Tufte/Few: Data integrity in displays

## Standards Rationale
- 30-line max: Enforces decomposition
- Pipeline pattern: Testable data transformations
- D3 data-join: Consistent with Bostock patterns

## Quality Sequence
1. test-engineer: Coverage required
2. code-reviewer: Patterns must match
3. security-auditor: PHI exposure prevention

## Known Risks
- D3 + React integration complexity → Bostock patterns mitigate
- Large dataset performance → Dodds integration tests verify
- Team unfamiliarity with D3 → Tufte/Few skills provide guidance
```

### Evolving Configuration

Configuration isn't static. Evolve based on:

**Adding to anti-patterns**:
When external review finds issues, add to project CLAUDE.md:

```markdown
## Anti-Patterns (Never Do)

### Found in Review 2024-01-15
- Using `.subscribe()` without takeUntil → Memory leak
- Added: All subscriptions must use async pipe OR takeUntil pattern
```

**Adjusting canon stack**:
If a master isn't helping, remove. If gaps emerge, add.

```markdown
## Canon Stack Changes

### 2024-01-20
- Added: Meszaros (test patterns) - team struggling with mocks
- Removed: Crockford - principles already covered by Simpson
```

**Measuring and adjusting**:
After a sprint:
- External reviewers finding fewer issues?
- Time spent on review passes decreasing?
- New code matching existing patterns?

If not, diagnose and adjust.

## Transparency: The /status Command

At any time, check what's active:

```
> /status

┌─ Session Status ─────────────────────────────┐
│ Project: my-dashboard                         │
│ Profile: javascript + react + d3              │
│                                               │
│ CANON STACK (always alive)                    │
│   BASELINE BRAIN: kernighan, thompson, pike, │
│                   joy, linus, dijkstra        │
│   BASE PRACTICES: schneier, owasp, dodds,     │
│                   procida                     │
│   DOMAIN: simpson, abramov, bostock,          │
│           tufte, few                          │
│                                               │
│ STANDARDS: Universal + React + D3             │
│                                               │
│ AGENTS AVAILABLE:                             │
│   test-engineer, code-reviewer,               │
│   security-auditor, accessibility-tester,     │
│   css-expert                                  │
│                                               │
│ HOOKS: pre-commit [test, lint]                │
│                                               │
│ ISSUES: None detected                         │
└───────────────────────────────────────────────┘
```

---

# Part IV: Extended Workflows

## Workflow 1: New Project Setup

### Step 1: Determine Project Type

```
Is this a software project?
├── Yes → Software base canon
│   └── What language/framework?
│       ├── React → javascript + react
│       ├── Angular → javascript + angular
│       ├── D3 visualization → javascript + d3
│       ├── Node API → javascript
│       ├── Java → java
│       └── Multiple → stack them
└── No → Business base canon
    └── What focus?
        ├── Strategy → strategy
        ├── Tech analysis → tech-analysis
        └── General writing → base only
```

### Step 2: Apply Profile

```bash
# React dashboard with D3 charts
cc-config profile apply javascript+react+d3 -p /path/to/project

# Verify
cc-config profile show javascript+react+d3
```

### Step 3: Add Standards to CLAUDE.md

Open your project CLAUDE.md and add:

```markdown
# Project: Dashboard App

## Project Type
Software - React + D3

## Canon Stack (always alive)
Baseline Brain: Kernighan, Thompson, Pike, Joy, Linus, Dijkstra
Base Practices: Schneier, OWASP, Dodds, Procida
Domain: Simpson, Abramov, Bostock, Tufte, Few

## Standards

### Universal Standards
[Copy from STRUCTURAL-STANDARDS.md]

### React Standards
[Copy from FRAMEWORK-TEMPLATES.md - React section]

### D3 Standards
[Copy from FRAMEWORK-TEMPLATES.md - D3 section]

## Auto-Invoke

| Context | Action |
|---------|--------|
| React components | INVOKE /abramov |
| D3 visualizations | INVOKE /bostock |
| TypeScript types | INVOKE /cherny |
| Testing | INVOKE /dodds |
```

### Step 4: Create STRATEGY.md

Document why this configuration:

```markdown
# Project Strategy

## Why This Canon Stack
- Abramov: React is primary framework
- Bostock: D3 charts are differentiating feature
- Tufte/Few: Data display integrity matters for users

## Quality Priorities
1. Correctness
2. Performance (large datasets)
3. Maintainability

## Known Risks
- D3+React integration → Bostock patterns mitigate
- Team D3 inexperience → Tufte/Few provide design guidance
```

### Step 5: Verify Setup

```
> /status
```

Should show your canon stack, standards, and agents.

## Workflow 2: Feature Development

### Starting a Feature

```
> Build user activity timeline showing login history --structure-first
```

Claude responds with plan:

```markdown
## Structure Plan

### Data Layer (Simpson patterns)
1. `fetchActivityLog(userId)` - API call, returns Promise<ActivityLog[]>
2. `groupByDay(logs)` - Groups activities by calendar day
3. `enrichWithMetadata(grouped)` - Adds day labels, counts

### Presentation Layer (Abramov patterns)
4. `useActivityTimeline(userId)` - Custom hook managing fetch + state
5. `ActivityTimeline` - Container component using hook
6. `ActivityDay` - Presentational, receives day data
7. `ActivityItem` - Presentational, single activity

### D3 Integration (Bostock patterns)
8. `TimelineChart` - D3 visualization inside React ref
   - Uses data-join for activity dots
   - Scales: time (x), categorical (y)

### Data Flow:
```
fetch → group → enrich → hook → components
                            ↓
                        D3 chart
```

### Separation:
- Data: functions 1-3 (pure, testable)
- State: hook 4 (manages lifecycle)
- UI: components 5-7 (presentational)
- Viz: component 8 (D3 in React)

Ready to implement?
```

You approve. Claude implements.

### After Implementation

```
> --test all
```

Claude analyzes and writes tests:

```markdown
## Test Plan

### Unit Tests (Dodds patterns)
- `groupByDay()` - Various date ranges, edge cases
- `enrichWithMetadata()` - Label generation, count accuracy
- `ActivityDay` - Renders correctly for different data
- `ActivityItem` - Displays all activity types

### Integration Tests (Dodds Testing Trophy)
- `useActivityTimeline` - Fetches, transforms, handles errors
- `ActivityTimeline` - Full render with mock data
- `TimelineChart` - D3 initialization, data-join updates

### Tests Written:
- src/features/activity/__tests__/transform.test.ts
- src/features/activity/__tests__/ActivityTimeline.test.tsx
- src/features/activity/__tests__/TimelineChart.test.tsx

All tests passing.
```

### Before Commit

```
> --review-hard
```

Claude reviews:

```markdown
## Adversarial Review

### Checked Against:
- React standards from CLAUDE.md
- D3 standards from CLAUDE.md
- Universal standards

### Issues Found and Fixed:

1. **Inline object in TimelineChart**
   - `<TimelineChart config={{ margin: 20 }} />`
   - Moved to useMemo

2. **Missing error boundary**
   - D3 errors could crash app
   - Added ErrorBoundary around TimelineChart

3. **Key using index in ActivityDay**
   - Changed to `key={day.date}`

### Verification:
- [x] No function over 30 lines
- [x] Pure data transforms
- [x] D3 uses data-join
- [x] No inline objects
- [x] Stable keys
- [x] Error handling

Code is review-ready.
```

Now commit.

## Workflow 3: Refactoring Legacy Code

### Analyze First

```
> --refactor-clean src/legacy/UserDashboard.js
```

Claude analyzes through canon lenses:

```markdown
## Analysis: UserDashboard.js

### File Overview
- 423 lines
- 1 main function (renderDashboard: 287 lines)
- Mixed concerns throughout

### Issues by Canon Lens

**Kernighan (Clarity)**
- Function names describe implementation, not intent
- `doStuff()`, `handleIt()`, `processData()`
- Nested callbacks 6 levels deep

**Liskov (SRP)**
- renderDashboard has 8 responsibilities:
  1. Fetch user data
  2. Fetch activity data
  3. Calculate metrics
  4. Transform for display
  5. Build HTML string
  6. Inject into DOM
  7. Attach event handlers
  8. Set up refresh interval

**Dodds (Testing)**
- 0% testable - everything coupled
- No seams for mocking
- Side effects throughout

**Bostock (if D3 is present)**
- innerHTML for data rendering
- Should use data-join

### Refactoring Plan

Phase 1: Extract Data Layer
- fetchUserData()
- fetchActivityData()
- calculateMetrics()
- transformForDisplay()

Phase 2: Extract Presentation
- DashboardContainer (state, effects)
- UserCard (presentational)
- ActivityList (presentational)
- MetricsPanel (presentational)

Phase 3: Extract Side Effects
- useAutoRefresh() hook
- Event handlers as callbacks

### Expected Outcome
- 8 files instead of 1
- Max function: 30 lines
- 100% unit testable
- Clear data flow

Proceed with refactoring?
```

You approve. Claude executes phase by phase.

## Workflow 4: Bug Fix with Verification

### Investigate

```
> The activity count is wrong on the dashboard. Can you investigate?
```

Claude explores with canon as lens:

```markdown
## Investigation

### Traced Data Flow
1. `fetchActivities()` → Returns raw activities ✓
2. `groupByDay()` → Groups correctly ✓
3. `calculateDailyCount()` → **ISSUE FOUND**

### Issue
```javascript
// Current (wrong)
function calculateDailyCount(activities) {
    return activities.filter(a => a.type === 'login').length;
}

// This only counts logins, not all activities
```

### Root Cause
Function name suggests "daily count" but implementation filters to logins only.

**Kernighan lens**: Name doesn't match behavior
**Dodds lens**: No test would have caught this - function does exactly what code says

### Fix Options

Option A: Fix the name (if login-only is intended)
```javascript
function calculateDailyLoginCount(activities) { ... }
```

Option B: Fix the implementation (if all activities intended)
```javascript
function calculateDailyCount(activities) {
    return activities.length;
}
```

Which interpretation is correct?
```

You clarify it should count all activities.

### Fix and Test

```
> It should count all activities. Fix it. --test unit --review-hard
```

Claude fixes, writes test, reviews:

```markdown
## Fix Applied

### Change
```javascript
// Before
function calculateDailyCount(activities) {
    return activities.filter(a => a.type === 'login').length;
}

// After
function calculateDailyCount(activities) {
    return activities.length;
}
```

### Test Added
```javascript
describe('calculateDailyCount', () => {
    it('counts all activities regardless of type', () => {
        const activities = [
            { type: 'login' },
            { type: 'logout' },
            { type: 'action' }
        ];
        expect(calculateDailyCount(activities)).toBe(3);
    });

    it('returns 0 for empty array', () => {
        expect(calculateDailyCount([])).toBe(0);
    });
});
```

### Review
- [x] Function name matches behavior
- [x] Test covers the fix
- [x] No other usages assume login-only

Fix complete and verified.
```

---

# Part V: Decision Frameworks

## When to Use Which Flag

```
Starting new work?
│
├── Is it a new feature?
│   ├── Simple/obvious structure? → No flag needed
│   ├── Moderate complexity? → --structure-first
│   └── Complex/multi-file? → --plan
│
├── Is it a bug fix?
│   ├── Simple fix? → No flag needed
│   ├── Needs verification? → --test unit
│   └── Complex/unclear? → investigate first, then --test
│
├── Is it refactoring?
│   └── Always → --refactor-clean
│
└── Is it cleanup/tech debt?
    └── Always → --refactor-clean

Before presenting as done?
└── Always → --review-hard

After writing any code?
└── Consider → --test [appropriate level]
```

## When to Use Which Test Level

```
What are you testing?
│
├── Pure function (no I/O)?
│   └── Unit test
│
├── Component/module interactions?
│   └── Integration test
│
├── Database/API access?
│   └── Integration test (with test DB/mock server)
│
├── Critical user journey?
│   └── E2E test (sparingly)
│
└── Legacy code you're about to change?
    └── Characterization test first (Feathers pattern)
```

## When to Load Additional Canon

```
Working on specific domain?
│
├── Security-sensitive code (auth, data, APIs)?
│   └── Ensure Schneier + OWASP active
│
├── Complex async patterns?
│   └── Ensure Simpson active
│
├── API design decisions?
│   └── Consider Bloch (even for non-Java)
│
├── Visualization design?
│   └── Ensure Tufte + Few + Knaflic active
│
└── Performance-critical code?
    └── Consider Carmack (discipline, measurement)
```

## Troubleshooting

### "Claude is still writing monolithic functions"

**Diagnosis**: Standards not explicit enough

**Fix**: Add to CLAUDE.md:
```markdown
## Hard Rules
- NO function over 30 lines
- If you write a function over 30 lines, STOP and decompose
- This is NON-NEGOTIABLE
```

### "Code doesn't match framework idioms"

**Diagnosis**: Framework canon not active or not specific enough

**Fix**:
1. Check /status - is domain canon showing?
2. Add framework-specific anti-patterns to CLAUDE.md
3. Use flag: `--review-hard` to catch

### "Getting inconsistent patterns across codebase"

**Diagnosis**: Consistency standard not being enforced

**Fix**: Add to CLAUDE.md:
```markdown
## Consistency Rules
- Before writing, examine 3 similar files
- Match their patterns EXACTLY
- If patterns vary, ask which to standardize on
- NEVER introduce a third pattern
```

### "External reviewers still finding issues"

**Diagnosis**: Gap between standards and what reviewers expect

**Fix**:
1. Document every issue reviewers find
2. Add as anti-pattern in CLAUDE.md
3. Consider which canon would have caught it
4. Adjust canon stack if needed

### "Claude ignores flags"

**Diagnosis**: Flag syntax or timing issue

**Fix**:
- Flags go at end of request: `Build X --structure-first`
- Not in middle: `--structure-first build X` (wrong)
- Check for typos: `--structure-frist` won't work

---

# Part VI: Measuring Success

## Weekly Check

After one week of using Claude-Optimal:

- [ ] External reviewers finding fewer structural issues?
- [ ] Less time spent on review-fix-review cycles?
- [ ] New code matching existing patterns?
- [ ] Team more confident in Claude's output?

## Issue Tracking

Track issues found in external review:

| Date | Issue | Root Cause | Added to |
|------|-------|------------|----------|
| 1/15 | 80-line function | Size limit not enforced | CLAUDE.md hard rules |
| 1/16 | Mixed innerHTML/data-join | D3 standard missed | D3 anti-patterns |
| 1/17 | Missing error handling | No standard for errors | Universal standards |

## Configuration Evolution

Every two weeks, review:

1. **Canon stack**: Which masters helped? Which were unused?
2. **Standards**: What rules were violated? Add them.
3. **Flags**: Which workflows caught issues? Enforce them.
4. **Anti-patterns**: What keeps coming up? Document it.

## Success Metrics

**Quantitative**:
- Review round-trips per PR (should decrease)
- Time from code complete to merged (should decrease)
- Issues found in production (should decrease)

**Qualitative**:
- Team confidence in Claude output
- Reviewer satisfaction with code quality
- Onboarding time for new patterns

---

# Appendix A: Complete Canon Catalog

## Baseline Brain (Always Active)

The six masters that shape HOW you think about code:

| Master | Works | Key Principle |
|--------|-------|---------------|
| **Kernighan** | Practice of Programming, Elements of Style | Simplicity, clarity, generality |
| **Thompson** | Unix, UTF-8, Go | "When in doubt, use brute force" |
| **Pike** | Notes on Programming in C, Go Proverbs | "A little copying is better than a little dependency" |
| **Joy** | BSD, vi, NFS, Joy's Law | "Design for failure from the start" |
| **Linus** | Linux kernel, Git | "Good programmers worry about data structures" |
| **Dijkstra** | EWDs, A Discipline of Programming | Correctness by construction |

## Base Practices (Always Active)

| Master | Works | Key Principles |
|--------|-------|----------------|
| **Schneier** | Security engineering | Threat modeling, defense in depth |
| **OWASP** | Top 10, guidelines | Injection, XSS, auth failures |
| **Dodds** | Testing Library | Testing Trophy, behavior not implementation |
| **Meszaros** | xUnit Test Patterns | Test doubles, setup patterns |
| **Feathers** | Working Effectively with Legacy Code | Characterization tests, seams |
| **Procida** | Diátaxis | Tutorials, how-tos, reference, explanation |

## Software Domain Canon

| Master | Works | Domain |
|--------|-------|--------|
| **Bloch** | Effective Java | Java API design |
| **Simpson** | You Don't Know JS | JavaScript runtime |
| **Cherny** | Programming TypeScript | TypeScript type system |
| **Crockford** | JavaScript: The Good Parts | Disciplined JS subset |
| **Abramov** | Redux, React blog | React patterns |
| **Bostock** | D3.js, Observable | Data visualization |
| **Tufte** | Visual Display | Information design |
| **Few** | Dashboard Design | Dashboard patterns |
| **Knaflic** | Storytelling with Data | Data narrative |
| **Pike** | Go Proverbs | Go philosophy |
| **Hevery** | Angular | Angular architecture |
| **Papa** | Style guide | Angular conventions |

## Business Base Canon

| Master | Works | Key Principles |
|--------|-------|----------------|
| **Strunk & White** | Elements of Style | Brevity, clarity |
| **Zinsser** | On Writing Well | Simplicity, humanity |
| **Grove** | High Output Management | Leverage, output |

## Business Domain Canon

| Master | Works | Domain |
|--------|-------|--------|
| **Porter** | Competitive Advantage | Strategy frameworks |
| **Thompson** | Stratechery | Tech industry analysis |
| **Horowitz** | Hard Thing | Startup operations |
| **Rumelt** | Good Strategy Bad Strategy | Strategy discipline |
| **Helmer** | 7 Powers | Competitive advantage |

## CS Foundations (Reference Canon)

Note: Dijkstra is now in Baseline Brain (always active). These remain as reference:

| Master | Works | Contribution |
|--------|-------|--------------|
| **Knuth** | TAOCP | Algorithms, literate programming |
| **Liskov** | CLU, LSP | Abstraction, substitution |
| **Carmack** | .plan files | Performance discipline |
| **McIlroy** | Unix Philosophy | Do one thing well, composition |

---

# Appendix B: Quick Reference

## Command Cheat Sheet

```bash
# Profile management
cc-config profile apply javascript+react -p /path
cc-config profile show javascript+react

# Status check
> /status

# Planning (new features)
> Build feature X --structure-first
> Build complex feature X --plan

# Building (from existing plan)
> --build-from-plan
> --build-from-plan auth-system.plan.md

# Testing
> --test all
> --test unit src/services/
> --test integration
> --test e2e

# Documentation
> --doc-code
> /doc-code src/services/AuthService.ts
> /doc-code --type=how-to src/features/

# Before presenting
> --review-hard

# Legacy cleanup
> --refactor-clean src/path/file.js

# Combined workflows
> Build X --structure-first --test all --doc-code --review-hard
> --refactor-clean src/file.js --test unit
```

## CLAUDE.md Template

```markdown
# Project: [Name]

## Project Type
[Software/Business] - [specifics]

## Canon Stack (always alive)

### Baseline Brain
Kernighan (clarity), Thompson (pragmatism), Pike (composition),
Joy (resilience), Linus (taste), Dijkstra (rigor)

### Base Practices
- Security: Schneier (mindset), OWASP (vulnerabilities)
- Testing: Dodds (Testing Trophy), Meszaros (test patterns), Feathers (legacy)
- Documentation: Procida (Diátaxis)

### Domain Canon
[List domain masters for your stack]

## Standards

### Universal
- Single responsibility per function
- Max 30 lines per function
- Pipeline: raw → transform → present
- One pattern per concern

### Framework ([name])
[Framework-specific rules]

## Anti-Patterns
[Document issues found in review]

## Auto-Invoke

| Context | Action |
|---------|--------|
| React components | INVOKE /abramov |
| TypeScript types | INVOKE /cherny |
| Testing | INVOKE /dodds |
| New public API | INVOKE --doc-code |
| New feature completed | INVOKE --doc-code |
| Complex system | INVOKE --doc-code --type=explanation |
| After --test completes | INVOKE --doc-code |

## Quality Flags (Project Defaults)

- All new features: `--structure-first --doc-code`
- All completions: `--review-hard`
- Full pipeline: `--structure-first --test all --doc-code --review-hard`
```

---

*"The question that unlocks everything: Who has solved this before, and better than I could?"*
