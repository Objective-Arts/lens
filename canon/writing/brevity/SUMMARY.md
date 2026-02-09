# /brevity Summary

> "Omit needless words."

## Essential Rules

| Rule | Example |
|------|---------|
| **Omit needless words** | "the reason is that" → "because" |
| **Use active voice** | "was thrown by" → "threw" |
| **Positive form** | "did not remember" → "forgot" |
| **Specific language** | "a period of unfavorable weather" → "it rained" |

## Wordy → Concise

| Wordy | Concise |
|-------|---------|
| "He is a man who" | "He" |
| "The fact that he arrived" | "His arrival" |
| "Whether or not" | "Whether" |
| "Due to the fact that" | "Because" |
| "In order to" | "To" |
| "Used for fuel purposes" | "Used for fuel" |

## Active vs Passive

```
// PASSIVE (avoid):
The configuration file is read by the parser.

// ACTIVE (prefer):
The parser reads the configuration file.
```

## Common Violations

```javascript
// BAD: Noun stacks
"User authentication token validation failure"

// GOOD: Clear verb
"Failed to validate the user's authentication token"

// BAD: There is/are
"There are three parameters that must be passed"

// GOOD: Direct
"Pass three parameters"
```

## Quick Test

Every word must earn its place. If removing it loses no meaning, remove it.

## When to Use

- Technical documentation
- Code comments
- Error messages
- API documentation

## Concrete Checks (MUST ANSWER)

- [ ] **Word removal test:** Read each sentence and try removing one word at a time. Does any removal preserve the meaning? If yes, remove that word.
- [ ] **Passive voice scan:** Search for "is/was/were/been + past participle" constructions. Can each one be rewritten in active voice?
- [ ] **"In order to" check:** Search for "in order to", "due to the fact that", "whether or not", "the fact that". Replace every instance.
- [ ] **"There is/are" check:** Search for sentences starting with "There is" or "There are". Rewrite each to lead with the subject.
- [ ] **Noun stack check:** Does any phrase chain 3+ nouns without a verb (e.g., "user authentication token validation failure")? Break it up with verbs.
