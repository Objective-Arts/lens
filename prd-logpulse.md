# PRD: logpulse

A CLI tool that parses structured log files, filters by criteria, and outputs aggregate stats.

## Context

Teams dump JSON-line logs (one JSON object per line) from services into files. To answer "how many 5xx errors hit `/api/users` in the last hour?" they reach for `grep | jq | wc -l` chains that break on edge cases. `logpulse` replaces that with a single command.

## Input Format

JSON-lines (`.jsonl`). Each line is a JSON object with at minimum:

```json
{"timestamp": "2026-02-15T10:30:00Z", "level": "error", "message": "connection refused", "status": 503, "path": "/api/users"}
```

Fields beyond `timestamp`, `level`, and `message` are optional and vary per service.

## Tech Stack

- TypeScript, Node.js (ESM)
- No runtime dependencies beyond `commander` for CLI arg parsing
- Vitest for tests

## Items

- [ ] Define core types in `src/types.ts`: `LogEntry` (parsed line), `FilterCriteria` (level, time range, field match), `AggregateResult` (count, breakdown by level, top paths, error rate), `ParseError` (line number, raw content, reason)
- [ ] Implement `parseLine(raw: string, lineNumber: number): LogEntry | ParseError` in `src/parser.ts` — validate JSON, validate `timestamp` is ISO-8601, normalize `level` to lowercase enum, preserve extra fields as `Record<string, unknown>`
- [ ] Implement `parseFile(stream: ReadableStream, onEntry, onError)` in `src/reader.ts` — stream line-by-line (not load entire file), handle blank lines and trailing newlines, call back per parsed entry, count and report parse errors without stopping
- [ ] Implement `matchesFilter(entry: LogEntry, criteria: FilterCriteria): boolean` in `src/filter.ts` — support level match (single or array), time range (since/until as ISO-8601 or relative like "1h", "30m"), field equality (`--where status=503`), field substring (`--where message~timeout`)
- [ ] Implement `aggregate(entries: LogEntry[]): AggregateResult` in `src/aggregate.ts` — total count, count by level, top 10 paths by frequency, error rate (error+fatal / total), p50/p95/p99 of time gaps between consecutive entries
- [ ] Wire CLI in `src/cli.ts` using commander — `logpulse <file> [--level error] [--since 1h] [--until now] [--where field=value] [--json]`, validate file exists and is readable before processing, exit 1 on bad args with usage hint
- [ ] Implement output formatting in `src/output.ts` — default: human-readable table to stdout, `--json` flag: structured JSON to stdout, errors and diagnostics always to stderr
- [ ] Write tests covering: parser (valid lines, malformed JSON, missing fields, extra fields), filter (each criterion type, combined criteria, edge cases with timezone offsets), aggregate (empty input, single entry, large set), CLI arg validation (missing file, bad flags) — minimum 20 test cases across files
