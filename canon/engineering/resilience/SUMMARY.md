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

## Concrete Checks (MUST ANSWER)

- [ ] **Gains from failure?** Name one specific way the system improves after encountering a small failure (e.g., circuit breaker learns, retry backoff adapts, alert triggers review). If nothing improves, the system is robust at best, not antifragile.
- [ ] **Circuit breakers present?** For each external dependency, is there a mechanism that stops calling it after repeated failures and recovers automatically? If calls continue hammering a dead service, add a circuit breaker.
- [ ] **Graceful degradation paths defined?** For each non-critical feature, what happens when it fails? Is there a fallback that preserves the core function? If a logging failure crashes the app, that is fragile.
- [ ] **Provider lock-in check:** Is any critical function callable only through one provider's SDK with no interface abstraction? If swapping providers requires rewriting business logic, add an interface boundary.
- [ ] **Utilization headroom:** Is any resource (CPU, memory, connections, rate limits) routinely above 80% utilization? Systems at capacity have no room to absorb spikes.
