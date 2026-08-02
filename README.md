# Ally Demo

A production-grade reference architecture for a digital banking platform. Built with a serverless NestJS API, Next.js micro-frontends via Module Federation, and AWS Step Functions for loan origination workflows.

## Architecture at a glance

```mermaid
graph TD
    Host["web-host :3000\n(Next.js shell)"]
    Accounts["web-accounts :3001\n(MFE remote)"]
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
| Accounts MFE | http://localhost:3001 | Accounts remote (also on 3001 — separate Next.js instance) |
| Loans MFE | http://localhost:3002 | Loans remote |
| Admin MFE | http://localhost:3003 | Admin remote |

> **Note:** The Accounts MFE and the NestJS API both default to port 3001. When running via `pnpm dev`, set `NEXT_PUBLIC_API_URL` in `apps/web-accounts/.env.local` (and the other MFE `.env.local` files) to point at the API if there's a conflict.

### 5. Create a user

Use the Swagger UI at http://localhost:3001/api/docs to `POST /users` and create your first account, then log in at http://localhost:3000/login.

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
