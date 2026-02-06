# Engineering Philosophy Canon

3 skills providing systematic thinking about failure, safety, and resilience.

## The Experts

| Skill | Focus | Command |
|-------|-------|---------|
| **failure** | Form follows failure, learning from failure | `/failure` |
| **safety** | System safety, STAMP/STPA | `/safety` |
| **resilience** | Antifragility, optionality, via negativa | `/resilience` |

## The Failure Trilogy

These three form a complete philosophy of failure:

```
FAILURE           SAFETY            RESILIENCE
─────────         ─────────         ─────────
PAST              PRESENT           FUTURE
"Learn from       "Prevent          "Gain from
 failure"          failure"          failure"

Historical        Systematic        Antifragile
analysis          prevention        design
```

## When to Apply

| Context | Primary Skill |
|---------|---------------|
| Post-mortem analysis | failure |
| Safety-critical systems | safety |
| Architecture decisions | resilience |
| Risk assessment | All three |
| System design | safety + resilience |
| Understanding past bugs | failure |

## Core Principles

### From failure
- Form follows failure (not function)
- Success breeds complacency
- Case studies teach more than theory
- Constraints drive innovation

### From safety
- Accidents are system failures, not component failures
- Safety is a control problem
- Focus on constraints, not just causes
- Humans are not the problem

### From resilience
- Prefer antifragile over robust
- Via negativa: what to remove matters more
- Skin in the game: decision-makers bear consequences
- Optionality: preserve the right to change

## Integration with Other Canon

Engineering Philosophy integrates with:

- **Security** (security-mindset) - Threat modeling is failure anticipation
- **Testing** (react-test/test-doubles) - Tests are failure detection
- **UI/UX** (personas) - Undo patterns assume failure
- **Business** - resilience and failure apply directly to business strategy (see Business README)

## File Locations

```
canon/engineering/
├── README.md           (this file)
├── failure/SKILL.md
├── safety/SKILL.md
└── resilience/SKILL.md
```
