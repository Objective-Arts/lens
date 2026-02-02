# /schneier Summary

> "Security is a process, not a product."

## Security Mindset

| Principle | Meaning |
|-----------|---------|
| **Think like an attacker** | How would I break this? |
| **Assume breach** | What happens when (not if) security fails? |
| **Defense in depth** | Multiple layers, no single point of failure |
| **Trust minimization** | Give minimum required privileges |

## Threat Modeling Questions

1. What are we protecting? (Assets)
2. From whom? (Threat actors)
3. What can go wrong? (Attack vectors)
4. What's the impact? (Risk assessment)

## Fail Securely

```csharp
// BAD: Fails open
try {
    if (user.HasPermission(resource)) return Allow();
} catch { }
return Allow(); // WRONG

// GOOD: Fails closed
try {
    if (user.HasPermission(resource)) return Allow();
} catch (Exception ex) {
    Log.Error(ex);
}
return Deny(); // Default deny
```

## Trust Nothing from Outside

- All user input is malicious until validated
- All external APIs may be compromised
- All network traffic may be intercepted
- All client-side controls may be bypassed

## Security Review Questions

1. **Authentication**: How do we know who this is?
2. **Authorization**: Should they be allowed to do this?
3. **Input validation**: What happens with malformed input?
4. **Error handling**: Do errors leak information?
5. **Logging**: Would we detect an attack?
6. **Data protection**: Is sensitive data encrypted?

## Anti-Patterns (Always Reject)

- Security through obscurity
- Rolling your own crypto
- Trusting client-side validation
- Storing passwords reversibly
- Hardcoded secrets

## When to Use

- Designing authentication/authorization
- Handling sensitive data
- Processing user input
- Security-focused code reviews
