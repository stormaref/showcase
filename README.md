# Showcase

Production-grade company showcase monorepo: Go (Gin/GORM) API, Next.js public site + admin panel, PostgreSQL 18, MinIO, Docker Compose, Traefik, GitHub Actions → GHCR.

## Structure

| Path | Description |
|------|-------------|
| [`service/`](service/) | Go REST API |
| [`webapp/`](webapp/) | Next.js App Router (public SSR + `/admin`) |

## Prerequisites

- Docker & Docker Compose
- Go 1.24+
- Node.js 22+

### Package mirrors (recommended)

```bash
# Go
export GOPROXY=https://go.iranserver.com/repository/go/
export GOSUMDB=off
export GO111MODULE=on

# npm — .npmrc at repo root and in webapp/
# registry=https://npm.iranserver.com/repository/npm/
```

## Quick start (local)

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start infrastructure (PostgreSQL 18 + MinIO):

```bash
make deps-up
# or: docker compose --profile deps up -d
```

3. Run API and web on the host:

```bash
make api    # terminal 1 — service on :8080
make web    # terminal 2 — Next.js on :3000
```

Or use **VS Code**: `Tasks: Run Task` → `Showcase: Dependencies Up`, then `Showcase: Run API (host)` / `Showcase: Run Web (host)`.

4. Open:

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- API health: http://localhost:8080/health
- MinIO console: http://localhost:9001

Default bootstrap admin (from `.env`): `admin@example.com` / value of `BOOTSTRAP_ADMIN_PASSWORD`.

## Docker profiles

| Profile | Command | Services |
|---------|---------|----------|
| `deps` | `docker compose --profile deps up -d` | Postgres, MinIO |
| `dev` | `docker compose --profile dev up -d --build` | deps + API + Next dev |
| `prod` | `docker compose --profile prod up -d --build` | deps + API + Next + Traefik |

Production: set `DOMAIN`, `ACME_EMAIL`, `WEB_DOCKER_TARGET=runner`, and pull images from GHCR.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): `go test`, `go build`, `npm lint`, `npm build`
- **Release** (`.github/workflows/release.yml`): push `ghcr.io/<owner>/showcase-api` and `showcase-web`

## Security notes

- JWT access tokens (15m) in memory; refresh token in httpOnly cookie
- CSRF on cookie-auth routes (`/auth/refresh`, `/auth/logout`, admin mutations)
- Markdown sanitized server-side (bluemonday) before public HTML
- No public registration — admins seeded via env
