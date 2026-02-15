---
name: docs
description: "Diátaxis documentation framework - the right doc for the right need"
---

# Daniele Procida: Diátaxis Documentation Framework

Apply Procida's Diátaxis framework for creating documentation that serves its readers.

## Core Philosophy

> "Documentation needs to include and be structured around its four different functions: tutorials, how-to guides, technical reference, and explanation."

### The Problem Diátaxis Solves

Documentation fails when it mixes purposes. A reference doc that tries to teach, or a tutorial that tries to explain everything, serves no one well.

### The Four Quadrants

```
                    PRACTICAL                      THEORETICAL
                    (doing)                        (understanding)
              ┌─────────────────────────────┬─────────────────────────────┐
   LEARNING   │                             │                             │
   (acquiring)│         TUTORIALS           │        EXPLANATION          │
              │    Learning-oriented        │   Understanding-oriented    │
              │    "Follow me as I show     │   "Here's why this works    │
              │     you how to do X"        │    the way it does"         │
              │                             │                             │
              ├─────────────────────────────┼─────────────────────────────┤
   WORKING    │                             │                             │
   (applying) │         HOW-TO              │        REFERENCE            │
              │    Task-oriented            │   Information-oriented      │
              │    "Here's how to           │   "Here's the complete      │
              │     accomplish X"           │    specification"           │
              │                             │                             │
              └─────────────────────────────┴─────────────────────────────┘
```

---

## The Four Types

### 1. Tutorials (Learning-Oriented)

**Purpose**: Take a beginner through a series of steps to complete a meaningful project.

**Characteristics**:
- Focused on *learning*, not accomplishment
- Learning by *doing*
- The reader should feel *successful* at each step
- No unnecessary explanation (save it for Explanation docs)
- Hold the reader's hand completely

**Structure**:
```markdown
# Tutorial: Build Your First Widget

## What You'll Learn
- How to create a widget
- How to configure basic settings
- How to deploy to production

## Prerequisites
- Node.js installed
- Basic JavaScript knowledge

## Step 1: Create the Project
[Explicit instructions, no choices]

## Step 2: Add Configuration
[Explicit instructions, explain only what's necessary]

## Step 3: Deploy
[Explicit instructions, celebrate success]

## Next Steps
[Point to How-To guides for specific tasks]
```

**Anti-patterns**:
- Offering choices ("you could do X or Y")
- Explaining theory while teaching
- Assuming knowledge
- Skipping steps

---

### 2. How-To Guides (Task-Oriented)

**Purpose**: Show how to accomplish a specific task.

**Characteristics**:
- Focused on *achieving a goal*
- Assumes competence
- Addresses a specific problem
- No teaching (that's for tutorials)
- No explaining (that's for explanation)

**Structure**:
```markdown
# How to Configure Authentication

## Prerequisites
- Completed basic setup tutorial
- Admin access to the dashboard

## Steps

1. Navigate to Settings > Auth
2. Enable OAuth provider:
   ```
   AUTH_PROVIDER=google
   ```
3. Add credentials from Google Console
4. Test with: `npm run auth:test`

## Troubleshooting
- **Error X**: Check Y
- **Error Z**: Ensure A is configured
```

**Anti-patterns**:
- Teaching while guiding
- Excessive explanation
- Being too restrictive about how to accomplish the goal

---

### 3. Reference (Information-Oriented)

**Purpose**: Describe the machinery - accurate, complete, austere.

**Characteristics**:
- Structured by the code, not by tasks
- Consistent format throughout
- Accurate and up-to-date
- No teaching, no how-to
- Like a dictionary: look up what you need

**Structure**:
```markdown
# API Reference: UserService

## Methods

### `createUser(data: UserInput): Promise<User>`

Creates a new user.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| data | UserInput | Yes | User creation data |

**Returns**: `Promise<User>` - The created user object

**Throws**:
- `ValidationError` - If input is invalid
- `DuplicateError` - If email already exists

**Example**:
```typescript
const user = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe'
});
```
```

**Anti-patterns**:
- Mixing explanation with reference
- Inconsistent formatting
- Being incomplete to avoid repetition
- Explaining *why* (save for explanation)

---

### 4. Explanation (Understanding-Oriented)

**Purpose**: Explain *why* things work the way they do, provide context.

**Characteristics**:
- Focused on *understanding*
- Discusses alternatives, history, rationale
- Can be discursive and exploratory
- Not about doing, about thinking
- Makes connections clear

**Structure**:
```markdown
# Why We Use Event Sourcing

## The Problem

Traditional CRUD has limitations...

## Historical Context

Event sourcing emerged from...

## How It Works (Conceptually)

Instead of storing state, we store events...

## Trade-offs

### Advantages
- Complete audit trail
- Time travel debugging

### Disadvantages
- Query complexity
- Storage requirements

## When to Use It

Event sourcing is appropriate when...

## Alternatives Considered

We also evaluated:
- Traditional CRUD
- Change Data Capture

## Further Reading
- [Link to deeper dive]
```

**Anti-patterns**:
- Including steps (that's how-to)
- Being too brief
- Avoiding opinions and judgment

---

## Decision Tree: Which Type?

```
What is the reader doing?
│
├── Learning something new?
│   └── TUTORIAL
│       "Let me show you how to build X step by step"
│
├── Trying to accomplish a task?
│   └── HOW-TO
│       "Here's how to do X"
│
├── Looking up specific information?
│   └── REFERENCE
│       "Here's the spec for X"
│
└── Trying to understand something?
    └── EXPLANATION
        "Here's why X works this way"
```

---

## Placement Guidelines

| Type | Location | Examples |
|------|----------|----------|
| Tutorial | `docs/tutorials/` | Getting started, build-your-first |
| How-To | `docs/how-to/` or README sections | Configuration, deployment, migration |
| Reference | `docs/api/`, inline (JSDoc/JavaDoc) | API docs, config options |
| Explanation | `docs/architecture/`, `docs/concepts/` | Design docs, ADRs |

---

## Quality Checklist

### Tutorials
- [ ] Complete beginner can follow without prior knowledge
- [ ] Every step is explicit with no choices
- [ ] Reader accomplishes something meaningful
- [ ] Minimal explanation (just enough to proceed)
- [ ] Tests work at each checkpoint

### How-To
- [ ] Solves a specific, real problem
- [ ] Assumes competence (no teaching)
- [ ] Steps are numbered and clear
- [ ] Includes troubleshooting for common issues
- [ ] No extraneous explanation

### Reference
- [ ] Complete - nothing missing
- [ ] Consistent format throughout
- [ ] Accurate to current implementation
- [ ] Includes examples for every item
- [ ] Organized by the structure of the code

### Explanation
- [ ] Provides genuine insight
- [ ] Discusses alternatives and trade-offs
- [ ] Connects to bigger picture
- [ ] Takes a position (not wishy-washy)
- [ ] Links to relevant how-tos and reference

---

## Common Mistakes

### Mixing Types

**Wrong**:
```markdown
# Authentication API

The authenticate() method logs users in. To use it, first
install the package (npm install auth), then import it...
[mixing reference with tutorial]
```

**Right**: Separate reference from tutorial, link between them.

### Tutorial That Teaches Theory

**Wrong**:
```markdown
Step 3: Now we'll use dependency injection. Dependency
injection is a pattern where dependencies are provided
to a class rather than created by it...
[teaching in a tutorial]
```

**Right**: Save explanation for explanation docs. In tutorial, just do it.

### Reference Without Examples

**Wrong**:
```markdown
### `configure(options)`
Configures the system with the given options.
```

**Right**:
```markdown
### `configure(options: ConfigOptions): void`

Configures the system.

**Example**:
```typescript
configure({
  timeout: 5000,
  retries: 3
});
```
```

---

## Resources

- [Diátaxis Documentation](https://diataxis.fr/)
- [Procida's Talk at Write the Docs](https://www.youtube.com/watch?v=t4vKPhjcMZg)
- [The Grand Unified Theory of Documentation](https://documentation.divio.com/)
