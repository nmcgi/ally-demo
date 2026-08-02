# Deployment

## Prerequisites

- Node.js >= 20, pnpm >= 9
- Terraform >= 1.8
- AWS CLI configured with appropriate credentials
- Docker (for local Postgres)

## Local Development

```bash
# Start local Postgres
pnpm db:up

# Install all workspace dependencies
pnpm install

# Run backend (Lambda-emulated via serverless-offline or ts-node)
cd apps/api && pnpm dev

# Run frontend host + all remotes (in separate terminals or via turbo)
pnpm dev
```

## Infrastructure Provisioning (Terraform)

### First-time setup — remote state backend

Create the S3 bucket and DynamoDB table for Terraform state before running any `init`:

```bash
# Edit infra/bootstrap/main.tf with your desired bucket/table names, then:
cd infra/bootstrap
terraform init
terraform apply
```

### Per-environment provisioning

```bash
cd infra/environments/dev
terraform init -backend-config=backend.hcl
terraform plan -out=tfplan
terraform apply tfplan
```

Repeat for `staging` and `prod` with appropriate backend configs and variable overrides.

### What Terraform creates

- VPC, subnets, NAT gateway, VPC endpoints
- Aurora PostgreSQL cluster + Secrets Manager secret for credentials
- Lambda functions (one per domain module) with VPC config and IAM roles
- API Gateway HTTP API with Lambda authorizer
- Step Functions state machines (loan origination, KYC)
- S3 buckets + CloudFront distribution for frontend
- Parameter Store entries for runtime config
- CloudWatch log groups, metric filters, and alarms

## Application Deployment (GitHub Actions)

Merges to `main` trigger `.github/workflows/deploy.yml`:

1. Run lint, type-check, and tests across all workspaces.
2. Build Lambda zip artifacts per domain and upload to S3.
3. Build micro-frontend remotes and host shell; sync to S3 + invalidate CloudFront.
4. Run `terraform plan` (auto) and `terraform apply` (manual approval gate for staging/prod).

## Environment Variables

| Variable | Source | Description |
|---|---|---|
| `DATABASE_URL` | Secrets Manager | Aurora connection string |
| `JWT_SECRET` | Secrets Manager | JWT signing key |
| `AWS_REGION` | Lambda env | AWS region |
| `STEP_FUNCTIONS_LOAN_ARN` | Parameter Store | Loan origination state machine ARN |
| `STEP_FUNCTIONS_KYC_ARN` | Parameter Store | KYC state machine ARN |

## Accessing the App

- **Frontend**: CloudFront domain (set after first Terraform apply — update this doc with the URL).
- **API**: API Gateway custom domain (update after first apply).
- **Step Functions**: AWS Console → Step Functions → State machines.
- **Local DB admin**: `http://localhost:8080` (Adminer, when `docker-compose up` is running).
