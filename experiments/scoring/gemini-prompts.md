# Gemini Scoring Prompts

Use these prompts with the `gemini-reviewer` MCP tool or directly with Gemini.

---

## General Instructions for Gemini

Always include this preamble:

```
You are evaluating code quality. Score strictly against the rubric provided.
Do not infer intent - score only what is present in the code.
Return ONLY valid JSON matching the specified format.
Be critical - a perfect score should be rare.
```

---

## Experiment 8: Angular Dashboard

```
Score this Angular code against modern Angular 17+ best practices.

RUBRIC (100 points total):

MODERN PATTERNS (40 pts):
- Standalone components (no NgModule): 10 pts
- Signals for state (signal(), computed()): 15 pts
- inject() function over constructor DI: 10 pts
- OnPush change detection: 5 pts

ARCHITECTURE (30 pts):
- Smart/dumb component separation: 15 pts
- Single responsibility per component: 10 pts
- Clear input/output typing: 5 pts

REACTIVE (20 pts):
- Async pipe usage (not manual subscribe): 10 pts
- Proper cleanup (takeUntilDestroyed): 5 pts
- No .subscribe() in components: 5 pts

GENERAL (10 pts):
- Error handling: 3 pts
- Loading states: 3 pts
- No TypeScript 'any': 4 pts

CODE TO EVALUATE:
[INSERT CODE HERE]

Return JSON:
{
  "modern_patterns": {
    "standalone": {"score": N, "max": 10, "evidence": "..."},
    "signals": {"score": N, "max": 15, "evidence": "..."},
    "inject": {"score": N, "max": 10, "evidence": "..."},
    "onpush": {"score": N, "max": 5, "evidence": "..."}
  },
  "architecture": {
    "smart_dumb": {"score": N, "max": 15, "evidence": "..."},
    "srp": {"score": N, "max": 10, "evidence": "..."},
    "typing": {"score": N, "max": 5, "evidence": "..."}
  },
  "reactive": {
    "async_pipe": {"score": N, "max": 10, "evidence": "..."},
    "cleanup": {"score": N, "max": 5, "evidence": "..."},
    "no_subscribe": {"score": N, "max": 5, "evidence": "..."}
  },
  "general": {
    "error_handling": {"score": N, "max": 3, "evidence": "..."},
    "loading": {"score": N, "max": 3, "evidence": "..."},
    "no_any": {"score": N, "max": 4, "evidence": "..."}
  },
  "total": N,
  "summary": "..."
}
```

---

## Experiment 9: Java Domain Model (Bloch)

```
Score this Java code against Joshua Bloch's Effective Java principles.

RUBRIC (100 points total):

OBJECT CREATION (20 pts):
- Item 1 - Static factories over constructors: 10 pts
- Item 2 - Builder for complex construction: 10 pts

CLASSES (25 pts):
- Item 15 - Minimize mutability (immutable value objects): 15 pts
- Item 17 - Final classes or documented inheritance: 5 pts
- Item 64 - Program to interfaces (List not ArrayList): 5 pts

METHODS (20 pts):
- Item 49 - Validate parameters: 10 pts
- Item 50 - Defensive copies: 10 pts

GENERAL (20 pts):
- Item 10/11 - Proper equals/hashCode: 10 pts
- Item 54 - Empty collections, not null: 5 pts
- Item 55 - Optional for nullable returns: 5 pts

DOMAIN RICHNESS (15 pts):
- Rich enums with behavior: 5 pts
- Behavior in domain objects (not anemic): 5 pts
- State transition validation: 5 pts

CODE TO EVALUATE:
[INSERT CODE HERE]

Return JSON:
{
  "object_creation": {
    "static_factories": {"score": N, "max": 10, "examples": ["Money.of()", ...]},
    "builders": {"score": N, "max": 10, "examples": [...]}
  },
  "classes": {
    "immutability": {"score": N, "max": 15, "evidence": "..."},
    "inheritance_control": {"score": N, "max": 5, "evidence": "..."},
    "interfaces": {"score": N, "max": 5, "evidence": "..."}
  },
  "methods": {
    "parameter_validation": {"score": N, "max": 10, "examples": [...]},
    "defensive_copies": {"score": N, "max": 10, "examples": [...]}
  },
  "general": {
    "equals_hashcode": {"score": N, "max": 10, "evidence": "..."},
    "empty_not_null": {"score": N, "max": 5, "evidence": "..."},
    "optional_usage": {"score": N, "max": 5, "evidence": "..."}
  },
  "domain_richness": {
    "rich_enums": {"score": N, "max": 5, "evidence": "..."},
    "behavior": {"score": N, "max": 5, "evidence": "..."},
    "state_transitions": {"score": N, "max": 5, "evidence": "..."}
  },
  "total": N,
  "is_anemic": true/false,
  "summary": "..."
}
```

---

## Experiment 2: Password Reset (Security)

```
Score this password reset implementation against OWASP security guidelines.

RUBRIC (100 points total):

TOKEN SECURITY (35 pts):
- Cryptographically random token (crypto.randomBytes): 15 pts
- Token hashed before storage: 10 pts
- Token single-use (deleted after use): 10 pts

TIMING/ENUMERATION (25 pts):
- Constant-time token comparison: 10 pts
- Same response for valid/invalid email: 15 pts

PASSWORD HANDLING (20 pts):
- Strong hashing (argon2/bcrypt): 10 pts
- Password validation (length, complexity): 10 pts

RATE LIMITING (10 pts):
- Rate limiting on forgot-password: 10 pts

ERROR HANDLING (10 pts):
- No secrets in error messages: 5 pts
- No stack traces exposed: 5 pts

CODE TO EVALUATE:
[INSERT CODE HERE]

Return JSON:
{
  "token_security": {
    "random_generation": {"score": N, "max": 15, "method_used": "..."},
    "hashed_storage": {"score": N, "max": 10, "evidence": "..."},
    "single_use": {"score": N, "max": 10, "evidence": "..."}
  },
  "timing_enumeration": {
    "constant_time": {"score": N, "max": 10, "evidence": "..."},
    "no_user_enumeration": {"score": N, "max": 15, "evidence": "..."}
  },
  "password_handling": {
    "hashing_algorithm": {"score": N, "max": 10, "algorithm": "..."},
    "validation": {"score": N, "max": 10, "rules": [...]}
  },
  "rate_limiting": {
    "present": {"score": N, "max": 10, "evidence": "..."}
  },
  "error_handling": {
    "no_secrets": {"score": N, "max": 5, "evidence": "..."},
    "no_stack_traces": {"score": N, "max": 5, "evidence": "..."}
  },
  "total": N,
  "vulnerabilities_found": ["CWE-XXX: description", ...],
  "summary": "..."
}
```

---

## Experiment 1: Healthcare API (HIPAA + Structure)

```
Score this Java healthcare API against HIPAA logging requirements and
code structure principles.

RUBRIC (100 points total):

HIPAA COMPLIANCE (40 pts):
- No PHI in logs (names, SSN, DOB): 25 pts
- No PHI in error messages: 10 pts
- Audit logging for access (debug level): 5 pts

CODE STRUCTURE (35 pts):
- Single responsibility (one entity per controller): 15 pts
- Methods under 30 lines: 10 pts
- Utility extraction (parsers, mappers): 10 pts

THREAD SAFETY (15 pts):
- Thread-safe date parsing: 15 pts
  (DateTimeFormatter or ThreadLocal<SimpleDateFormat>)

ERROR HANDLING (10 pts):
- Appropriate HTTP status codes: 5 pts
- Safe error messages: 5 pts

CODE TO EVALUATE:
[INSERT CODE HERE]

Return JSON:
{
  "hipaa": {
    "no_phi_logs": {"score": N, "max": 25, "violations": [...]},
    "no_phi_errors": {"score": N, "max": 10, "violations": [...]},
    "audit_logging": {"score": N, "max": 5, "evidence": "..."}
  },
  "structure": {
    "srp": {"score": N, "max": 15, "entities_per_file": N},
    "method_length": {"score": N, "max": 10, "longest_method": N},
    "utility_extraction": {"score": N, "max": 10, "utilities": [...]}
  },
  "thread_safety": {
    "date_parsing": {"score": N, "max": 15, "approach": "..."}
  },
  "error_handling": {
    "status_codes": {"score": N, "max": 5, "evidence": "..."},
    "safe_messages": {"score": N, "max": 5, "evidence": "..."}
  },
  "total": N,
  "phi_found": ["field at line N", ...],
  "summary": "..."
}
```

---

## Using with MCP

```typescript
// Example: Score Java code with Gemini via MCP
const javaCode = fs.readFileSync('output/Order.java', 'utf-8');
const allCode = getAllJavaFiles('output/'); // concatenate all files

const result = await tools.mcp__gemini_reviewer__gemini_review({
  code: allCode,
  context: BLOCH_RUBRIC, // paste the rubric above
  focus: 'general'
});

// Parse the JSON from result
const scores = JSON.parse(extractJson(result));
console.log(`Total: ${scores.total}/100`);
```

---

## Batch Scoring Script

```bash
#!/bin/bash
# score-all.sh - Score all runs for an experiment

EXPERIMENT=$1  # e.g., "exp9-java"

for run in outputs/$EXPERIMENT/run*/; do
  echo "Scoring $run..."

  # Concatenate all code files
  cat "$run"/*.java > /tmp/code-to-score.txt

  # Call Gemini via MCP (pseudocode - actual implementation depends on setup)
  claude --print "$(cat gemini-prompts/java-bloch.txt)" \
         --file /tmp/code-to-score.txt \
         > "scores/$EXPERIMENT/$(basename $run).json"
done

# Aggregate scores
python aggregate-scores.py "scores/$EXPERIMENT/"
```
