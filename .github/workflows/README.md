# GitHub Actions workflows

## Workflows

| File | Name | Trigger | Purpose |
|------|------|---------|---------|
| `test.yml` | `Test` | PR to `main`, push to `main` | Lint, type-check, unit tests, E2E tests, Terraform validate |
| `deploy.yml` | `Deploy` | After `Test` succeeds on `main` | Build artifacts, deploy dev → staging → prod |

## Environment protection rules

Configure these in **Settings → Environments** before the first deploy:

| Environment | Required reviewers | Deployment branch |
|-------------|-------------------|-------------------|
| `dev` | — (automatic) | `main` |
| `staging` | 1 reviewer | `main` |
| `prod` | 2 reviewers | `main` |

## GitHub secrets

Set these under **Settings → Secrets and variables → Actions**:

### AWS OIDC (replace long-lived keys)

Create an OIDC identity provider in IAM (`token.actions.githubusercontent.com`) and a role per environment that trusts it.

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN_DEV` | IAM role ARN for dev deploys |
| `AWS_ROLE_ARN_STAGING` | IAM role ARN for staging deploys |
| `AWS_ROLE_ARN_PROD` | IAM role ARN for prod deploys |

### Artifact storage (output of `terraform apply`)

| Secret | Description |
|--------|-------------|
| `ARTIFACT_BUCKET_DEV` | `ally-demo-dev-lambda-artifacts` |
| `ARTIFACT_BUCKET_STAGING` | `ally-demo-staging-lambda-artifacts` |
| `ARTIFACT_BUCKET_PROD` | `ally-demo-prod-lambda-artifacts` |
| `MFE_BUCKET_DEV_PREFIX` | `ally-demo-dev-mfe` |
| `MFE_BUCKET_STAGING_PREFIX` | `ally-demo-staging-mfe` |
| `MFE_BUCKET_PROD_PREFIX` | `ally-demo-prod-mfe` |
| `CF_DISTRIBUTION_ID_DEV` | CloudFront distribution ID for dev |
| `CF_DISTRIBUTION_ID_STAGING` | CloudFront distribution ID for staging |
| `CF_DISTRIBUTION_ID_PROD` | CloudFront distribution ID for prod |

### Application secrets

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | Signing key for access tokens |
| `JWT_REFRESH_SECRET` | Signing key for refresh tokens |
| `PROD_DOMAIN` | Custom domain for prod (e.g. `app.example.com`) |
| `PROD_ACM_CERT_ARN` | ACM certificate ARN in `us-east-1` for prod domain |

## First-time setup sequence

```bash
# 1. Bootstrap remote state (run once, locally)
cd infra/bootstrap
terraform init && terraform apply

# 2. Deploy dev environment (first apply creates all resources)
cd infra/environments/dev
terraform init
terraform apply \
  -var "jwt_secret=<secret>" \
  -var "jwt_refresh_secret=<secret>"

# 3. Copy terraform outputs into GitHub secrets
terraform output artifact_bucket    # → ARTIFACT_BUCKET_DEV
terraform output cdn_domain         # use to find the CF distribution ID

# 4. Push to main — the deploy workflow takes it from there
```
