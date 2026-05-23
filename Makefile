.PHONY: deps-up deps-down dev-up dev-down prod-up prod-down logs-deps api web tidy

export GOPROXY ?= https://go.iranserver.com/repository/go/
export GOSUMDB ?= off
export GO111MODULE ?= on

SHELL := /bin/bash

# Source .env when present (same pattern as VS Code tasks)
WITH_ENV = set -a && [ -f .env ] && source .env; set +a &&

tidy:
	cd service && go mod tidy

deps-up:
	$(WITH_ENV) docker compose --profile deps up -d

deps-down:
	$(WITH_ENV) docker compose --profile deps down

dev-up:
	$(WITH_ENV) docker compose --profile dev up -d --build

dev-down:
	$(WITH_ENV) docker compose --profile dev down

prod-up:
	$(WITH_ENV) docker compose --profile prod up -d --build

prod-down:
	$(WITH_ENV) docker compose --profile prod down

logs-deps:
	$(WITH_ENV) docker compose --profile deps logs -f

api:
	$(WITH_ENV) cd service && go run ./cmd/api

web:
	$(WITH_ENV) cd webapp && npm run dev
