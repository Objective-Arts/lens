---
name: brevity
description: "Elements of Style - omit needless words, use active voice"
---

# Strunk & White: The Elements of Style

Apply the timeless rules from Strunk & White's compact masterpiece to make technical writing clear and forceful.

## Core Philosophy

> "Vigorous writing is concise. A sentence should contain no unnecessary words, a paragraph no unnecessary sentences, for the same reason that a drawing should have no unnecessary lines and a machine no unnecessary parts."

---

## The Essential Rules

### Rule 1: Omit Needless Words

The single most important rule. Every word must earn its place.

| Wordy | Concise |
|-------|---------|
| "He is a man who" | "He" |
| "This is a subject that" | "This subject" |
| "The reason why is that" | "Because" |
| "The fact that he had arrived" | "His arrival" |
| "In a hasty manner" | "Hastily" |
| "Used for fuel purposes" | "Used for fuel" |
| "Whether or not" | "Whether" |

### Rule 2: Use Active Voice

The active voice is direct and vigorous. The passive is weak and evasive.

**Passive (avoid)**:
```
The configuration file is read by the parser.
The exception was thrown by the validation module.
It was decided that the feature would be deprecated.
```

**Active (prefer)**:
```
The parser reads the configuration file.
The validation module threw the exception.
We deprecated the feature.
```

**When passive is acceptable**:
- The actor is unknown: "The server was compromised"
- The action matters more than the actor: "The data was corrupted"

### Rule 3: Put Statements in Positive Form

Say what something IS, not what it ISN'T.

| Negative | Positive |
|----------|----------|
| "He was not very often on time" | "He usually came late" |
| "Did not remember" | "Forgot" |
| "Did not have much confidence in" | "Distrusted" |
| "Not allowed" | "Prohibited" |
| "Does not have" | "Lacks" |
| "Not the same" | "Different" |

### Rule 4: Use Definite, Specific, Concrete Language

**Vague**:
```
A period of unfavorable weather set in.
```

**Specific**:
```
It rained every day for a week.
```

**In code documentation**:

**Vague**:
```javascript
// Handle the error appropriately
```

**Specific**:
```javascript
// Retry 3 times with exponential backoff, then throw
```

### Rule 5: Place Emphatic Words at the End

The end of a sentence carries weight. Put important information there.

**Weak**:
```
Humanity has hardly advanced in fortitude since that time, though in many other ways it has made great progress.
```

**Strong**:
```
Since that time, humanity has advanced in many ways, but not in fortitude.
```

---

## Applying to Technical Writing

### Function Documentation

**Before**:
```javascript
/**
 * This function is responsible for the process of
 * taking a string as input and returning a version
 * of that string that has been converted to uppercase.
 */
function toUpperCase(str) { ... }
```

**After**:
```javascript
/**
 * Convert string to uppercase.
 */
function toUpperCase(str) { ... }
```

### Error Messages

**Before**:
```
It is not possible for the operation to be completed
at the present time due to the fact that insufficient
permissions have been granted.
```

**After**:
```
Permission denied.
```

### API Documentation

**Before**:
```
This endpoint can be used for the purpose of retrieving
a list of all users that are currently registered in
the system's database.
```

**After**:
```
Returns all registered users.
```

---

## Common Violations in Technical Writing

### 1. Noun Stacks
**Bad**: "User authentication token validation failure"
**Good**: "Failed to validate the user's authentication token"

### 2. Weak Verbs + Nominalizations
**Bad**: "Perform an implementation of"
**Good**: "Implement"

**Bad**: "Make a modification to"
**Good**: "Modify"

### 3. There Is/Are Constructions
**Bad**: "There are three parameters that must be passed"
**Good**: "Pass three parameters"

### 4. It Is Constructions
**Bad**: "It is necessary to restart the server"
**Good**: "Restart the server"

---

## The 17 Principles (Summary)

1. Form possessive singular by adding 's
2. Use comma in series (Oxford comma)
3. Enclose parenthetic expressions between commas
4. Place comma before conjunction in compound sentence
5. Do not join independent clauses with comma
6. Do not break sentences in two
7. Use colon after independent clause
8. Use dash for abrupt break
9. Number of subject determines number of verb
10. Use proper case of pronoun
11. **Omit needless words**
12. Avoid succession of loose sentences
13. Express parallel ideas in parallel form
14. Keep related words together
15. Keep to one tense
16. Place emphatic words at end
17. **Use active voice**

---

## Quick Reference Card

| Instead of | Write |
|------------|-------|
| "The question as to whether" | "Whether" |
| "There is no doubt but that" | "Doubtless" |
| "Used for X purposes" | "Used for X" |
| "He is a man who" | "He" |
| "In a careful manner" | "Carefully" |
| "This is a topic that" | "This topic" |
| "The reason is because" | "Because" |
| "Owing to the fact that" | "Since" |
| "In spite of the fact that" | "Although" |
| "Call your attention to the fact that" | "Remind you" |

---

## Resources

- "The Elements of Style" by Strunk & White (1959, revised editions)
- Original 1918 edition by William Strunk Jr.
