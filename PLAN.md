# Ally Financial–Style Digital Banking Platform
**Serverless NestJS + Next.js Micro-Frontends on AWS, provisioned with Terraform**

A production-grade reference architecture for a modern, secure, and scalable digital banking experience, aligned with the technical environment used at companies like Ally Financial: serverless compute (Lambda, API Gateway, Step Functions), a Next.js micro-frontend shell built with Module Federation, and a fully Terraform-managed AWS footprint.

---

## Overview

This project demonstrates how to build and deploy a resilient, cloud-native financial services application using:

- **Next.js + React** – Micro-frontend host/remote architecture via Module Federation, with React Query, Redux, and Zustand for different layers of state.
- **NestJS on AWS Lambda** – Modular, TypeScript-based backend deployed as serverless functions behind API Gateway, with Step Functions orchestrating multi-step workflows.
- **PostgreSQL/Oracle** – Relational persistence layer (Aurora PostgreSQL-compatible by default, with an Oracle-compatible data-access path for legacy-core integration scenarios).
- **AWS Serverless Stack** – Lambda, API Gateway, Step Functions, S3, CloudFront, IAM, Secrets Manager, Parameter Store, CloudWatch.
- **Terraform** – Infrastructure as Code (IaC) to define, version, and deploy the entire AWS environment reproducibly.
- **GitHub Actions** – CI/CD for automated testing, building, and deployment.

The architecture mirrors real-world patterns used in digital banking: domain-isolated microservices, event/step-driven workflows for regulated processes (e.g., loan origination), strong security boundaries, observability, and independently deployable frontend modules.

---

## Architecture

### High-Level Diagram

```text
┌─────────────────────────┐
│      CloudFront CDN     │
│  (static assets + edge) │
└────────────┬─────────────┘
             │
   ┌─────────▼──────────┐
   │        S3           │
   │  Next.js Host Shell  │
   │  + Remote Micro-FEs  │  (Module Federation remoteEntry.js bundles)
   │  (Accounts, Loans,   │
   │   Admin, Payments)   │
   └─────────┬──────────┘
             │  REST calls
   ┌─────────▼──────────┐
   │     API Gateway      │
   │ (REST/HTTP API, auth │
   │  via Lambda authorizer)│
   └───────┬───────┬─────┘
           │       │
   ┌───────▼───┐ ┌─▼─────────────┐
   │  NestJS    │ │  Step Functions │
   │  Lambdas   │ │  (Loan origination,│
   │ (per domain│ │   multi-step KYC,  │
   │  module)   │ │   orchestration)   │
   └───────┬────┘ └───────┬────────────┘
           │              │
   ┌───────▼──────────────▼───┐
   │   Aurora PostgreSQL /     │
   │   Oracle-compatible RDS   │
   └───────────────────────────┘

  Cross-cutting: IAM, Secrets Manager, Parameter Store, CloudWatch Logs/Metrics/Alarms
```

- **Frontend (Next.js host + Module Federation remotes)**: Static-exported/SSR shell hosted on S3 + CloudFront. Each banking domain (Accounts, Payments, Loans, Admin) is an independently built and deployed micro-frontend remote, composed at runtime by the host via Webpack/Next.js Module Federation.
- **Backend (NestJS on Lambda)**: Each NestJS module (Accounts, Payments, Users, Admin) is packaged as one or more Lambda functions using `@nestjs/platform-express` + a Lambda adapter (e.g., `aws-serverless-express` or `@vendia/serverless-express`), fronted by API Gateway.
- **Workflow Orchestration (Step Functions)**: Long-running, auditable, multi-step regulated processes — loan origination, KYC/identity verification, dispute resolution — are modeled as Step Functions state machines that invoke NestJS Lambdas and handle retries, timeouts, and human-in-the-loop approval steps.
- **Database**: Amazon Aurora (PostgreSQL-compatible) as the primary data store, with a repository-layer abstraction (TypeORM/Prisma) that also supports an Oracle driver/connection profile for integration with legacy core-banking systems.
- **Infrastructure**: VPC with public/private subnets, Lambda functions in private subnets with NAT/VPC endpoints for RDS access, IAM least-privilege roles per function, Secrets Manager/Parameter Store for credentials and config, and CloudWatch for logs, metrics, and alarms — all defined in Terraform.

---

## Key Features

- **TypeScript end-to-end** – Shared types/DTOs and Zod/class-validator schemas between frontend and backend.
- **Domain-driven, serverless microservices** – NestJS modules organized around banking domains (accounts, payments, loans, users, admin), each independently deployable as its own Lambda/API Gateway route.
- **Micro-frontend architecture** – Next.js host application with Webpack Module Federation exposing/consuming remote modules per domain, enabling independent frontend team ownership and deployment cadence.
- **State management strategy**:
  - **React Query** – Server-state caching/sync for account, transaction, and loan-status data.
  - **Redux** – Cross-micro-frontend shared/global state (session, entitlements, feature flags) exposed via a shared Redux store contract at the host shell level.
  - **Zustand** – Local/lightweight UI state within individual micro-frontends (form wizards, widget-level state) without pulling in the full Redux store.
- **Workflow orchestration** – AWS Step Functions for multi-step, stateful, auditable processes (loan origination, KYC, fraud review) with built-in retry/error handling and CloudWatch-visible execution history.
- **Authentication & Authorization** – JWT-based auth validated by a Lambda authorizer at API Gateway, with role-based access control (RBAC) enforced in NestJS guards for customer vs. admin portals.
- **API Documentation** – Auto-generated OpenAPI/Swagger docs from NestJS decorators, published per-domain and aggregated at the API Gateway level.
- **Infrastructure as Code** – Complete AWS environment (VPC, Lambda, API Gateway, Step Functions, RDS/Aurora, CloudFront, S3, IAM) defined in modular Terraform.
- **CI/CD Ready** – GitHub Actions pipelines to run tests, package Lambda artifacts, publish Module Federation remotes to S3/CloudFront, and apply Terraform changes per environment.
- **Observability** – Centralized logging with CloudWatch Logs, Lambda/API Gateway metrics dashboards, and Step Functions execution tracing for latency, errors, and throughput.

---

## Tech Stack

### Frontend

- Next.js 14 (App Router, SSR/SSG, static export for CloudFront/S3 hosting)
- React 18
- TypeScript
- Micro-Frontend Architecture via Webpack Module Federation (host shell + domain remotes)
- React Query – server-state data fetching/caching
- Redux (Redux Toolkit) – shared cross-app state
- Zustand – local/lightweight component state
- Tailwind CSS / component library aligned to brand guidelines
- Zod for client-side validation

### Backend

- NestJS (TypeScript), deployed as AWS Lambda functions
- REST APIs per domain microservice
- PostgreSQL (Aurora, primary) / Oracle-compatible connection profile (legacy integration)
- TypeORM or Prisma as the ORM/data-access abstraction
- JWT authentication (`@nestjs/jwt`, `@nestjs/passport`) with a Lambda authorizer at the API Gateway edge
- Swagger/OpenAPI (`@nestjs/swagger`)
- Class-validator & Class-transformer
- AWS Step Functions for multi-step workflow orchestration across Lambdas

### DevOps & Cloud

- AWS:
  - VPC, subnets, route tables, NAT gateways, VPC endpoints (Secrets Manager, S3, RDS)
  - Lambda (Node.js runtime) for NestJS microservices
  - API Gateway (REST or HTTP API) with Lambda authorizer
  - Step Functions for orchestrated workflows (loan origination, KYC, dispute handling)
  - Amazon Aurora (PostgreSQL) / RDS Oracle-compatible option
  - CloudFront distribution for the Next.js micro-frontend shell and static assets
  - S3 (static hosting for host shell + Module Federation remotes, plus document/upload storage)
  - IAM roles & least-privilege policies per Lambda function
  - Secrets Manager – database credentials, third-party API keys
  - Parameter Store – environment configuration, feature flags, non-secret runtime config
  - CloudWatch – Logs, Metrics, Alarms, and Step Functions execution history
- Terraform:
  - Modular structure (networking, compute/lambda, api-gateway, step-functions, database, cdn, iam)
  - Remote state (S3 + DynamoDB locking)
  - Environment separation (dev, staging, prod) via workspaces or separate configs
- CI/CD:
  - GitHub Actions for automated testing, Lambda packaging/deployment, Module Federation remote publishing, and Terraform plan/apply gates
  - Automated unit/integration/e2e test stages prior to deployment

---

## Project Structure

```text
ally-demo/
├─ infra/
│  ├─ modules/
│  │  ├─ networking/
│  │  ├─ lambda/
│  │  ├─ api-gateway/
│  │  ├─ step-functions/
│  │  ├─ database/
│  │  ├─ cdn/
│  │  └─ iam/
│  ├─ environments/
│  │  ├─ dev/
│  │  ├─ staging/
│  │  └─ prod/
│  └─ main.tf
├─ apps/
│  ├─ web-host/                # Next.js Module Federation host shell
│  │  ├─ src/
│  │  ├─ public/
│  │  └─ package.json
│  ├─ web-accounts/            # Micro-frontend remote: Accounts
│  ├─ web-loans/               # Micro-frontend remote: Loan Origination
│  ├─ web-admin/               # Micro-frontend remote: Admin Portal
│  └─ api/                     # NestJS backend (Lambda-packaged, domain modules)
│     ├─ src/
│     │  ├─ accounts/
│     │  ├─ payments/
│     │  ├─ loans/
│     │  └─ users/
│     ├─ test/
│     └─ package.json
├─ workflows/
│  └─ step-functions/
│     ├─ loan-origination.asl.json
│     └─ kyc-verification.asl.json
├─ docs/
│  ├─ architecture.md
│  ├─ security.md
│  └─ deployment.md
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     └─ deploy.yml
└─ README.md
```

---

## Deployment Workflow

1. **Local Development**
   - Run each micro-frontend and the host shell locally with `npm run dev` (Module Federation dev server config resolves remotes to localhost).
   - Run NestJS locally via `npm run start:dev`; use `serverless-offline` or a local Lambda emulator to mirror the API Gateway/Lambda contract.
   - Docker Compose for local Postgres.

2. **Build & Package**
   - Build each micro-frontend remote and the host shell; publish `remoteEntry.js` bundles to S3.
   - Package NestJS Lambda functions (per domain) as zip/container artifacts.
   - Run automated unit/integration tests in GitHub Actions before packaging.

3. **Provision Infrastructure**
   - Initialize Terraform in the target environment:
     ```bash
     cd infra/environments/dev
     terraform init
     terraform plan -out=tfplan
     terraform apply tfplan
     ```
   - Terraform creates VPC, Lambda functions, API Gateway routes, Step Functions state machines, Aurora, CloudFront, S3, IAM roles, Secrets Manager entries, and Parameter Store parameters.

4. **Deploy Application**
   - GitHub Actions deploys updated Lambda artifacts and updates API Gateway integrations.
   - Micro-frontend remotes and host shell are synced to S3 and invalidated on CloudFront.
   - Step Functions state machine definitions are updated via Terraform or a dedicated deploy step.

5. **Access**
   - Frontend available via CloudFront domain (e.g., `https://d1234abcdef.cloudfront.net`).
   - Backend API exposed through API Gateway custom domain.
   - Step Functions executions visible/traceable in the AWS Console and CloudWatch.

---

## Security & Compliance Considerations

Designed to reflect financial-services best practices (not a substitute for formal compliance):

- **Network Isolation**
  - Public CloudFront/S3 origin for static frontend assets.
  - Private-subnet Lambdas with VPC endpoints for Secrets Manager, S3, and RDS access.
  - Security groups restrict traffic to required ports/services only.

- **Identity & Access**
  - Least-privilege IAM roles scoped per Lambda function (no shared broad-permission execution role).
  - No long-lived credentials in code; secrets managed via Secrets Manager, non-secret config via Parameter Store.
  - Lambda authorizer at API Gateway validates JWTs before requests reach NestJS handlers.

- **Data Protection**
  - TLS in transit (CloudFront, API Gateway, database connections).
  - Encryption at rest for Aurora/RDS, S3, and Secrets Manager.
  - Input validation (class-validator, Zod) and parameterized queries to mitigate injection attacks.

- **Audit & Logging**
  - Centralized application logs in CloudWatch Logs per Lambda function.
  - Step Functions execution history provides a built-in audit trail for regulated workflows.
  - Structured logging with correlation IDs and user IDs for cross-service traceability.
  - CloudWatch Alarms on error rates, Lambda throttles, and Step Functions failures.

---

## Example Use Cases (Ally-Flavored)

- **Customer Dashboard** (Accounts micro-frontend)
  - View account balances, recent transactions, and spending insights via React Query-cached calls to the Accounts Lambda.
  - Simulate transfers between checking/savings.

- **Loan Origination Flow** (Loans micro-frontend + Step Functions)
  - Multi-step application wizard (Zustand-managed local form state) submits to a Step Functions state machine.
  - The state machine orchestrates validation, credit/scoring simulation, KYC checks, and status updates across multiple NestJS Lambdas, with retry/error handling and full execution audit trail.

- **Admin Portal** (Admin micro-frontend, RBAC-gated)
  - Internal tool for support staff to view customer accounts (masked data), review loan applications, and manage flags.
  - Role-based access enforced via NestJS guards and the API Gateway Lambda authorizer.

---

## How This Relates to Ally Financial

Ally has publicly emphasized modernizing its digital banking stack on AWS, improving resiliency, and adopting cloud-native, serverless-friendly patterns across critical systems. This project reflects similar principles:

- Serverless, API-driven architecture that scales elastically with demand.
- Micro-frontend decomposition enabling independent team ownership and release cadence.
- Step Functions-based orchestration for auditable, regulated financial workflows.
- Use of modern TypeScript-based frameworks (NestJS, Next.js) aligned with current industry practice for financial platforms.

While this is a reference/educational project, it's structured so you can speak concretely in interviews about:

- Designing serverless, multi-tier, micro-frontend architectures.
- Implementing CI/CD and IaC with Terraform and GitHub Actions on AWS.
- Orchestrating regulated, multi-step banking workflows with Step Functions.
- Managing secrets/config securely with Secrets Manager and Parameter Store.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/ally-demo.git
cd ally-demo

# Install dependencies
cd apps/api && npm install
cd ../web-host && npm install
cd ../web-accounts && npm install
cd ../web-loans && npm install
cd ../web-admin && npm install

# Local Postgres via Docker Compose
docker-compose up -d db

# Run backend locally (Lambda-emulated)
cd apps/api
npm run start:dev

# Run frontend host + remotes locally
cd ../web-host
npm run dev
# (in separate terminals)
cd ../web-accounts && npm run dev
cd ../web-loans && npm run dev
cd ../web-admin && npm run dev
```

See `docs/deployment.md` for detailed Terraform, Lambda packaging, and Step Functions setup instructions.

---

## License

MIT (for portfolio/educational purposes).