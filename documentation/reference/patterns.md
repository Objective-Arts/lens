# Claude Code Design Patterns

*A Pattern Language in the Style of the Gang of Four*

> **This is a theoretical reference.** For practical usage, see [USER-GUIDE.md](USER-GUIDE.md).

---

## Introduction

This catalog applies the Gang of Four pattern format to Claude Code primitives. Each pattern addresses a recurring problem in configuring Claude Code for quality output.

For practical application of these patterns, see:
- **Profiles**: [PROFILES.md](PROFILES.md) - Canon Factory and Profile Builder in action
- **Standards**: [STRUCTURAL-STANDARDS.md](STRUCTURAL-STANDARDS.md) - Quality Template implementation
- **Flags**: [FLAGS.md](FLAGS.md) - Hook Chain and Skill Observer in practice

**Pattern Format** (from GoF):
- **Intent**: What does the pattern do?
- **Also Known As**: Other names
- **Motivation**: A scenario illustrating the problem
- **Applicability**: When to use this pattern
- **Structure**: Graphical representation
- **Participants**: Classes/objects and their responsibilities
- **Collaborations**: How participants work together
- **Consequences**: Trade-offs and results
- **Implementation**: Pitfalls, hints, techniques
- **Known Uses**: Examples from real systems
- **Related Patterns**: Other relevant patterns

---

## Pattern Catalog

### Creational Patterns
*How Claude Code primitives are instantiated and composed*

| Pattern | Intent |
|---------|--------|
| **Canon Factory** | Create domain-specific context through canon skills |
| **Profile Builder** | Construct complex configurations step-by-step |
| **Singleton Stack** | Ensure only one canon stack is active |

### Structural Patterns
*How primitives compose into larger structures*

| Pattern | Intent |
|---------|--------|
| **Skill Decorator** | Add responsibilities to skills dynamically |
| **Agent Facade** | Provide unified interface to subagent subsystem |
| **Hook Chain** | Chain hooks for compound validation |
| **Bridge Profile** | Separate abstraction from implementation |

### Behavioral Patterns
*How primitives communicate and divide responsibilities*

| Pattern | Intent |
|---------|--------|
| **Quality Template** | Define skeleton of quality sequence |
| **Context Memento** | Capture and restore context state |
| **Skill Observer** | Auto-invoke skills based on context changes |
| **Agent Command** | Encapsulate request as object |

---

## Creational Patterns

### Canon Factory

**Intent**

Provide an interface for creating domain expertise context without specifying the concrete skill. The factory produces the right "lens" for the domain.

**Also Known As**

Domain Lens, Expert Factory

**Motivation**

Consider a developer working on multiple projects: a D3 visualization, a Java backend, and a React frontend. Each domain has recognized experts whose mental models produce superior code:

```
WITHOUT FACTORY               WITH FACTORY
───────────────               ───────────────
"Write D3 code"               CanonFactory.create("D3")
Generic, correct code         → loads bostock skill
                              → Mike Bostock's mental model
                              → idiomatic D3 patterns
```

The Canon Factory encapsulates the knowledge of which expert applies to which domain.

**Applicability**

Use Canon Factory when:
- A system needs domain expertise that varies by context
- The "right" expert for a domain is stable and well-known
- You want to centralize canon knowledge

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                     CanonFactory                         │
│  ─────────────────────────────────────────────────────  │
│  + create(domain: string): CanonSkill                   │
│  + detectDomain(context: FileContext): string           │
│  + getStack(projectType: string): CanonSkill[]          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ creates
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     <<interface>>                        │
│                      CanonSkill                          │
│  ─────────────────────────────────────────────────────  │
│  + domain: string                                        │
│  + expert: string                                        │
│  + principles: Principle[]                               │
│  + apply(code: string): Analysis                         │
└─────────────────────────────────────────────────────────┘
         △                    △                    △
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ Bostock │          │  Bloch  │          │ Abramov │
    │  (D3)   │          │ (Java)  │          │ (React) │
    └─────────┘          └─────────┘          └─────────┘
```

**Participants**

- **CanonFactory**: Declares factory method returning CanonSkill
- **CanonSkill**: Interface for domain expertise
- **ConcreteCanon** (Bostock, Bloch, Abramov): Implements specific expertise

**Collaborations**

- Client calls CanonFactory with domain or file context
- Factory detects domain from signals (file type, dependencies, content)
- Factory returns appropriate ConcreteCanon
- Client uses CanonSkill without knowing concrete type

**Consequences**

Benefits:
1. Isolates domain detection logic
2. Consistent expertise application
3. Easy to add new domains

Liabilities:
1. Requires maintaining domain→expert mapping
2. Token cost for loading skills
3. May load wrong expert if detection fails

**Implementation**

1. **Domain Detection**: Use file extension, dependencies, or content patterns
2. **Fallback**: Provide generic skill when domain unclear
3. **Caching**: Don't reload same skill multiple times in session

```yaml
# canon-registry.yaml
domains:
  d3:
    signals: [d3.js, d3-*, "selection", "data join"]
    expert: bostock
    tokens: 1200
  java:
    signals: [.java, pom.xml, build.gradle]
    expert: bloch
    tokens: 1500
  react:
    signals: [.jsx, .tsx, react, useState, useEffect]
    expert: abramov
    tokens: 890
```

**Known Uses**

- D3-SMR project using Bostock for visualization code
- Enterprise Java using Bloch for API design
- React projects using Abramov for component patterns

**Related Patterns**

- **Profile Builder**: Builds entire configuration including canon stack
- **Skill Observer**: Triggers canon loading automatically

---

### Profile Builder

**Intent**

Separate the construction of a complex Claude Code configuration from its representation so the same construction process can create different configurations.

**Also Known As**

Configuration Builder, Setup Builder

**Motivation**

A D3 visualization project needs:
- Canon skills: bostock, abramov, tufte
- Security: owasp (XSS)
- Agents: css-expert, accessibility-tester
- Commands: viz/*, d3/*
- Auto-invoke rules
- MCP servers

Building this configuration directly leads to:
- Scattered setup code
- Inconsistent configurations
- Difficult to replicate across projects

The Profile Builder separates construction from representation:

```
ProfileBuilder()
  .canon("bostock", "primary")
  .canon("abramov", "secondary")
  .canon("owasp", "security")
  .agents(["css-expert", "accessibility-tester"])
  .commands(["viz/*", "d3/*"])
  .autoInvoke("D3.js", "/bostock")
  .build()
```

**Applicability**

Use Profile Builder when:
- Configuration is complex with many optional parts
- Same construction process should create different profiles
- Need to create configuration incrementally

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    ProfileDirector                       │
│  ─────────────────────────────────────────────────────  │
│  + construct(type: ProjectType): void                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   <<interface>>                          │
│                   ProfileBuilder                         │
│  ─────────────────────────────────────────────────────  │
│  + canon(skill, role): this                             │
│  + agents(list): this                                   │
│  + commands(patterns): this                             │
│  + autoInvoke(context, action): this                    │
│  + build(): Profile                                      │
└─────────────────────────────────────────────────────────┘
                           △
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────┴─────────┐     ┌────────┴────────┐
    │  D3ProfileBuilder │     │ JavaProfileBuilder│
    └───────────────────┘     └──────────────────┘
```

**Participants**

- **ProfileDirector**: Constructs using ProfileBuilder interface
- **ProfileBuilder**: Interface for creating configuration parts
- **ConcreteBuilder**: Constructs specific profile type
- **Profile**: The resulting configuration

**Consequences**

Benefits:
1. Varies internal representation
2. Isolates construction code
3. Finer control over construction process

Liabilities:
1. Requires creating ConcreteBuilder for each type
2. Must keep builders in sync with Profile structure

**Implementation**

```yaml
# d3-development.yaml
name: D3 Development
description: Full D3/visualization development environment
skills:
  include: [bostock, abramov, dodds, osmani, cherny]
commands:
  include: [viz/*, d3/*]
agents:
  include: [css-expert, accessibility-tester]
claudeMd:
  autoInvoke:
    - context: D3.js or data visualization
      action: INVOKE `/bostock`
    - context: React/JSX/TSX files
      action: INVOKE `/abramov`
mcpServers:
  enable: [linear]
```

**Related Patterns**

- **Canon Factory**: Builder uses Factory for canon skills
- **Bridge Profile**: Separates profile abstraction from implementation

---

## Structural Patterns

### Skill Decorator

**Intent**

Attach additional responsibilities to a skill dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

**Also Known As**

Skill Wrapper, Lens Stack

**Motivation**

Consider a canon skill like `bostock` (D3 expertise). Sometimes you need additional perspectives:
- Performance considerations (Carmack)
- Accessibility requirements (WCAG)
- Security review (OWASP)

Rather than creating `bostock-with-performance` and `bostock-with-accessibility` and `bostock-with-security` (combinatorial explosion), decorators layer concerns:

```
┌─────────────────────────────────────┐
│         SecurityDecorator           │
│  ┌───────────────────────────────┐  │
│  │     PerformanceDecorator      │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │        Bostock          │  │  │
│  │  │    (core D3 skill)      │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Applicability**

Use Skill Decorator when:
- Need to add responsibilities without affecting other skills
- Responsibilities can be withdrawn
- Extension by subclassing impractical (too many combinations)

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                   <<interface>>                          │
│                       Skill                              │
│  ─────────────────────────────────────────────────────  │
│  + apply(context: Context): Guidance                     │
└─────────────────────────────────────────────────────────┘
         △                              △
         │                              │
┌────────┴────────┐           ┌────────┴────────┐
│  ConcreteSkill  │           │  SkillDecorator │
│    (bostock)    │           │                 │
└─────────────────┘           └────────┬────────┘
                                       │
                              ┌────────┴────────┐
                              │                 │
                    ┌─────────┴───────┐ ┌──────┴──────┐
                    │ SecurityDecorator│ │PerfDecorator│
                    └─────────────────┘ └─────────────┘
```

**Participants**

- **Skill**: Interface for skills that can be decorated
- **ConcreteSkill**: Skill being decorated (bostock, bloch, etc.)
- **SkillDecorator**: Maintains reference to Skill, forwards requests
- **ConcreteDecorator**: Adds responsibilities (security, performance)

**Consequences**

Benefits:
1. More flexible than static inheritance
2. Avoids feature-laden classes high in hierarchy
3. Easy to add combination of behaviors

Liabilities:
1. Lots of little objects
2. Decorator and component not identical
3. Token cost accumulates with each layer

**Implementation**

```markdown
## In CLAUDE.md

When touching DOM manipulation in D3:
1. INVOKE /bostock (core expertise)
2. THEN INVOKE /owasp (XSS prevention)
3. IF performance-critical, INVOKE /carmack

The skills layer their guidance, with more specific winning.
```

**Related Patterns**

- **Canon Stack**: Pre-defined decorator chain for project type
- **Hook Chain**: Similar layering for validation

---

### Agent Facade

**Intent**

Provide a unified interface to a set of subagents. Facade defines a higher-level interface that makes the subagent subsystem easier to use.

**Also Known As**

Quality Gate, Agent Coordinator

**Motivation**

After writing code, quality assurance involves multiple agents:
- test-engineer: Creates/runs tests
- code-reviewer: Checks patterns and clarity
- security-auditor: Finds vulnerabilities
- accessibility-tester: WCAG compliance

Without a facade, the main context must:
- Know about all agents
- Coordinate their execution
- Handle their results
- Manage dependencies between them

The Agent Facade provides a single entry point:

```
BEFORE (complex)                AFTER (simple)
────────────────                ───────────────
spawn test-engineer             QualityFacade.audit(code)
await results                   → returns combined report
spawn code-reviewer
await results
spawn security-auditor
await results
combine all findings
```

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    QualityFacade                         │
│  ─────────────────────────────────────────────────────  │
│  + audit(code): QualityReport                           │
│  + runSequence(config): Results                         │
│  + getStatus(): AgentStatus[]                           │
└─────────────────────────────────────────────────────────┘
            │           │           │           │
            ▼           ▼           ▼           ▼
       ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
       │ test-  │  │ code-  │  │security│  │access- │
       │engineer│  │reviewer│  │-auditor│  │ibility │
       └────────┘  └────────┘  └────────┘  └────────┘
```

**Consequences**

Benefits:
1. Shields clients from subsystem complexity
2. Promotes weak coupling
3. Doesn't prevent direct agent use when needed

Liabilities:
1. Can become catch-all if not careful
2. May hide useful agent-specific features

**Related Patterns**

- **Quality Template**: Defines the sequence the facade executes
- **Agent Command**: Encapsulates each agent invocation

---

### Hook Chain

**Intent**

Avoid coupling the sender of a validation request to its receivers by giving more than one hook a chance to handle the request. Chain the hooks and pass the request along until one handles it.

**Also Known As**

Validation Chain, Gate Sequence

**Motivation**

Code changes need multiple validations:
1. Format check (fast, local)
2. Lint check (fast, local)
3. Type check (medium, local)
4. Test pass (slow, may be external)

Rather than a monolithic validator, hooks form a chain:

```
Code Change
     │
     ▼
┌──────────┐  fail   ┌──────────┐
│ Formatter ├────────►│  REJECT  │
└────┬─────┘         └──────────┘
     │ pass
     ▼
┌──────────┐  fail   ┌──────────┐
│  Linter  ├────────►│  REJECT  │
└────┬─────┘         └──────────┘
     │ pass
     ▼
┌──────────┐  fail   ┌──────────┐
│TypeChecker├────────►│  REJECT  │
└────┬─────┘         └──────────┘
     │ pass
     ▼
┌──────────┐
│  ACCEPT  │
└──────────┘
```

**Applicability**

Use Hook Chain when:
- More than one hook may handle a validation
- Handlers not known a priori
- Want to issue request without specifying receiver explicitly

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                   <<interface>>                          │
│                     ValidationHook                       │
│  ─────────────────────────────────────────────────────  │
│  + validate(change: Change): Result                     │
│  + setNext(hook: ValidationHook): void                  │
└─────────────────────────────────────────────────────────┘
                           △
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │Formatter│       │ Linter  │       │  Tests  │
    │  Hook   │──────►│  Hook   │──────►│  Hook   │
    └─────────┘       └─────────┘       └─────────┘
```

**Consequences**

Benefits:
1. Reduced coupling
2. Flexibility in assigning responsibilities
3. Can short-circuit on first failure (fast feedback)

Liabilities:
1. No guarantee of handling
2. Can be hard to debug chain

**Related Patterns**

- **Quality Template**: Uses Hook Chain for its gates
- **Skill Decorator**: Similar chain but for adding behavior

---

## Behavioral Patterns

### Quality Template

**Intent**

Define the skeleton of a quality assurance algorithm, deferring some steps to subagents. Template Method lets subagents redefine certain steps without changing the algorithm's structure.

**Also Known As**

Quality Sequence, Gate Template

**Motivation**

Quality assurance follows a consistent pattern:
1. Setup (prepare context)
2. Test (verify correctness)
3. Review (check quality)
4. Security (find vulnerabilities)
5. Report (summarize findings)

The specific implementation of each step varies by project, but the sequence is stable.

```
TEMPLATE                    CUSTOMIZATION
────────                    ─────────────
1. Setup      ─────────────► Prepare test fixtures
2. Test       ─────────────► Run Jest/Pytest/Go test
3. Review     ─────────────► Apply project patterns
4. Security   ─────────────► OWASP for web, different for CLI
5. Report     ─────────────► Format for team preference
```

**Applicability**

Use Quality Template when:
- Want to implement invariant parts of algorithm once
- Common behavior should be localized
- Need to control extension points

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    QualityTemplate                       │
│  ─────────────────────────────────────────────────────  │
│  + runQuality(): Report           // template method    │
│  # setup(): void                  // hook               │
│  # test(): TestResult             // abstract           │
│  # review(): ReviewResult         // abstract           │
│  # security(): SecurityResult     // hook (optional)    │
│  # report(results): Report        // hook               │
└─────────────────────────────────────────────────────────┘
                           △
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │WebProject│      │CLIProject│      │APIProject│
    │ Template │      │ Template │      │ Template │
    └─────────┘       └─────────┘       └─────────┘
```

**Participants**

- **QualityTemplate**: Defines abstract operations for subagents to implement
- **ConcreteTemplate**: Implements abstract operations for specific project type

**Consequences**

Benefits:
1. Fundamental technique for code reuse
2. Inverts control ("Hollywood Principle")
3. Consistent quality process

Liabilities:
1. Can be hard to maintain with many variations
2. May limit flexibility if template too rigid

**Implementation**

```yaml
# quality-template.yaml
sequence:
  - name: setup
    required: true
    agent: null  # inline

  - name: test
    required: true
    agent: test-engineer
    config:
      coverage_threshold: 80%

  - name: review
    required: true
    agent: code-reviewer
    config:
      patterns: project-specific

  - name: security
    required: false  # only for relevant code
    agent: security-auditor
    triggers: [auth, data, api, input]

  - name: report
    required: true
    agent: null  # inline
    format: markdown
```

**Related Patterns**

- **Agent Facade**: Often implements Quality Template
- **Hook Chain**: Individual steps may be chains

---

### Skill Observer

**Intent**

Define a one-to-many dependency between file context and skills so that when context changes, all dependent skills are invoked automatically.

**Also Known As**

Auto-Invoke, Context Watcher, Trigger Pattern

**Motivation**

Skills should activate based on context, not explicit invocation:
- Editing `.jsx` file → React expertise needed
- Touching auth code → Security lens required
- Writing tests → Testing philosophy wanted

Without Observer, developer must remember to invoke skills. With Observer, context changes trigger appropriate skills.

```
CONTEXT CHANGE                OBSERVER REACTION
──────────────                ─────────────────
Open auth.js          ────►   Invoke /security-mindset
                              Invoke /owasp
Edit UserProfile.tsx  ────►   Invoke /abramov
Write test file       ────►   Invoke /dodds
```

**Applicability**

Use Skill Observer when:
- Change to one object requires changing others
- Object should notify others without knowing who
- Skills should auto-invoke based on context

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                      ContextSubject                      │
│  ─────────────────────────────────────────────────────  │
│  + attach(observer: SkillObserver): void                │
│  + detach(observer: SkillObserver): void                │
│  + notify(): void                                        │
│  - observers: SkillObserver[]                            │
│  - state: ContextState                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ notifies
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   <<interface>>                          │
│                    SkillObserver                         │
│  ─────────────────────────────────────────────────────  │
│  + update(context: ContextState): void                  │
│  + matches(context: ContextState): boolean              │
└─────────────────────────────────────────────────────────┘
                           △
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │ Bostock │       │  OWASP  │       │ Abramov │
    │Observer │       │Observer │       │Observer │
    └─────────┘       └─────────┘       └─────────┘
```

**Participants**

- **ContextSubject**: Knows its observers, provides interface for attaching
- **SkillObserver**: Interface for objects that should be notified
- **ConcreteObserver**: Maintains reference to skill, implements update

**Consequences**

Benefits:
1. Abstract coupling between context and skills
2. Support for broadcast communication
3. No manual invocation needed

Liabilities:
1. Unexpected updates (skill fires when not wanted)
2. Update cascade can be costly
3. May trigger too often (noise)

**Implementation**

```markdown
## In CLAUDE.md

| Context | Action |
|---------|--------|
| React/JSX/TSX files | INVOKE `/abramov` |
| Auth, login, passwords | INVOKE `/security-mindset` |
| D3.js or visualization | INVOKE `/bostock` |
| Writing tests | INVOKE `/dodds` |
```

Triggers can use:
- File patterns: `*.tsx`, `src/auth/*`
- Content patterns: `auth`, `login`, `password`
- Dependency detection: `d3` in package.json

**Related Patterns**

- **Canon Factory**: Observer uses Factory to get skills
- **Skill Decorator**: Observed skills may be decorated

---

### Context Memento

**Intent**

Without violating encapsulation, capture and externalize Claude's context state so it can be restored later.

**Also Known As**

Session Save, Context Checkpoint, Progress Save

**Motivation**

Long Claude Code sessions accumulate important context:
- Decisions made
- Files explored
- Patterns discovered
- Work in progress

When context fills or session ends, this knowledge is lost. The Context Memento captures state for later restoration.

```
SESSION 1                  MEMENTO                    SESSION 2
─────────                  ───────                    ─────────
Explored auth system  ──►  {                     ──►  Restore
Found patterns             "decisions": [...],       Continue work
Made decisions             "explored": [...],        Same context
Started work               "progress": [...],
Context filling            "todo": [...]
                          }
```

**Applicability**

Use Context Memento when:
- Snapshot of state must be saved
- Direct interface would expose implementation
- Need to preserve session progress

**Structure**

```
┌─────────────────────────────────────────────────────────┐
│                      Originator                          │
│                   (Claude Session)                       │
│  ─────────────────────────────────────────────────────  │
│  + createMemento(): Memento                             │
│  + restore(m: Memento): void                            │
│  - state: SessionState                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ creates/restores
                           ▼
┌─────────────────────────────────────────────────────────┐
│                       Memento                            │
│  ─────────────────────────────────────────────────────  │
│  + getState(): SessionState                             │
│  - state: SessionState                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ stored in
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Caretaker                           │
│                    (File System)                         │
│  ─────────────────────────────────────────────────────  │
│  + save(m: Memento, path: string): void                 │
│  + load(path: string): Memento                          │
└─────────────────────────────────────────────────────────┘
```

**Consequences**

Benefits:
1. Preserves encapsulation
2. Simplifies originator
3. Enables session continuity

Liabilities:
1. Can be expensive if state is large
2. Must define what state is essential
3. Restoration may be incomplete

**Implementation**

```markdown
## /save-progress command

Before context fills:
1. Summarize current state
2. List decisions made
3. List files explored
4. List work in progress
5. Write to .claude/sessions/progress-{timestamp}.md
6. Commit with "wip: save progress"

## /restore command

Start of new session:
1. Read latest progress file
2. Restore context with summary
3. Continue from last state
```

**Related Patterns**

- **Quality Template**: May checkpoint between steps
- **Agent Facade**: May save multi-agent state

---

## Compound Patterns

### Full Quality Pipeline

Combines multiple patterns for comprehensive quality assurance:

```
┌─────────────────────────────────────────────────────────┐
│                   FULL QUALITY PIPELINE                  │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  SKILL OBSERVER (auto-invoke)                           │
│         │                                                │
│         ▼                                                │
│  CANON FACTORY (domain expertise)                       │
│         │                                                │
│         ▼                                                │
│  SKILL DECORATOR (layer concerns)                       │
│         │                                                │
│         ▼                                                │
│  CODE WRITTEN                                            │
│         │                                                │
│         ▼                                                │
│  QUALITY TEMPLATE (sequence)                            │
│         │                                                │
│         ├── AGENT FACADE (coordinate)                   │
│         │        │                                       │
│         │        ├── test-engineer                      │
│         │        ├── code-reviewer                      │
│         │        └── security-auditor                   │
│         │                                                │
│         ▼                                                │
│  HOOK CHAIN (validate)                                  │
│         │                                                │
│         ├── format                                       │
│         ├── lint                                         │
│         └── test                                         │
│         │                                                │
│         ▼                                                │
│  CONTEXT MEMENTO (save progress)                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Pattern Relationships

```
                    SKILL OBSERVER
                         │
                         │ triggers
                         ▼
                    CANON FACTORY ◄──── PROFILE BUILDER
                         │                    │
                         │ creates            │ configures
                         ▼                    │
                    CANON SKILL ◄─────────────┘
                         │
                         │ decorated by
                         ▼
                   SKILL DECORATOR
                         │
                         │ guides
                         ▼
                    CODE WRITTEN
                         │
                         │ validated by
                         ▼
                   QUALITY TEMPLATE
                         │
                         │ uses
                         ├─────────────────┐
                         ▼                 ▼
                   AGENT FACADE       HOOK CHAIN
                         │                 │
                         │ coordinates     │ validates
                         ▼                 ▼
                    SUBAGENTS          PASS/FAIL
                         │
                         │ results to
                         ▼
                  CONTEXT MEMENTO
```

---

## Summary

| Pattern | Category | Problem | Solution |
|---------|----------|---------|----------|
| Canon Factory | Creational | Need domain expertise | Create appropriate canon skill |
| Profile Builder | Creational | Complex configuration | Build incrementally |
| Skill Decorator | Structural | Layer responsibilities | Wrap skills dynamically |
| Agent Facade | Structural | Complex agent coordination | Unified interface |
| Hook Chain | Structural | Multiple validations | Chain validators |
| Quality Template | Behavioral | Consistent process | Define skeleton algorithm |
| Skill Observer | Behavioral | Auto-invoke skills | Watch context changes |
| Context Memento | Behavioral | Preserve session | Capture/restore state |

---

## The Meta-Pattern

All patterns serve one goal: **Compound Quality**.

```
Individual patterns add value linearly.
Combined patterns multiply value.

Canon (1.3x) × Quality Sequence (1.2x) × Security (1.2x) × Parallel (2x)
= 3.7x effective development

Configuration is strategy made executable.
Patterns are strategy made repeatable.
```
