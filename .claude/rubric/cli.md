# CLI Rubric

Load when target is a command-line tool.

## Review Criteria

1. **Exit Codes** — Zero on success, non-zero on failure. Distinct codes for distinct failure modes where useful (e.g., 1 = general error, 2 = usage error, 126 = permission). Never exit 0 on error.
2. **Signal Handling** — Handle SIGINT (Ctrl+C) and SIGTERM gracefully. Clean up temp files, release locks, flush output. No orphaned resources on interrupt.
3. **stdin/stdout Discipline** — Output data to stdout, diagnostics to stderr. Support piping (`command | other`). No interactive prompts when stdin is not a TTY — fail with a clear message naming the flag and env var.
4. **Secrets in Arguments** — Secrets (API keys, passwords, tokens) must NEVER be accepted as positional CLI arguments. Accept via `--value-file <path>`, stdin pipe, env var, or interactive prompt. If `--password` flag exists, document the risk.
5. **Help and Usage** — `--help` must document all flags, env vars, and subcommands. Usage examples for common operations. Version flag (`--version`).

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Exit Codes | Code mapping for each failure mode. |
| Signal Handling | Which signals handled, cleanup actions. |
| stdin/stdout | Data vs diagnostic separation. Pipe support. Non-TTY behavior. |
| Secrets in Arguments | How each secret input is accepted. |
| Help/Usage | Flag documentation, examples, version. |

**Template:**
```
- Exit Codes: [mapping or "0/1 — success/failure"]
- Signal Handling: [SIGINT + SIGTERM cleanup approach]
- stdin/stdout: [pipe support, non-TTY behavior]
- Secrets: [acceptance method per secret or "N/A — no secrets"]
- Help/Usage: [commander/yargs auto-help or manual]
```
