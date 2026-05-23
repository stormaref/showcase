.PHONY: deps-up deps-down dev-up dev-down prod-up prod-down logs-deps api web tidy

export GOPROXY ?= https://go.iranserver.com/repository/go/
export GOSUMDB ?= off
export GO111MODULE ?= on

tidy:
	cd service && go mod tidy

deps-up:
	docker compose --profile deps up -d

deps-down:
	docker compose --profile deps down

dev-up:
	docker compose --profile dev up -d --build

dev-down:
	docker compose --profile dev down

prod-up:
	docker compose --profile prod up -d --build

prod-down:
	docker compose --profile prod down

logs-deps:
	docker compose --profile deps logs -f

api:
	cd service && go run ./cmd/api

web:
	cd webapp && npm run dev
