#!/usr/bin/env bash
# Insert an admin: hash the password with bcrypt and store in PostgreSQL.
# Requires DATABASE_URL (from repo .env or environment).
#
# Usage:
#   ./scripts/create-admin.sh --email admin@example.com --password 'secret-pass'
#   ./scripts/create-admin.sh admin@example.com 'secret-pass'
#   CREATE_ADMIN_PASSWORD='secret-pass' ./scripts/create-admin.sh --email admin@example.com
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

if [[ -f "$ROOT/scripts/env-go.sh" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT/scripts/env-go.sh"
fi

cd "$ROOT/service"
exec go run ./cmd/create-admin "$@"
