# Showcase

A production-oriented monorepo for a **company showcase website**: a public marketing site (home, gallery, blog) and a secure admin panel for content management. Built for long-term maintainability, clear boundaries between services, and straightforward deployment on a single VPS.

## What it does

| Area            | Features                                                                |
| --------------- | ----------------------------------------------------------------------- |
| **Public site** | SSR pages (Next.js), SEO metadata, sitemap, responsive white/minimal UI |
| **Blog**        | Markdown posts, draft/publish workflow, sanitized HTML rendering        |
| **Gallery**     | Image grid with captions; files stored in object storage                |
| **Admin**       | JWT login, MDXEditor for posts, image uploads, audit logging            |
| **API**         | REST JSON API (Go/Gin), role-less single-tenant admin model             |

There is **no public sign-up**. Admins are created via environment bootstrap on first deploy.

## Architecture

```
Visitors / Admins
        │
        ▼
   Traefik (prod) ──► www.* / admin.*  →  Next.js (webapp/)
                    └── api.*          →  Go API (service/)
                                              ├── PostgreSQL 18
                                              └── MinIO (S3-compatible)
```

- **[`service/`](service/)** — Go API: Gin, GORM, JWT auth, MinIO uploads, bluemonday markdown sanitization.
- **[`webapp/`](webapp/)** — Next.js App Router: public routes under `(public)/`, admin under `/admin`.
- **Infrastructure** — Docker Compose profiles (`deps`, `dev`, `prod`), GitHub Actions → GHCR.

## Repository layout

```
showcase/
├── service/           # Go REST API
├── webapp/            # Next.js frontend
├── docker-compose.yml # deps | dev | prod profiles
├── .env.example       # Environment template
├── docs/RUNNING.md    # How to run in each environment
├── .vscode/           # Tasks & debug (sources .env)
└── .github/workflows/ # CI + image publish
```

## Prerequisites

- **Docker** & Docker Compose v2
- **Go** 1.24+ (host development)
- **Node.js** 22+ (host development)

Package mirrors (optional, configured in repo):

- Go: `GOPROXY=https://go.iranserver.com/repository/go/`
- npm: `registry=https://npm.iranserver.com/repository/npm/` (see `.npmrc`)

## Quick start

```bash
cp .env.example .env
# Edit secrets (JWT_*, passwords) — see docs/RUNNING.md

make deps-up    # PostgreSQL + MinIO
make api        # terminal 1 → http://localhost:8080
make web        # terminal 2 → http://localhost:3000
```

| URL                               | Purpose       |
| --------------------------------- | ------------- |
| http://localhost:3000             | Public site   |
| http://localhost:3000/admin/login | Admin panel   |
| http://localhost:8080/health      | API liveness  |
| http://localhost:9001             | MinIO console |

Default admin (from `.env`): `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` (only seeded when no admins exist).

## Running in different environments

See **[docs/RUNNING.md](docs/RUNNING.md)** for:

- Host development (infra in Docker, apps on host)
- Full Docker development (`dev` profile)
- Production on a VPS (`prod` profile + Traefik + TLS)
- Environment variables per mode
- VS Code tasks, Makefile, and troubleshooting

## Make targets

| Command                      | Description                      |
| ---------------------------- | -------------------------------- |
| `make deps-up` / `deps-down` | Start/stop Postgres + MinIO only |
| `make dev-up` / `dev-down`   | Full stack in Docker (dev mode)  |
| `make prod-up` / `prod-down` | Production stack + Traefik       |
| `make api` / `make web`      | Run API or Next.js on host       |
| `make tidy`                  | `go mod tidy` in `service/`      |

`make` targets and VS Code tasks source `.env` automatically when the file exists.

## CI/CD

- **CI** — lint, test, and build on pull requests (`ci.yml`).
- **Release** — build and push Docker images to GHCR on `main` / tags (`release.yml`):
  - `ghcr.io/<owner>/showcase-api`
  - `ghcr.io/<owner>/showcase-web`

## Security (summary)

- Short-lived JWT access tokens; refresh token in httpOnly cookie with rotation.
- CSRF protection on cookie-authenticated mutations.
- Strict CORS, rate limiting, upload validation, security headers.
- Markdown treated as untrusted; sanitized server-side before public display.

## License

Private / unlicensed unless otherwise specified by the repository owner.
