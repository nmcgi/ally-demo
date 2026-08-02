# TODO — Ally Demo Build Tasks

Tasks are ordered roughly by dependency. Complete infrastructure scaffolding before application code, application code before CI/CD wiring.

---

## Phase 1 — Repo & Monorepo Foundation

- [x] Initialize git repo and `.gitignore` (Node, Terraform, env files)
- [x] Set up monorepo tooling — `pnpm` workspaces or Turborepo `turbo.json`
- [x] Add root `package.json` with workspace definitions for `apps/*`
- [x] Add `tsconfig.base.json` with shared TypeScript paths/aliases
- [x] Create `docker-compose.yml` for local PostgreSQL instance
- [x] Create `/docs/architecture.md`, `/docs/security.md`, `/docs/deployment.md` stubs

---

## Phase 2 — Shared Packages

- [x] Create `packages/shared-types/` — shared DTOs, Zod schemas, and TypeScript interfaces used by both frontend and backend
- [x] Create `packages/eslint-config/` and `packages/tsconfig/` for shared lint/build config

---

## Phase 3 — NestJS Backend (`apps/api`)

- [x] Scaffold NestJS app with `@nestjs/cli`
- [x] Configure `@vendia/serverless-express` (or `aws-serverless-express`) Lambda adapter + `handler.ts` entry point
- [x] Set up TypeORM with Aurora PostgreSQL connection (env-driven, Secrets Manager-ready)
- [x] Implement `AuthModule` — JWT strategy (`@nestjs/passport`, `@nestjs/jwt`), login/refresh endpoints, RBAC guards
- [x] Implement `UsersModule` — user entity, repository, CRUD endpoints
- [x] Implement `AccountsModule` — account/transaction entities, balance queries, transfer logic
- [x] Implement `PaymentsModule` — payment initiation, status tracking
- [x] Implement `LoansModule` — loan application entity, status transitions, Step Functions trigger
- [x] Implement `AdminModule` — masked account views, loan application review, RBAC-gated
- [x] Add Swagger/OpenAPI setup (`@nestjs/swagger`) with per-module tags
- [x] Add class-validator + class-transformer to all DTOs
- [x] Add unit tests for each module (Jest)
- [x] Add e2e/integration tests against local Postgres (`test/`)

---

## Phase 4 — Step Functions Workflows (`workflows/step-functions`)

- [x] Author `loan-origination.asl.json` state machine (validate → credit-check → KYC → underwrite → decision)
- [x] Author `kyc-verification.asl.json` state machine (ID upload → verify → match → approve/reject)
- [x] Wire Step Functions task states to NestJS Lambda ARNs (parameterized for env)
- [x] Add error/retry/catch configs and wait-for-callback tokens for human-approval steps

---

## Phase 5 — Next.js Host Shell (`apps/web-host`)

- [x] Scaffold Next.js 14 app (App Router, TypeScript, Tailwind CSS)
- [x] Configure Webpack Module Federation host — expose `remoteEntry` contracts for each remote
- [x] Set up Redux Toolkit store at host level (session, auth state, entitlements, feature flags)
- [x] Implement shell layout — nav, header, auth-aware routing, loading/error boundaries for remote modules
- [x] Add React Query `QueryClientProvider` at host level
- [x] Implement JWT-aware API client (axios/fetch with refresh interceptor)
- [x] Add auth pages (login, logout, token refresh flow)

---

## Phase 6 — Accounts Micro-Frontend (`apps/web-accounts`)

- [x] Scaffold Next.js/React app with Module Federation remote config
- [x] Build account dashboard — balance cards, transaction list (React Query), account switcher
- [x] Build transfer wizard (Zustand local form state → API call)
- [x] Expose `AccountsDashboard` component via `remoteEntry.js`

---

## Phase 7 — Loans Micro-Frontend (`apps/web-loans`)

- [x] Scaffold Next.js/React app with Module Federation remote config
- [x] Build loan application wizard (multi-step, Zustand-managed) — personal info, income, loan details, review
- [x] Wire submission to backend → Step Functions trigger
- [x] Build loan status tracker — poll Step Functions execution status via backend API
- [x] Expose `LoanApplication` and `LoanStatus` components via `remoteEntry.js`

---

## Phase 8 — Admin Micro-Frontend (`apps/web-admin`)

- [x] Scaffold Next.js/React app with Module Federation remote config
- [x] Build customer account search + masked detail view
- [x] Build loan application review queue (approve/reject actions)
- [x] Enforce RBAC — hide/disable based on Redux entitlements from host shell
- [x] Expose `AdminPortal` component via `remoteEntry.js`

---

## Phase 9 — Terraform Infrastructure (`infra/`)

- [x] Set up remote state backend (`infra/backend.tf`) — S3 bucket + DynamoDB lock table
- [x] Create `infra/modules/networking/` — VPC, public/private subnets, NAT gateway, route tables, VPC endpoints (S3, Secrets Manager, RDS)
- [x] Create `infra/modules/iam/` — per-Lambda execution roles with least-privilege policies
- [x] Create `infra/modules/database/` — Aurora PostgreSQL cluster, parameter groups, security groups, Secrets Manager secret for credentials
- [x] Create `infra/modules/lambda/` — Lambda function resources per domain (accounts, payments, loans, users, admin, authorizer), with VPC config and env var injection
- [x] Create `infra/modules/api-gateway/` — HTTP API Gateway, Lambda integrations, Lambda authorizer, CORS, custom domain
- [x] Create `infra/modules/step-functions/` — state machine resources, IAM roles for Step Functions → Lambda invocation
- [x] Create `infra/modules/cdn/` — S3 bucket for static assets + CloudFront distribution (OAI, cache behaviors, HTTPS)
- [x] Create environment configs (`infra/environments/dev/`, `staging/`, `prod/`) composing the modules above
- [x] Add CloudWatch log groups, metric filters, and alarms (Lambda errors, throttles, Step Functions failures)
- [x] Add Parameter Store entries for non-secret runtime config (feature flags, API URLs)

---

## Phase 10 — CI/CD (`/.github/workflows`)

- [ ] Create `ci.yml` — lint, type-check, unit/integration tests on every PR (all apps + infra validate)
- [ ] Create `deploy.yml` — on merge to `main`: build Lambda zips, publish MFE remotes to S3, invalidate CloudFront, `terraform apply` per environment
- [ ] Add GitHub secrets for AWS credentials, Terraform backend config
- [ ] Gate `terraform apply` on manual approval for staging/prod environments

---

## Phase 11 — Observability & Security Hardening

- [ ] Add structured logging with correlation IDs to all NestJS Lambda handlers
- [ ] Add CloudWatch Logs Insights queries for common debugging patterns
- [ ] Verify TLS enforced on Aurora connections and CloudFront→S3 origin
- [ ] Confirm encryption-at-rest enabled for Aurora, S3 buckets, and Secrets Manager
- [ ] Review IAM policies — no wildcards on resource or action
- [ ] Validate Lambda authorizer rejects expired/invalid JWTs with correct 401/403 responses

---

## Phase 12 — Documentation & Demo Polish

- [ ] Complete `docs/architecture.md` with actual deployed resource names/ARNs
- [ ] Complete `docs/deployment.md` with step-by-step Terraform and app deployment guide
- [ ] Complete `docs/security.md` with threat model and compliance notes
- [ ] Update `PLAN.md` Getting Started commands to match actual monorepo scripts
- [ ] Record or write a walkthrough of the loan origination flow end-to-end (Step Functions trace → frontend wizard)
