# Architecture

> This document describes the deployed architecture of ally-demo. Update with actual resource names/ARNs after first Terraform apply.

## Overview

See `PLAN.md` for the high-level architecture diagram and component descriptions.

## Frontend

- **Host Shell** (`apps/web-host`): Next.js 14 App Router, served via CloudFront + S3. Module Federation host.
- **Accounts Remote** (`apps/web-accounts`): Micro-frontend for account balances and transfers.
- **Loans Remote** (`apps/web-loans`): Micro-frontend for loan origination wizard and status tracking.
- **Admin Remote** (`apps/web-admin`): RBAC-gated internal portal for support staff.

## Backend

- **API** (`apps/api`): NestJS, deployed as per-domain Lambda functions behind API Gateway.
- Domain modules: `accounts`, `payments`, `loans`, `users`, `admin`.
- Lambda authorizer validates JWTs at the API Gateway edge before requests reach NestJS.

## Workflows

- `workflows/step-functions/loan-origination.asl.json` — multi-step loan origination state machine.
- `workflows/step-functions/kyc-verification.asl.json` — identity verification state machine.

## Infrastructure

All AWS resources are defined in `infra/`. See `docs/deployment.md` for provisioning steps.

| Resource | Notes |
|---|---|
| VPC | Private subnets for Lambda + RDS; public for NAT/ALB |
| Aurora PostgreSQL | Primary data store |
| Lambda | One function per NestJS domain module |
| API Gateway | HTTP API with Lambda authorizer |
| Step Functions | Loan origination, KYC |
| CloudFront + S3 | Static frontend hosting |
| Secrets Manager | DB credentials, third-party keys |
| Parameter Store | Feature flags, non-secret runtime config |
| CloudWatch | Logs, metrics, alarms |
