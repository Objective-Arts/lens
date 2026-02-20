# Rubric Auto-Detection

Load `base.md`, `product-quality.md`, and `security.md` **always**. Then check the target for domain signals and load matching files.

| Signal | Check | Load |
|--------|-------|------|
| TypeScript | `.ts`/`.tsx` files, `tsconfig.json`, type annotations, interfaces, generics | `typescript.md` |
| D3 | `d3-selection`, `d3-scale`, `d3-shape`, `d3-transition`, `d3.select`, `d3.scaleLinear`, `<svg>` bindings | `d3.md` |
| Angular | `@angular/core`, `@Component`, `@Injectable`, `NgModule`, `angular.json`, `.component.ts`, `.service.ts` | `angular.md` |
| Java | `.java` files, `pom.xml`, `build.gradle`, `@SpringBootApplication`, `@RestController`, `javax.`/`jakarta.` imports | `java.md` |
| HTTP server | Express, Fastify, Koa, Hono, `http.createServer`, `app.listen`, `router.get`, ASP.NET, Flask, Django | `web-api.md` |
| Data persistence | SQL imports, ORM (Prisma, TypeORM, Sequelize, EF, JPA, Hibernate), `fs.writeFile` on user data, SQLite, Redis, MongoDB | `data-persistence.md` |
| CLI tool | `process.argv`, `commander`, `yargs`, `cac`, `argparse`, `click`, `System.CommandLine` | `cli.md` |
| Microservice | Dockerfile, `docker-compose`, Kubernetes manifests, health endpoint, `SIGTERM` handler, `/healthz` | `microservice.md` |
| Migration | Mixed framework imports, TODO/FIXME with migration keywords, shim/adapter/bridge files, dual old+new configs, GWT+Angular coexistence, jQuery+React coexistence | `migration.md` |

**Multiple domains can match.** A CLI tool that persists data loads both `cli.md` and `data-persistence.md`.

**If no domain signals match**, load only `base.md` + `product-quality.md` — the base rubric covers general production readiness.
