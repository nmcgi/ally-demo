output "loan_sfn_arn" { value = aws_sfn_state_machine.loan_origination.arn }
output "kyc_sfn_arn" { value = aws_sfn_state_machine.kyc_verification.arn }
