# Session Progress - 2026-01-18T17:30:00Z

## Current Task
Created case study documenting ClientController refactoring through claude-optimal lens

## Completed

- **ClientController Refactoring Case Study** (new)
  - Created `docs/case-studies/CLIENT-CONTROLLER-REFACTORING.md`
  - Documents how canon skills (Bloch, Liskov, Kernighan, GoF) were applied
  - Shows `--refactor-clean` flag workflow in practice
  - Includes metrics: 1151→261 lines (main), 6→1 responsibilities per file
  - Documents HIPAA fixes (PHI logging removed)
  - Added case-studies reference to USER-GUIDE.md

- **Previous Session: ClientController Refactoring** (SMR admin-angular project, commit `2236f07172`)
  - Applied `--refactor-clean` to 1151-line monolithic controller
  - Fixed 5 HIPAA violations (PHI in logs)
  - Created 3 utility classes: DateParser, IdParser, ClientMapper
  - Split into 6 focused controllers (Liskov SRP)
  - All builds pass

## Previously Completed
- **MCP Registry System** (commit `27dc590`)
  - Created `cli/src/mcp/` module (types, registry, operations, index)
  - Added 8 CLI commands: `mcp list/show/install/uninstall/enable/disable/check/add`
  - Created initial registry at `~/.claude/mcp-registry/servers/` with 12 server definitions
  - Integrated MCP handling into profile application flow
  - Servers use `${VAR}` references for secrets, never actual keys
  - Profile `mcpServers.enable` triggers install+enable with env var validation

- **Java Profile Expansion** (commit `4a8d90a`)
  - Added kernighan, gang-of-four, liskov to Java canon
  - Added auto-invoke rules for each skill context
  - Ran comparison test showing Bloch+Kernighan produces more principled code reviews

- **Angular Canon Skills** (commits `59d9e13` + `2fba649` in canon-skills)
  - Created 4 new skills in `canon-skills/angular/`:
    - `hevery` - DI, testability, component design
    - `kurata` - Module organization, architecture patterns
    - `minko-gechev` - Performance, lazy loading, OnPush
    - `ben-lesh` - RxJS patterns, streams, operators
  - Updated Angular profile with all 4 skills + auto-invoke rules

## In Progress
- Nothing actively in progress

## Blockers / Open Questions
- User mentioned a "gwt-skill" that needs improvement but it wasn't found in canon-skills repo
- May need to create GWT/J2CL modernization skill if user wants

## Next Steps
1. Clarify GWT skill location or create if needed
2. Consider adding `dijkstra` to a `java-critical` profile for safety-critical systems
3. Commit diagram.html and docs/PATTERNS.md changes if relevant

## Key Files Modified

### cli/src/mcp/ (new module)
- `types.ts` - MCPServerDefinition, registry types
- `registry.ts` - Load/save registry, env var validation
- `operations.ts` - Install/uninstall/enable/disable operations
- `index.ts` - Module exports

### Profile Files Updated
- `profiles/java.yaml` - Added kernighan, gang-of-four, liskov + auto-invoke
- `profiles/angular.yaml` - Added hevery, kurata, minko-gechev, ben-lesh + auto-invoke

### Registry Files Created
- `~/.claude/mcp-registry/servers/*.yaml` - 12 server definitions:
  - sequential-thinking, playwright, chrome-devtools, git
  - linear, linear-http, obsidian, perplexity
  - context7, gmail, excalidraw, claude-historian

### Canon Skills Created (in canon-skills repo)
- `angular/hevery/SKILL.md` - DI, testability
- `angular/kurata/SKILL.md` - Module organization
- `angular/minko-gechev/SKILL.md` - Performance
- `angular/ben-lesh/SKILL.md` - RxJS patterns

## Context to Restore
- **MCP registry uses directory-based approach** - no central index file, `servers/*.yaml` IS the index
- **Profile mcpServers.enable flow**: Check registry → validate env vars → install to mcp.json → enable in settings.json
- **Servers with missing required env vars** are skipped gracefully with helpful message
- **Java comparison test** showed skills produce more principled, structured reviews (organized by principle violated)
- **Angular skills** follow same pattern as other canon skills (frontmatter + principles + test + sources)
- **cc-config still installed globally** - run `cc-config mcp list` to see registry

## Commits This Session
```
59d9e13 Update Angular profile with expanded canon skills
4a8d90a Expand Java profile with kernighan, gang-of-four, and liskov skills
27dc590 Add MCP registry system for variable server installation
```

## Pending Uncommitted Changes
- `diagram.html` - May have updates from previous session
- `docs/PATTERNS.md` - May have updates from previous session
