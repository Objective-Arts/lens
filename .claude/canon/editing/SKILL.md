---
name: editing
description: "On Writing - kill your darlings, practical writing advice"
---

# Stephen King: On Writing

Apply Stephen King's practical, no-nonsense writing advice to technical documentation and code.

## Core Philosophy

> "Kill your darlings, kill your darlings, even when it breaks your egocentric little scribbler's heart, kill your darlings."

The phrase you're most proud of? Cut it. The clever comment you admire? Delete it. If you love it too much, it's probably self-indulgent and doesn't serve the reader.

---

## King's Toolbox

### 1. Vocabulary

Use the first word that comes to mind, if it's appropriate. Don't dress up your vocabulary.

**Bad (pretentious)**:
```javascript
// Instantiate a new configuration object and effectuate
// the necessary parameterization for optimal functionality
```

**Good (plain)**:
```javascript
// Create a config object with default settings
```

> "One of the really bad things you can do to your writing is to dress up the vocabulary."

### 2. Grammar

Know the rules so you can break them deliberately.

**The most important rule**: Subject-Verb-Object. Keep it simple.

### 3. Avoid the Passive Voice

> "Passive voice is weak and safe."

The passive voice creates distance, avoids responsibility, and bores the reader.

**Passive**: "The error was handled by the catch block"
**Active**: "The catch block handles the error"

### 4. Avoid Adverbs

> "The road to hell is paved with adverbs."

Adverbs are a sign of weak verbs. Find a stronger verb instead.

| Weak | Strong |
|------|--------|
| "ran quickly" | "sprinted" |
| "said loudly" | "shouted" |
| "very important" | "critical" |
| "totally broken" | "broken" |
| "really fast" | "fast" |

---

## The Writing Process

### 1. Write with the Door Closed

First draft is just you. Write without thinking about the audience. Get it down.

For code: Write the first version of documentation as notes to yourself.

### 2. Rewrite with the Door Open

Second draft is for readers. Cut, clarify, restructure.

For code: Revise documentation imagining a tired developer at 2am.

### 3. The Formula

**Second Draft = First Draft - 10%**

Whatever you wrote, cut at least 10%. If you wrote 1000 words, you should end with 900 or fewer.

---

## Kill Your Darlings in Practice

### The Clever Comment

**Before (your darling)**:
```javascript
// Here be dragons! This function is a labyrinth of
// Minotaur-like complexity where many a brave developer
// has lost their way. Proceed with caution and a ball of yarn.
```

**After (killed)**:
```javascript
// Complex validation logic - see docs/validation.md for details
```

### The Elaborate Explanation

**Before (your darling)**:
```markdown
## A Brief History of Configuration Management

In the early days of computing, configuration was handled
through punched cards. As technology evolved, we moved to
flat files, then INI files, and eventually to the elegant
YAML format we use today...
```

**After (killed)**:
```markdown
## Configuration

Edit `config.yaml` to customize settings.
```

### The Unnecessary Metaphor

**Before (your darling)**:
```javascript
// Like a phoenix rising from the ashes, this retry logic
// gives our failed requests a second chance at life
async function retryRequest() { ... }
```

**After (killed)**:
```javascript
// Retry failed requests up to 3 times
async function retryRequest() { ... }
```

---

## Practical Rules

### 1. Read a Lot, Write a Lot

> "If you want to be a writer, you must do two things above all others: read a lot and write a lot."

For technical writing: Read good documentation. Read bad documentation. Know the difference.

### 2. Write Every Day

The only way to get better is to practice. Write commit messages with care. Write comments thoughtfully. Every piece of writing is practice.

### 3. Show, Don't Tell

**Tell**:
```markdown
This function is very efficient and fast.
```

**Show**:
```markdown
Processes 1M records in <100ms.
```

### 4. Honest Writing

> "Writing is not life, but I think that sometimes it can be a way back to life."

Write honestly. If something is hard, say it's hard. If there's a hack, call it a hack. Readers respect honesty.

---

## The Fear Test

> "I'm convinced that fear is at the root of most bad writing."

Bad writing comes from fear:
- Fear of being unclear → overexplanation
- Fear of seeming dumb → jargon
- Fear of being wrong → hedge words

**Good writing is fearless writing.**

---

## Quick Rules

1. **Cut 10%** after every draft
2. **No adverbs** unless absolutely necessary
3. **Active voice** always
4. **Kill your darlings** especially the ones you love
5. **Simple words** beat complex ones
6. **Short sentences** beat long ones
7. **Be honest** about complexity and limitations

---

## Resources

- "On Writing: A Memoir of the Craft" by Stephen King (2000)
