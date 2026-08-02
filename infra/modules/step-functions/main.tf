locals {
  prefix = "${var.project}-${var.env}"
}

# ── CloudWatch log groups ─────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "loan_sfn" {
  name              = "/aws/states/${local.prefix}-loan-origination"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "kyc_sfn" {
  name              = "/aws/states/${local.prefix}-kyc-verification"
  retention_in_days = var.log_retention_days
}

# ── IAM role (passed in from iam module) ─────────────────────────────────────

data "aws_iam_role" "sfn" {
  name = "${local.prefix}-sfn-role"
}

# ── State machines ────────────────────────────────────────────────────────────

resource "aws_sfn_state_machine" "loan_origination" {
  name     = "${local.prefix}-loan-origination"
  role_arn = data.aws_iam_role.sfn.arn
  definition = templatefile(var.loan_asl_template, {
    FunctionArn = var.lambda_function_arn
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.loan_sfn.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tracing_configuration {
    enabled = true
  }

  tags = { Name = "${local.prefix}-loan-origination" }
}

resource "aws_sfn_state_machine" "kyc_verification" {
  name     = "${local.prefix}-kyc-verification"
  role_arn = data.aws_iam_role.sfn.arn
  definition = templatefile(var.kyc_asl_template, {
    FunctionArn = var.lambda_function_arn
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.kyc_sfn.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tracing_configuration {
    enabled = true
  }

  tags = { Name = "${local.prefix}-kyc-verification" }
}

# ── CloudWatch alarms ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "loan_sfn_failures" {
  alarm_name          = "${local.prefix}-sfn-loan-failures"
  alarm_description   = "Loan origination Step Functions executions failing"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  dimensions = {
    StateMachineArn = aws_sfn_state_machine.loan_origination.id
  }
}

resource "aws_cloudwatch_metric_alarm" "kyc_sfn_failures" {
  alarm_name          = "${local.prefix}-sfn-kyc-failures"
  alarm_description   = "KYC verification Step Functions executions failing"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  dimensions = {
    StateMachineArn = aws_sfn_state_machine.kyc_verification.id
  }
}
