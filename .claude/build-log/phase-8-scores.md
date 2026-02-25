SCORE_SECURITY: 6
SCORE_STRUCTURE: 6
SCORE_ERROR_HANDLING: 6
SCORE_NAMING: 5
SCORE_COMPLEXITY: 6
SCORE_TYPE_SAFETY: 6
SCORE_TESTABILITY: 5
SCORE_TOTAL: 40

SECURITY: 6/10 — Path inputs for MCP flows are used directly and profile hooks are written without validation, leaving trust-boundary assumptions implicit. Top 3 weakest files: mcp/operations.ts:22, cli/commands/mcp.ts:22, profiles/apply-config.ts:30
STRUCTURE: 6/10 — Several modules mix IO, business logic, and presentation concerns, which blurs boundaries and makes reuse harder. Top 3 weakest files: hooks/index.ts:28, profiles/apply-config.ts:30, cli/commands/init.ts:98
ERROR_HANDLING: 6/10 — There are multiple log-and-continue or swallow patterns that hide causes and reduce observability. Top 3 weakest files: output/json-adapter.ts:234, cli/commands/init.ts:197, profiles/loader.ts:146
NAMING: 5/10 — Generic names like `items`, `results`, and `content` dominate core flows and obscure intent. Top 3 weakest files: scanner/analysis.ts:7, profiles/apply.ts:123, output/json-adapter.ts:133
COMPLEXITY: 6/10 — Long, branching functions combine multiple responsibilities and side effects, raising cognitive load. Top 3 weakest files: hooks/index.ts:101, cli/commands/init.ts:127, profiles/apply.ts:186
TYPE_SAFETY: 6/10 — Frequent `unknown` parsing with shallow validation and casting leaves room for runtime shape mismatches. Top 3 weakest files: profiles/apply-config.ts:36, hooks/index.ts:22, output/json-adapter.ts:83
TESTABILITY: 5/10 — Heavy reliance on filesystem, OS, and process globals makes unit testing costly without seams. Top 3 weakest files: hooks/index.ts:18, mcp/operations.ts:22, cli/commands/init.ts:26

TOTAL: 40/70
