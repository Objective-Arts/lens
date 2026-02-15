# Microservice Rubric

Load when target runs as a containerized or long-running service.

## Review Criteria

1. **Health Checks** — Liveness endpoint (`/healthz` or `/livez`) confirms the process is running. Readiness endpoint (`/readyz`) confirms dependencies (DB, external APIs) are reachable. Both must return quickly (<100ms).
2. **Graceful Shutdown** — Handle SIGTERM. Stop accepting new requests. Drain in-flight requests (configurable timeout). Close DB connections and release resources. Exit cleanly.
3. **Circuit Breakers** — External service calls must degrade gracefully. Open circuit after N failures. Half-open to retry. Fallback behavior when circuit is open. No cascading failures.
4. **Resource Limits** — Connection pool sizes, thread/worker counts, memory limits must be configurable. No unbounded resource consumption. Document default limits.
5. **Observability** — Structured logs with correlation IDs. Metrics endpoint (Prometheus `/metrics` or equivalent). Distributed tracing headers propagated (traceparent, X-Request-ID).

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Health Checks | Liveness and readiness endpoints. Dependency checks in readiness. |
| Graceful Shutdown | Signal handling, request draining, connection cleanup, timeout. |
| Circuit Breakers | Which external calls, failure threshold, fallback behavior. |
| Resource Limits | Pool sizes, worker counts, memory limits. Configurable. |
| Observability | Logging format, metrics endpoint, trace propagation. |

**Template:**
```
- Health Checks: [endpoints, dependency checks]
- Graceful Shutdown: [signal handling, drain timeout]
- Circuit Breakers: [which calls, threshold, fallback or "N/A — no external service calls"]
- Resource Limits: [pool sizes, configurable limits]
- Observability: [logging + metrics + tracing approach]
```
