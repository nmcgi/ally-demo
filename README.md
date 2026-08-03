# Ally Demo

A production-grade reference architecture for a digital banking platform. Built with a serverless NestJS API, Next.js micro-frontends via Module Federation, and AWS Step Functions for loan origination workflows.

## Architecture at a glance

```mermaid
graph TD
    Host["web-host :3000\n(Next.js shell)"]
    Accounts["web-accounts :3004\n(MFE remote)"]
    Loans["web-loans :3002\n(MFE remote)"]
    Admin["web-admin :3003\n(MFE remote)"]
    API["api :3001\n(NestJS / Lambda)"]
    DB[(PostgreSQL)]
    SF[AWS Step Functions]

    Host -->|Module Federation| Accounts
    Host -->|Module Federation| Loans
    Host -->|Module Federation| Admin
    Accounts --> API
    Loans --> API
    Admin --> API
    API --> DB
    API -->|loan submit| SF
```

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm install -g pnpm`
- **Docker** — for the local Postgres instance

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the database

```bash
pnpm db:up
```

This starts a Postgres 16 container on port 5432 (credentials match the default `.env`).

### 3. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

The defaults work as-is for local development. The schema is created automatically on first run (`synchronize: true`).

### 4. Run everything

```bash
pnpm dev
```

Turborepo starts all apps in parallel:

| App | URL | Description |
|-----|-----|-------------|
| Host shell | http://localhost:3000 | Main entry point — login here |
| API | http://localhost:3001 | NestJS REST API |
| API docs | http://localhost:3001/api/docs | Swagger UI |
| Accounts MFE | http://localhost:3004 | Accounts remote (standalone) |
| Loans MFE | http://localhost:3002 | Loans remote (standalone) |
| Admin MFE | http://localhost:3003 | Admin remote (standalone) |

The API owns port 3001 (every frontend calls it there by default); the Accounts
remote runs on 3004 to avoid the collision.

Module Federation is opt-in (`ENABLE_MODULE_FEDERATION=true`) and **cannot run
against the App Router** — `@module-federation/nextjs-mf` throws
`App Directory is not supported by nextjs-mf` at startup. So by default the host
compiles each remote's exposed component directly from its workspace source
(see `REMOTE_MODULES` in `apps/web-host/next.config.js`). Everything renders at
http://localhost:3000 on a single origin, which also means the auth token in
`localStorage` is shared. The standalone remote apps still run on their own
ports, but opening them directly gives you no token — expect 401s there.

### 5. Create a user

Register at http://localhost:3000/register, or via the API:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ally.com","password":"Password123!","firstName":"Demo","lastName":"User"}'
```

### 6. Seed accounts

Registration creates the user row only — a new user has no accounts, so the
dashboard is empty until you seed:

```bash
pnpm db:seed
```

This creates one starter login per role — all with the password
**`AllyFinancial123!`**:

| Email | Role | Use it for |
|-------|------|-----------|
| `admin@ally.com` | `admin` | Admin portal, incl. loan approve/reject |
| `support@ally.com` | `support` | Admin portal in read-only mode |
| `demo@ally.com` | `customer` | Accounts, transfers, loan applications |

The seed is idempotent, so re-run it whenever you add a user. It:

- creates the three starter users above, resetting their password and role if
  they already exist (so a half-configured login is recoverable)
- gives **every** user without accounts — starter or self-registered — a
  checking + savings pair with balances
- adds sample transactions to each new checking account, ending at its balance

Users you register yourself are always `customer`, and the seed never changes
their password. To elevate one, update the role in Postgres, then log in again
for a fresh token:

```bash
docker exec ally-demo-db psql -U ally -d ally_db \
  -c "UPDATE users SET role='admin' WHERE email='you@example.com';"
```

## Common commands

```bash
# Run all tests
pnpm test

# Type-check all workspaces
pnpm type-check

# Lint all workspaces
pnpm lint

# Stop the database
pnpm db:down
```

## Running apps individually

```bash
# API only
cd apps/api && pnpm dev

# Host shell only
cd apps/web-host && pnpm dev

# Loans MFE only
cd apps/web-loans && pnpm dev
```

## Environment variables

All API configuration lives in `apps/api/.env`. Key variables:

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://ally:ally_local@localhost:5432/ally_db` | Matches docker-compose |
| `JWT_SECRET` | `change-me-local-dev-secret` | **Change before any shared deployment** |
| `JWT_REFRESH_SECRET` | `change-me-local-refresh-secret` | **Change before any shared deployment** |
| `STEP_FUNCTIONS_LOAN_ARN` | *(empty)* | Leave empty to skip Step Functions locally |

Each MFE reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`) from its own `.env.local`.
