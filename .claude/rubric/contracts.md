# Abstract Quality Contracts

7 fixed abstract types for boundary enforcement. Read by phases 1 (plan), 2 (structure), and 3 (implementation).

## Types

| Type | Meaning | Boundary Signal |
|------|---------|-----------------|
| ValidatedInput | Data that passed boundary validation | CLI args, API params, form fields, query strings |
| SafePath | Path constructed through validation, not concatenation | path.join with user input, file reads, directory traversal |
| CausedError | Error preserving original cause chain | catch blocks, error construction, re-throws |
| Secret | Value that must never appear in logs/errors/responses | passwords, tokens, API keys, connection strings |
| ExternalData | Untrusted data from outside the system | file reads, API responses, env vars, stdin |
| BoundedOperation | Operation with timeout or size limit | recursion, network calls, file reads, loops over user input |
| IdempotentAction | Action safe to retry without side effects | file writes, DB updates, state mutations |

## Detection

For each function/boundary in the target, check:
- Does it accept user input? → ValidatedInput
- Does it construct file paths with external data? → SafePath
- Does it catch and re-throw errors? → CausedError
- Does it handle credentials/tokens? → Secret
- Does it read files/APIs/env? → ExternalData
- Does it do I/O that could hang or grow unbounded? → BoundedOperation
- Could it be called twice with the same input? → IdempotentAction

## Language Idioms

| Language | ValidatedInput | SafePath | CausedError | Secret |
|----------|---------------|----------|-------------|--------|
| TypeScript | Branded type: `type ValidatedName = string & { __brand: 'ValidatedName' }` | `type SafePath = string & { __brand: 'SafePath' }` with factory | `new Error(msg, { cause: e })` | Opaque type, redacted toString |
| Python | Pydantic model with validators | Pydantic `FilePath` / custom validator | Exception chaining: `raise X from e` | SecretStr (pydantic) |
| Java | Wrapper class with factory method | `Path.normalize()` + prefix check | `new Exception(msg, cause)` | char[] not String |
| Go | Custom type with constructor: `type ValidatedName string` | Custom type + constructor | `fmt.Errorf("...: %w", err)` | Redact in String() |
| C# | Record with validation in ctor | `Path.GetFullPath` + prefix check | `new Exception(msg, inner)` | SecureString or record |

## Contract Table Format (Phase 2 output)

```
QUALITY_CONTRACTS:
| Boundary | Abstract Type | Contract | Construction Check |
|----------|--------------|----------|--------------------|
| {where data enters/leaves} | {abstract type} | {what must be true} | {EXPORT_FUNCTION or EXPORT_TYPE to verify} |
```
