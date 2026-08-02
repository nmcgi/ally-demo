# Step Functions State Machines

## Files

| File | Description |
|---|---|
| `loan-origination.asl.json` | End-to-end loan origination workflow |
| `kyc-verification.asl.json` | Identity verification sub-workflow (called from loan origination) |

---

## ARN Placeholders

Both ASL files use `${...}` placeholders for Lambda ARNs. These are resolved by Terraform's `templatefile()` function when the `aws_sfn_state_machine` resource is created:

```hcl
# infra/modules/step-functions/main.tf
resource "aws_sfn_state_machine" "loan_origination" {
  name       = "ally-loan-origination-${var.env}"
  role_arn   = aws_iam_role.step_functions.arn
  definition = templatefile("${path.module}/../../../workflows/step-functions/loan-origination.asl.json", {
    ValidateLoanApplicationFunctionArn  = module.lambda.validate_loan_arn
    StartKycVerificationFunctionArn     = module.lambda.start_kyc_arn
    RunCreditCheckFunctionArn           = module.lambda.credit_check_arn
    UnderwriteFunctionArn               = module.lambda.underwrite_arn
    NotifyUnderwriterFunctionArn        = module.lambda.notify_underwriter_arn
    FinalizeApprovalFunctionArn         = module.lambda.finalize_approval_arn
    FinalizeRejectionFunctionArn        = module.lambda.finalize_rejection_arn
    SendNotificationFunctionArn         = module.lambda.send_notification_arn
    HandleSystemErrorFunctionArn        = module.lambda.handle_system_error_arn
  })
}
```

---

## Loan Origination Flow

```mermaid
flowchart TD
    Start([Start]) --> ValidateApplication[ValidateApplication\nLambda Task]
    ValidateApplication -->|error| HandleSystemError[HandleSystemError]
    ValidateApplication --> CheckValidationResult{CheckValidationResult}

    CheckValidationResult -->|invalid| RejectApplication
    CheckValidationResult -->|valid| StartKycVerification

    StartKycVerification["StartKycVerification\n⏳ waitForTaskToken\n24h heartbeat"]
    StartKycVerification -->|KycFailed / HeartbeatTimeout| RejectApplicationKycFailed
    StartKycVerification -->|error| HandleSystemError
    StartKycVerification --> CheckKycResult{CheckKycResult}

    CheckKycResult -->|failed| RejectApplicationKycFailed
    CheckKycResult -->|approved| RunCreditCheck

    RunCreditCheck[RunCreditCheck\nLambda Task]
    RunCreditCheck -->|CreditBureauUnavailable| WaitAndRetryCreditCheck[WaitAndRetryCreditCheck\n⏱ Wait 5 min]
    WaitAndRetryCreditCheck --> RunCreditCheck
    RunCreditCheck -->|error| HandleSystemError
    RunCreditCheck --> CheckCreditResult{CheckCreditResult}

    CheckCreditResult -->|score < 620| RejectApplicationCreditFailed
    CheckCreditResult -->|score ≥ 620| Underwrite

    Underwrite[Underwrite\nLambda Task]
    Underwrite -->|error| HandleSystemError
    Underwrite --> CheckUnderwritingResult{CheckUnderwritingResult}

    CheckUnderwritingResult -->|requiresManualReview| ManualUnderwritingReview
    CheckUnderwritingResult -->|approved| ApproveApplication
    CheckUnderwritingResult -->|else| RejectApplication

    ManualUnderwritingReview["ManualUnderwritingReview\n⏳ waitForTaskToken\n72h heartbeat · 7d timeout"]
    ManualUnderwritingReview -->|HeartbeatTimeout / Timeout| RejectApplicationTimeout
    ManualUnderwritingReview -->|error| HandleSystemError
    ManualUnderwritingReview --> CheckManualReviewResult{CheckManualReviewResult}

    CheckManualReviewResult -->|approved| ApproveApplication
    CheckManualReviewResult -->|rejected| RejectApplication

    ApproveApplication[ApproveApplication\nLambda Task] --> NotifyApproval[NotifyApproval\nLambda Task]
    NotifyApproval --> ApplicationApproved([✅ ApplicationApproved\nSucceed])

    RejectApplication[RejectApplication\nLambda Task] --> NotifyRejection[NotifyRejection\nLambda Task]
    RejectApplicationKycFailed[RejectApplicationKycFailed\nLambda Task] --> NotifyRejection
    RejectApplicationCreditFailed[RejectApplicationCreditFailed\nLambda Task] --> NotifyRejection
    RejectApplicationTimeout[RejectApplicationTimeout\nLambda Task] --> NotifyRejection
    NotifyRejection --> ApplicationRejected([❌ ApplicationRejected\nFail])

    HandleSystemError[HandleSystemError\nLambda Task] --> SystemError([💥 SystemError\nFail])

    style StartKycVerification fill:#fef3c7,stroke:#d97706
    style ManualUnderwritingReview fill:#fef3c7,stroke:#d97706
    style ApplicationApproved fill:#d1fae5,stroke:#059669
    style ApplicationRejected fill:#fee2e2,stroke:#dc2626
    style SystemError fill:#fee2e2,stroke:#dc2626
    style WaitAndRetryCreditCheck fill:#ede9fe,stroke:#7c3aed
```

### Wait-for-callback states

| State | Waiter | Heartbeat | Timeout |
|---|---|---|---|
| `StartKycVerification` | Customer completes KYC | 24h | — |
| `ManualUnderwritingReview` | Underwriter decision | 72h | 7 days |

---

## KYC Verification Flow

```mermaid
flowchart TD
    Start([Start]) --> InitiateKycSession[InitiateKycSession\nLambda Task]
    InitiateKycSession -->|error| HandleKycSystemError
    InitiateKycSession --> WaitForDocumentUpload

    WaitForDocumentUpload["WaitForDocumentUpload\n⏳ waitForTaskToken\n1h heartbeat · 24h timeout"]
    WaitForDocumentUpload -->|HeartbeatTimeout / Timeout| KycExpired
    WaitForDocumentUpload -->|error| HandleKycSystemError
    WaitForDocumentUpload --> CheckDocumentUploadResult{CheckDocumentUploadResult}

    CheckDocumentUploadResult -->|uploaded| ExtractDocumentData
    CheckDocumentUploadResult -->|cancelled / else| KycExpired

    ExtractDocumentData[ExtractDocumentData\nLambda Task]
    ExtractDocumentData -->|DocumentUnreadable\nUnsupportedDocumentType| RequestDocumentReupload
    ExtractDocumentData -->|error| HandleKycSystemError
    ExtractDocumentData --> CheckExtractionQuality{CheckExtractionQuality}

    CheckExtractionQuality -->|confidence ≥ 0.85| MatchIdentity
    CheckExtractionQuality -->|confidence < 0.85| RequestDocumentReupload

    RequestDocumentReupload["RequestDocumentReupload\n⏳ waitForTaskToken\n1h heartbeat · 24h timeout"]
    RequestDocumentReupload -->|HeartbeatTimeout / Timeout| KycExpired
    RequestDocumentReupload -->|error| HandleKycSystemError
    RequestDocumentReupload --> ExtractDocumentData

    MatchIdentity[MatchIdentity\nLambda Task]
    MatchIdentity -->|error| HandleKycSystemError
    MatchIdentity --> CheckIdentityMatch{CheckIdentityMatch}

    CheckIdentityMatch -->|matched ≥ 0.90| RunSanctionsScreening
    CheckIdentityMatch -->|score < 0.90 / no match| RequireManualIdentityReview

    RequireManualIdentityReview["RequireManualIdentityReview\n⏳ waitForTaskToken\n24h heartbeat · 72h timeout\nCompliance team"]
    RequireManualIdentityReview -->|HeartbeatTimeout / Timeout| KycExpired
    RequireManualIdentityReview -->|error| HandleKycSystemError
    RequireManualIdentityReview --> CheckManualIdentityReviewResult{CheckManualIdentityReviewResult}

    CheckManualIdentityReviewResult -->|approved| RunSanctionsScreening
    CheckManualIdentityReviewResult -->|rejected| KycFailed

    RunSanctionsScreening[RunSanctionsScreening\nLambda Task]
    RunSanctionsScreening -->|SanctionsServiceUnavailable| WaitAndRetrySanctionsScreening[WaitAndRetrySanctionsScreening\n⏱ Wait 60s]
    WaitAndRetrySanctionsScreening --> RunSanctionsScreening
    RunSanctionsScreening -->|error| HandleKycSystemError
    RunSanctionsScreening --> CheckSanctionsResult{CheckSanctionsResult}

    CheckSanctionsResult -->|clear| FinalizeKycApproval
    CheckSanctionsResult -->|requiresReview| RequireManualSanctionsReview
    CheckSanctionsResult -->|else| KycFailed

    RequireManualSanctionsReview["RequireManualSanctionsReview\n⏳ waitForTaskToken\n24h heartbeat · 72h timeout\nCompliance team"]
    RequireManualSanctionsReview -->|HeartbeatTimeout / Timeout| KycExpired
    RequireManualSanctionsReview -->|error| HandleKycSystemError
    RequireManualSanctionsReview --> CheckSanctionsManualReviewResult{CheckSanctionsManualReviewResult}

    CheckSanctionsManualReviewResult -->|cleared| FinalizeKycApproval
    CheckSanctionsManualReviewResult -->|not cleared| KycFailed

    FinalizeKycApproval[FinalizeKycApproval\nLambda Task] --> KycApproved([✅ KYC Approved\nEnd])

    KycExpired[KycExpired\nLambda Task] --> KycVerificationFailed
    KycFailed[KycFailed\nLambda Task] --> KycVerificationFailed([❌ KycVerificationFailed\nFail])

    HandleKycSystemError[HandleKycSystemError\nLambda Task] --> KycSystemError([💥 KycSystemError\nFail])

    style WaitForDocumentUpload fill:#fef3c7,stroke:#d97706
    style RequestDocumentReupload fill:#fef3c7,stroke:#d97706
    style RequireManualIdentityReview fill:#fef3c7,stroke:#d97706
    style RequireManualSanctionsReview fill:#fef3c7,stroke:#d97706
    style WaitAndRetrySanctionsScreening fill:#ede9fe,stroke:#7c3aed
    style KycApproved fill:#d1fae5,stroke:#059669
    style KycVerificationFailed fill:#fee2e2,stroke:#dc2626
    style KycSystemError fill:#fee2e2,stroke:#dc2626
```

### Wait-for-callback states

| State | Waiter | Heartbeat | Timeout |
|---|---|---|---|
| `WaitForDocumentUpload` | Customer uploads ID document | 1h | 24h |
| `RequestDocumentReupload` | Customer re-uploads after quality failure | 1h | 24h |
| `RequireManualIdentityReview` | Compliance team reviews identity | 24h | 72h |
| `RequireManualSanctionsReview` | Compliance team reviews sanctions hits | 24h | 72h |

---

## How Task Tokens Work

For every `waitForTaskToken` state, the NestJS Lambda:
1. Receives `taskToken` in the event payload from Step Functions.
2. Persists the token (in DynamoDB or the Aurora DB) alongside the relevant record.
3. Returns immediately — Step Functions pauses the execution.
4. When the external event completes (customer uploads a document, underwriter clicks approve), the NestJS handler calls `sfn.sendTaskSuccess({ taskToken, output })` or `sfn.sendTaskFailure({ taskToken, error, cause })` to resume the state machine.

```typescript
// Example: resuming a KYC document upload from an S3 event handler
await sfn.send(new SendTaskSuccessCommand({
  taskToken: storedToken,
  output: JSON.stringify({ status: 'uploaded', s3Key, documentType }),
}));
```

---

## Retry Strategy

All Lambda task states use exponential backoff for transient Lambda errors:

```json
{
  "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException",
                  "Lambda.SdkClientException", "Lambda.TooManyRequestsException"],
  "IntervalSeconds": 2,
  "MaxAttempts": 3,
  "BackoffRate": 2
}
```

External service failures (credit bureau, sanctions API) use a `Wait` state rather than inline retry to avoid exhausting Lambda concurrency during degraded-service windows.
