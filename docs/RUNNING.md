# Running Showcase in Different Environments

This guide explains how to run the project locally, in Docker, and in production. All modes share the same **`.env`** file at the repository root; Compose and application processes read variables from it.

## Before you start

### 1. Create `.env`

```bash
cp .env.example .env
```

Generate strong JWT secrets:

```bash
bash scripts/gen-secrets.sh >> .env
# Remove duplicate JWT_* lines from .env if you pasted over placeholders
```

Edit at minimum:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥ 32 characters)
- `BOOTSTRAP_ADMIN_PASSWORD`
- `POSTGRES_PASSWORD` / `MINIO_ROOT_PASSWORD` for non-local deploys

### 2. Load environment variables

Shell (bash/zsh):

```bash
set -a
source .env
set +a
```

**VS Code tasks** do this automatically (`set -a && source .env; set +a`) before each command.

**Makefile** sources `.env` automatically for all targets when the file exists (same `set -a` / `source` pattern as VS Code tasks).

### 3. Package mirrors (optional)

```bash
# Go (also in scripts/env-go.sh and Makefile)
export GOPROXY=https://go.iranserver.com/repository/go/
export GOSUMDB=off
export GO111MODULE=on

# npm — configured in .npmrc (root + webapp/)
```

---

## Mode 1: Host development (recommended)

Best for day-to-day API and frontend work with fast reload. **Only infrastructure runs in Docker**; Go and Node run on your machine.

### Services

| Component | Where it runs | Port |
|-----------|---------------|------|
| PostgreSQL 18 | Docker (`deps`) | 5432 |
| MinIO | Docker (`deps`) | 9000 (API), 9001 (console) |
| Go API | Host | 8080 |
| Next.js | Host | 3000 |

### Required `.env` values (host)

Use **localhost** hostnames so the host processes can reach Docker-published ports:

```bash
DATABASE_URL=postgres://showcase:showcase_dev_password@localhost:5432/showcase?sslmode=disable
MINIO_ENDPOINT=localhost:9000
MEDIA_PUBLIC_BASE_URL=http://localhost:9000/showcase-media
NEXT_PUBLIC_API_URL=http://localhost:8080
INTERNAL_API_URL=http://localhost:8080
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
COOKIE_DOMAIN=localhost
APP_ENV=development
```

### Steps

```bash
set -a && source .env && set +a

make deps-up          # or: docker compose --profile deps up -d
make api              # terminal 1
make web              # terminal 2
```

**VS Code:** `Tasks: Run Task` → `Showcase: Dependencies Up`, then `Showcase: Run API (host)` and `Showcase: Run Web (host)`.

**Debug API:** Run configuration `Debug API` (uses `.env` via `envFile` + starts deps first).

### Verify

```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
```

### Stop

```bash
make deps-down
# Ctrl+C on api / web terminals
```

---

## Mode 2: Full Docker development (`dev` profile)

Runs API and Next.js **inside Docker** with hot reload (Next `dev` target). Good when you do not want local Go/Node toolchains.

### Services

All of Mode 1, plus:

| Component | Image / build | Port |
|-----------|---------------|------|
| `api` | `service/Dockerfile` | 8080 |
| `web` | `webapp/Dockerfile` target `dev` | 3000 |

### `.env` adjustments

Compose overrides DB/MinIO hostnames for containers. Ensure:

```bash
WEB_DOCKER_TARGET=dev
NEXT_PUBLIC_API_URL=http://localhost:8080
# INTERNAL_API_URL is set in compose to http://api:8080 for the web container
```

You can keep `DATABASE_URL` pointing at `localhost` for host tools; the `api` service uses the compose `DATABASE_URL` with host `postgres`.

### Steps

```bash
set -a && source .env && set +a

make dev-up           # docker compose --profile dev up -d --build
docker compose --profile dev logs -f api web   # optional
```

Open the same URLs as Mode 1.

### Stop

```bash
make dev-down
```

---

## Mode 3: Dependencies only (`deps` profile)

PostgreSQL + MinIO + bucket init (`minio-init`). Used alone for **Mode 1** or when you only need a database/object store.

```bash
set -a && source .env && set +a
make deps-up
make logs-deps    # follow logs
```

**Data persistence:** volumes `postgres_data`, `minio_data`.

**PostgreSQL 18 note:** data is stored under `/var/lib/postgresql` in the container (PG18 layout).

---

## Mode 4: Production on a VPS (`prod` profile)

Single-server deployment with **Traefik** for TLS and subdomain routing.

### DNS (example)

| Host | Points to |
|------|-----------|
| `www.example.com` | VPS IP |
| `admin.example.com` | VPS IP |
| `api.example.com` | VPS IP |

### `.env` for production

```bash
APP_ENV=production
DOMAIN=example.com
ACME_EMAIL=you@example.com

WEB_DOCKER_TARGET=runner

# Public URLs (HTTPS)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
MEDIA_PUBLIC_BASE_URL=https://media.example.com   # or MinIO/Traefik path
CORS_ORIGINS=https://www.example.com,https://admin.example.com
COOKIE_DOMAIN=example.com

# Strong secrets — never commit .env
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
POSTGRES_PASSWORD=...
MINIO_ROOT_PASSWORD=...

# Disable bootstrap after first admin exists, or set once then remove
BOOTSTRAP_ADMIN_EMAIL=admin@yourcompany.com
BOOTSTRAP_ADMIN_PASSWORD=...
```

Traefik routes (from `docker-compose.yml` labels):

- `www.${DOMAIN}` → Next.js
- `admin.${DOMAIN}` → Next.js (same container)
- `api.${DOMAIN}` → Go API

### Deploy with pre-built images (GHCR)

After CI publishes images:

```bash
# On VPS — set image tags in .env or compose override, then:
docker compose --profile prod pull
set -a && source .env && set +a
make prod-up
```

### Deploy with local build on VPS

```bash
set -a && source .env && set +a
WEB_DOCKER_TARGET=runner make prod-up
```

### Post-deploy checks

```bash
curl -s https://api.example.com/health
curl -s https://api.example.com/ready
```

Log in at `https://admin.example.com/admin/login`.

### Stop

```bash
make prod-down
```

---

## Environment variable reference

| Variable | Used by | Notes |
|----------|---------|--------|
| `DATABASE_URL` | API | `localhost` on host dev; `postgres:5432` in compose for `api` service |
| `MINIO_*` | API | `localhost:9000` on host; `minio:9000` in compose |
| `JWT_*` | API | Required; min 32 chars |
| `CORS_ORIGINS` | API | Comma-separated; must include web origin(s) |
| `COOKIE_DOMAIN` | API | `localhost` locally; apex domain in prod |
| `BOOTSTRAP_ADMIN_*` | API | First-run only if no admins in DB |
| `NEXT_PUBLIC_API_URL` | Web (browser) | Must be reachable from the user's browser |
| `INTERNAL_API_URL` | Web (SSR) | Docker: `http://api:8080`; host: `http://localhost:8080` |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | Web | Public URL prefix for MinIO objects |
| `DOMAIN` | Compose / Traefik | Production hostname apex |
| `ACME_EMAIL` | Traefik | Let's Encrypt registration |
| `WEB_DOCKER_TARGET` | Compose | `dev` or `runner` (production Next standalone) |

See [`.env.example`](../.env.example) for the full template.

---

## Compose profiles summary

| Profile | Command | What starts |
|---------|---------|-------------|
| `deps` | `docker compose --profile deps up -d` | postgres, minio, minio-init |
| `dev` | `docker compose --profile dev up -d --build` | deps + api + web (dev) |
| `prod` | `docker compose --profile prod up -d --build` | deps + api + web (runner) + traefik |

---

## Troubleshooting

### API exits: `JWT secrets must be at least 32 characters`

Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env` (use `scripts/gen-secrets.sh`).

### API exits: `DATABASE_URL is required`

Source `.env` before starting the API, or use VS Code tasks.

### `ready` returns 503

- Postgres not up: `docker compose --profile deps ps`
- MinIO not ready: wait for healthcheck; check `docker compose logs minio`
- Wrong `MINIO_ENDPOINT` (host vs Docker hostname)

### Admin login works locally but refresh fails

- Ensure `CORS_ORIGINS` includes your web origin
- `COOKIE_DOMAIN` must match how you access admin (e.g. `localhost`, not `127.0.0.1` if cookie set for `localhost`)
- CSRF: admin client must send `X-CSRF-Token` header matching `showcase_csrf` cookie

### Next.js cannot reach API during SSR

- Host dev: `INTERNAL_API_URL=http://localhost:8080`
- Docker dev: compose sets `INTERNAL_API_URL=http://api:8080` on `web` service

### Port already in use

Change host ports in `docker-compose.yml` or stop conflicting services.

---

## Related docs

- [README.md](../README.md) — project overview
- [`.env.example`](../.env.example) — variable template
- [`.vscode/tasks.json`](../.vscode/tasks.json) — IDE automation with `.env` sourcing
