# Security

Reflects financial-services best practices as implemented in this reference
architecture. Not a substitute for a formal compliance review.

## Network isolation

- Both Lambda functions (`api`, `authorizer`) run in **private VPC subnets** with no inbound internet access; egress is via NAT.
- **VPC endpoints** for S3, Secrets Manager, SSM, and Step Functions keep that traffic off the public internet.
- Security groups are least-privilege: the Aurora SG accepts `5432` **only** from the Lambda SG; the Lambda SG is egress-only.
- **CloudFront is the only public entry point** for the frontend; S3 buckets block all public access and are reachable solely via Origin Access Control.

## Identity & access

- **API Gateway Lambda authorizer** validates every request's JWT (signature + expiry) before it reaches NestJS. Missing token → **401**; invalid/expired token → **403**. Covered by unit tests in `apps/api/src/authorizer.spec.ts`.
- JWTs are short-lived (**15 min access**, **7 day refresh**, signed with separate keys). Refresh is exchanged at `POST /auth/refresh`.
- **RBAC** enforced in depth: `RolesGuard` + `@Roles()` at NestJS handlers (checked against the JWT `role` claim), and entitlement gating at the host shell (`customer` / `support` / `admin`).
- **Least-privilege IAM**: dedicated Lambda and Step Functions execution roles, with resource ARNs scoped to this environment's prefix (`ally-demo-<env>-*`). The only `Resource: "*"` grants are the X-Ray write and Step Functions log-delivery APIs, which AWS does not support at resource level — documented inline in `infra/modules/iam/main.tf`.
- **No long-lived cloud credentials**: CI/CD authenticates to AWS via GitHub OIDC.

## Data protection

- **TLS in transit**: CloudFront ↔ client (HTTPS-only, `redirect-to-https`); API Gateway ↔ Lambda; Lambda ↔ Aurora enforced at the database via `rds.force_ssl = 1` (and TypeORM `ssl.rejectUnauthorized` in production). S3 buckets deny any request where `aws:SecureTransport = false`.
- **Encryption at rest**: Aurora `storage_encrypted = true`; S3 buckets SSE (AES256); Secrets Manager entries encrypted with the AWS-managed KMS key.
- **Secrets** live only in Secrets Manager / SSM SecureString — never in source, plaintext env vars (the authorizer resolves keys from SSM at runtime), or logs.
- **Input validation** on every external input via `class-validator` DTOs (API) and Zod schemas (`@ally/shared-types`). All SQL goes through parameterized TypeORM queries — no string interpolation.
- Passwords hashed with **bcrypt (cost 12)**; `passwordHash` is stripped from every API response. Admin views mask account numbers to the last 4 digits.

## Audit & observability

- **Structured JSON logs** with a per-request **correlation ID** (`x-correlation-id`, propagated via `AsyncLocalStorage`), emitted to CloudWatch Logs. The ID is returned on the response header so a client report can be traced to exact log lines.
- **Logs Insights saved queries** (`ally-demo-<env>/*`) for recent errors, trace-by-correlation-id, slowest requests, 5xx rates, and authorizer denials.
- **CloudWatch alarms** on Lambda errors/throttles/p99 duration, API Gateway 5xx/latency, Aurora connections/CPU, and Step Functions execution failures.
- **Step Functions execution history** is an immutable audit trail for regulated loan/KYC workflows; both machines emit to CloudWatch Logs with X-Ray tracing enabled.
- No PII or credentials are written to logs.

## Threat model

| Threat | Mitigation |
|--------|------------|
| Token theft / replay | Short-lived (15 min) JWTs; authorizer validates signature + expiry on every request; separate refresh key |
| Broken auth / privilege escalation | Edge authorizer + NestJS `RolesGuard`; host-shell entitlement gating; per-role admin actions restricted to `admin` |
| SQL injection | Parameterized TypeORM queries; `class-validator` + Zod on all DTOs |
| SSRF / lateral movement | Lambdas egress-only in private subnets; VPC endpoints constrain destinations; no user-supplied URLs fetched server-side |
| Secrets exposure | Secrets Manager / SSM only; OIDC for CI; SSM references (not plaintext) in Lambda env |
| Data interception | TLS enforced end to end; `rds.force_ssl`; S3 `SecureTransport` deny |
| Data at rest compromise | KMS/SSE encryption on Aurora, S3, and Secrets Manager |
| Public asset tampering | S3 private + OAC; CloudFront HTTPS-only; versioned buckets |
| DoS / abuse | API Gateway throttling (burst 500 / rate 1000); CloudFront caching absorbs static load |

## Compliance notes

This demo maps to controls commonly required in US banking (GLBA, PCI-DSS
adjacent, SOC 2). It is illustrative, not certified.

- **Encryption** (GLBA Safeguards, PCI 3/4): satisfied in transit and at rest as above.
- **Access control & least privilege** (SOC 2 CC6): scoped IAM roles, RBAC, MFA-capable console access (out of scope here).
- **Audit logging & monitoring** (SOC 2 CC7, PCI 10): structured logs with correlation IDs, immutable Step Functions history, CloudWatch alarms, 30-/90-day log retention (dev/prod).
- **Change management** (SOC 2 CC8): all infra is Terraform-managed; deploys require green tests and manual approval gates for staging/prod.
- **Data minimization**: only last-4 account numbers exposed to support staff; income/PII used solely for the documented loan decisioning flow.

### Known gaps (intentional, for a demo)

- Refresh-token **rotation/revocation list** is not implemented (tokens are stateless).
- The main API loads `JWT_SECRET` as plaintext; production should resolve it from SSM at startup like the authorizer does.
- No WAF, GuardDuty, or Config rules are provisioned.
- `synchronize: true` (TypeORM auto-migration) is used outside production; a real deployment would use versioned migrations.
