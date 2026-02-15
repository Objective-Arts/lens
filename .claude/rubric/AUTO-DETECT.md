# Rubric Auto-Detection

Load `base.md` and `product-quality.md` **always**. Then check the target for domain signals and load matching files.

| Signal | Check | Load |
|--------|-------|------|
| HTTP server | Express, Fastify, Koa, Hono, `http.createServer`, `app.listen`, `router.get`, ASP.NET, Flask, Django | `web-api.md` |
| Data persistence | SQL imports, ORM (Prisma, TypeORM, Sequelize, EF), `fs.writeFile` on user data, SQLite, Redis, MongoDB | `data-persistence.md` |
| CLI tool | `process.argv`, `commander`, `yargs`, `cac`, `argparse`, `click`, `System.CommandLine` | `cli.md` |
| Microservice | Dockerfile, `docker-compose`, Kubernetes manifests, health endpoint, `SIGTERM` handler, `/healthz` | `microservice.md` |

**Multiple domains can match.** A CLI tool that persists data loads both `cli.md` and `data-persistence.md`.

**If no domain signals match**, load only `base.md` + `product-quality.md` — the base rubric covers general production readiness.
