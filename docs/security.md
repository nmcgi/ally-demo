# Security

> Designed to reflect financial-services best practices. Not a substitute for formal compliance review.

## Network Isolation

- Lambda functions run in private VPC subnets with no direct internet access.
- VPC endpoints for Secrets Manager, S3, and RDS — no traffic traverses the public internet.
- Security groups restrict ingress/egress to the minimum required ports and CIDR ranges.
- CloudFront enforces HTTPS and acts as the only public entry point for the frontend.

## Identity & Access

- IAM execution roles scoped per Lambda function — no shared broad-permission roles.
- No long-lived credentials in code or environment variables; all secrets via Secrets Manager.
- Non-secret runtime config (feature flags, API URLs) via Parameter Store.
- API Gateway Lambda authorizer validates JWTs (expiry, signature, issuer) before forwarding requests.
- NestJS RBAC guards enforce customer vs. admin roles at the handler level.

## Data Protection

- TLS enforced in transit: CloudFront ↔ client, API Gateway ↔ Lambda, Lambda ↔ Aurora.
- Encryption at rest: Aurora storage, S3 buckets (SSE-S3/KMS), Secrets Manager entries.
- Input validation via class-validator + Zod on all external inputs.
- Parameterized queries via TypeORM/Prisma — no raw string interpolation in SQL.

## Audit & Logging

- Structured JSON logs with correlation IDs and (masked) user IDs per request, emitted to CloudWatch Logs.
- Step Functions execution history provides built-in audit trail for regulated workflows.
- CloudWatch Alarms on Lambda error rates, throttles, and Step Functions failures.
- No PII or credentials written to logs.

## Threat Model Notes

| Threat | Mitigation |
|---|---|
| Token theft / replay | Short-lived JWTs (15 min), refresh token rotation, authorizer validates on every request |
| SQL injection | Parameterized queries via ORM; class-validator on all DTOs |
| SSRF | Lambda VPC endpoints limit outbound destinations; no user-supplied URLs fetched server-side |
| Secrets exposure | Secrets Manager only; never in env vars, logs, or source |
| Privilege escalation | Per-function IAM roles; RBAC guards in NestJS; entitlements enforced at host shell |
