# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conventions

Use Mermaid diagrams (` ```mermaid `) for all visual diagrams in README.md files — flow charts, sequence diagrams, architecture overviews. Do not use ASCII art alternatives.

## Commands

All commands run from the repo root unless noted.

```bash
# Install dependencies (required after cloning or adding packages)
pnpm install

# Run all apps in dev mode (Turborepo parallel)
pnpm dev

# Build all workspaces
pnpm build

# Type-check all workspaces
pnpm type-check

# Lint all workspaces
pnpm lint

# Run all unit tests
pnpm test

# Local Postgres (required for api dev/e2e)
pnpm db:up     # start
pnpm db:down   # stop
```

### API-specific (`apps/api`)

```bash
# Run a single test file
cd apps/api && pnpm test -- --testPathPattern=auth.service

# Watch mode
cd apps/api && pnpm test:watch

# E2e tests (requires db:up and .env set)
cd apps/api && pnpm test:e2e

# Type-check api only
cd apps/api && pnpm type-check
```

### shared-types

```bash
# Rebuild after editing packages/shared-types/src/
cd packages/shared-types && pnpm build
```

## Architecture

### Monorepo layout

```
ally-demo/
├── apps/api/           # NestJS backend — Lambda entry point + local dev server
├── packages/
│   ├── shared-types/   # Zod schemas + inferred TS types shared by api and future frontends
│   ├── tsconfig/       # Base tsconfig presets (base, nest, next, react-library)
│   └── eslint-config/  # Flat ESLint configs (base, nest, next variants)
├── workflows/
│   └── step-functions/ # ASL state machine definitions (loan-origination, kyc-verification)
└── docs/               # Architecture, security, and deployment references
```

Turborepo orchestrates builds; `build` tasks respect `^build` dependency ordering so `shared-types` always builds before `api`.

### NestJS API (`apps/api`)

**Two entry points:**
- `src/main.ts` — local dev server on port 3001, mounts Swagger at `/api/docs`
- `src/handler.ts` — Lambda adapter via `@vendia/serverless-express`, caches the NestJS app instance across warm invocations

**Domain modules** (each owns its entity, DTOs, service, controller):

| Module | Entity/table | Key behaviour |
|---|---|---|
| `auth` | — (uses `users`) | JWT access (15 min) + refresh (7 d) via `passport-jwt` + `passport-local`; Lambda authorizer pattern |
| `users` | `users` | bcrypt password hashing at cost 12; `passwordHash` stripped from all responses |
| `accounts` | `accounts`, `transactions` | Transfers run inside a TypeORM `DataSource.transaction()`; balance updated on both sides atomically |
| `payments` | `payments` | ACH/wire/internal; `scheduled` vs `processing` status set at create time |
| `loans` | `loan_applications` | `submit()` transitions `draft → submitted`, then fires `StartExecutionCommand` to Step Functions if `STEP_FUNCTIONS_LOAN_ARN` is set |
| `admin` | cross-module reads | RBAC-gated (`admin`/`support` roles); account numbers masked to last 4 digits |

**Auth flow:** `LocalStrategy` (email+password) validates on `POST /auth/login` → `AuthService.login()` returns both tokens. All other routes require `JwtAuthGuard`. Role enforcement via `RolesGuard` + `@Roles()` decorator checked against the `role` claim in the JWT.

**TypeORM config:** `synchronize: true` in non-production (schema auto-migrates on startup). SSL enforced in production. `autoLoadEntities: true` — entities register themselves via `TypeOrmModule.forFeature()` in each domain module.

### Shared types (`packages/shared-types`)

Single source of truth for all DTOs. Every domain exports Zod schemas + `z.infer<>` TypeScript types. The api imports types directly from source (`workspace:*`) via tsconfig path alias; the built `dist/` targets future frontend packages.

### Step Functions workflows (`workflows/step-functions/`)

ASL files use `${FunctionArn}` placeholders — Terraform's `templatefile()` substitutes real ARNs at deploy time. Both state machines use `waitForTaskToken` for human/async steps; the NestJS Lambda stores the token and later calls `SendTaskSuccessCommand` / `SendTaskFailureCommand` to resume execution. See `workflows/step-functions/README.md` for full flow diagrams.

### TypeScript config inheritance

```
packages/tsconfig/base.json          ← strict, bundler moduleResolution
  └── packages/tsconfig/nest.json    ← adds decorators, CommonJS, disables strictPropertyInitialization
        └── apps/api/tsconfig.json   ← extends nest.json, adds path alias for @ally/shared-types
  └── packages/tsconfig/next.json    ← adds jsx:preserve, dom libs
  └── packages/tsconfig/react-library.json ← adds jsx:react-jsx
```

`strictPropertyInitialization: false` and `exactOptionalPropertyTypes: false` are intentionally relaxed in `nest.json` — TypeORM entities and `DeepPartial<>` are incompatible with those two flags.

### Environment variables (`apps/api/.env.example`)

| Variable | Required locally | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://ally:ally_local@localhost:5432/ally_db` matches docker-compose |
| `JWT_SECRET` | Yes | Access token signing key |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key (separate secret) |
| `NODE_ENV` | No | `development` enables TypeORM query logging and disables SSL |
| `STEP_FUNCTIONS_LOAN_ARN` | No | If unset, loan `submit()` skips Step Functions (safe for local dev) |
| `AWS_REGION` | No | Defaults to `us-east-1` |

Copy `.env.example` to `.env` in `apps/api/` before running locally.

### pnpm workspace notes

New build script dependencies (packages that run `postinstall`) must be added to both `onlyBuiltDependencies` and `allowBuilds` in `pnpm-workspace.yaml`, or `pnpm install` will fail with `ERR_PNPM_IGNORED_BUILDS`. A Claude Code hook enforces this — set the value to `true` when prompted.
