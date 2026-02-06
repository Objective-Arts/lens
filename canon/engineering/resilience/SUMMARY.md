# /resilience Summary

> "Don't aim for robust. Aim for antifragile."

## The Triad

| Fragile | Robust | Antifragile |
|---------|--------|-------------|
| Harmed by volatility | Unaffected | Gains from volatility |
| Glass | Rock | Muscle |
| Wants calm | Tolerates chaos | Needs chaos |

## Core Principles

### Via Negativa
What you remove matters more than what you add.

```
Additive: "What feature to add?"
Via Negativa: "What should we remove?"
```

### Skin in the Game
Decision-makers must bear consequences.

- Does the author get paged when it fails?
- Does the PM see failure metrics?

### Barbell Strategy
Combine extreme safety (90%) with extreme risk (10%). Avoid the fragile middle.

```
SAFE (90%): PostgreSQL, proven auth, standard REST
RISKY (10%): New DB experiment, ML feature, isolated service
```

### Optionality Over Optimization
Preserve ability to change. Don't lock in.

```javascript
// FRAGILE: Locked to specific provider
import { send } from 'specific-sdk';

// ANTIFRAGILE: Can switch
interface Sender { send(msg: Msg): void }
```

### Redundancy Is Not Waste
Slack saves you. 100% utilization = fragile.

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| "Optimize for efficiency" | Optimize for resilience |
| "Add a feature" | What to remove? |
| "Single source of truth" | Redundancy at critical points |
| "Move fast break things" | Bounded experiments |

## When to Use

- System resilience design
- Architecture decisions
- Risk assessment
