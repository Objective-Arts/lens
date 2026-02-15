# Product Quality Rubric

Always loaded. Catches bad products built with good code.

## Review Criteria

1. **Sensible Defaults** — Every configurable value (paths, ports, URLs, timeouts) must have a stable default that works without setup. No randomized paths, no timestamped filenames. Zero-config must produce a useful result.
2. **Interactive Fallbacks** — Every required input (passwords, tokens, keys) must resolve: flag → env var → interactive prompt (when TTY). Non-TTY must fail with a clear message naming the flag and env var.
3. **No Orphaned Features** — Every data model field and internal capability must be reachable from the user interface. If a type has a field no command exposes, remove the field or add the command.
4. **Error UX (User Perspective)** — Every user-triggerable error must say what went wrong and what to do. Stack traces are security leaks in production. Non-zero exit codes for monitoring.
5. **Competitor Parity** — If the tool has a clear category, match basic UX expectations. Password managers prompt for passwords. Config tools have `init`. Web servers have `--port`.
6. **Secrets Handling** — Secrets (API keys, passwords, tokens) must NEVER be accepted as positional CLI arguments — they leak to shell history and process lists. Accept via `--value-file`, stdin, env var, or interactive prompt.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Sensible Defaults | Default values for all configurable items. Must be stable across runs. |
| Interactive Fallbacks | Three-tier resolution for every required input: flag → env var → prompt. |
| Orphaned Features | Every field/capability reachable from UI. Remove or expose. |
| Error UX | Actionable messages for every user-triggerable error. |
| Competitor Parity | Match category UX expectations. |
| Secrets Handling | Never as positional args. File/stdin/env/prompt only. |

**Template:**
```
- Sensible Defaults: [default config path, default port, etc.]
- Interactive Fallbacks: [input] → [flag] / [ENV_VAR] / [prompt]
- Orphaned Features: [all fields reachable or "N/A — no user-facing data model"]
- Secrets Handling: [approach or "N/A — no secrets"]
```
