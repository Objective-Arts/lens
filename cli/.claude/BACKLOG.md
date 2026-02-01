# Ralph Backlog

## Performance Optimization Phase

**Priority:** Medium (after review/static-analysis stabilized)

### Concept
Post-implementation phase that profiles code and applies performance masters.

### New Canon Masters to Add
| Master | Domain | Key Patterns |
|--------|--------|--------------|
| Steve Souders | Web perf | 14 rules (CDN, minify, expires headers, async scripts) |
| Ilya Grigorik | Networking | HPBN patterns (connection reuse, compression, HTTP/2) |
| Jake Archibald | Browser perf | Streaming, service workers, render blocking |
| Brendan Gregg | Systems perf | Flame graphs, USE method, profiling |

### Proposed Flow
1. **PROFILE** - Run measurements (lighthouse, bundlesize, runtime profiling)
2. **IDENTIFY** - Find hot paths, bottlenecks
3. **APPLY MASTERS** - Invoke relevant experts:
   - Network-bound → /grigorik
   - Render-bound → /archibald
   - Algorithm-bound → /carmack, /knuth
   - Bundle-bound → /souders
4. **VERIFY** - Re-measure to confirm improvement

### Implementation Options
- A. Standalone `/perf-check` skill
- B. Optional Ralph phase (`--perf` flag)
- C. Both

---

## Blocked By
- [ ] Stabilize adversarial-review (split identify/fix done, needs testing)
- [ ] Stabilize static-analysis (may need same split treatment)
