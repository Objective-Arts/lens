# Engineering Philosophy Canon

3 masters providing systematic thinking about failure, safety, and resilience.

## The Experts

| Master | Works | Focus | Skill |
|--------|-------|-------|-------|
| **Henry Petroski** | To Engineer Is Human, Design Paradigms | Form follows failure, learning from failure | `/petroski` |
| **Nancy Leveson** | Engineering a Safer World, Safeware | System safety, STAMP/STPA | `/leveson` |
| **Nassim Taleb** | Antifragile, Black Swan, Skin in the Game | Antifragility, optionality, via negativa | `/taleb` |

## The Failure Trilogy

These three form a complete philosophy of failure:

```
PETROSKI          LEVESON           TALEB
─────────         ─────────         ─────────
PAST              PRESENT           FUTURE
"Learn from       "Prevent          "Gain from
 failure"          failure"          failure"

Historical        Systematic        Antifragile
analysis          prevention        design
```

## When to Apply

| Context | Primary Expert |
|---------|----------------|
| Post-mortem analysis | Petroski |
| Safety-critical systems | Leveson |
| Architecture decisions | Taleb |
| Risk assessment | All three |
| System design | Leveson + Taleb |
| Understanding past bugs | Petroski |

## Core Principles

### From Petroski
- Form follows failure (not function)
- Success breeds complacency
- Case studies teach more than theory
- Constraints drive innovation

### From Leveson
- Accidents are system failures, not component failures
- Safety is a control problem
- Focus on constraints, not just causes
- Humans are not the problem

### From Taleb
- Prefer antifragile over robust
- Via negativa: what to remove matters more
- Skin in the game: decision-makers bear consequences
- Optionality: preserve the right to change

## Integration with Other Canon

Engineering Philosophy integrates with:

- **Security** (Schneier) - Threat modeling is failure anticipation
- **Testing** (Dodds/Meszaros) - Tests are failure detection
- **UI/UX** (Cooper) - Undo patterns assume failure
- **Business** - Taleb and Petroski apply directly to business strategy (see Business README)

## File Locations

```
canon/engineering/
├── README.md           (this file)
├── petroski/SKILL.md
├── leveson/SKILL.md
└── taleb/SKILL.md
```
