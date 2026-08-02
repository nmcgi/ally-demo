locals {
  prefix = "${var.project}-${var.env}"

  functions = ["api"]

  vpc_config = {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  common_env = {
    NODE_ENV                = var.env == "prod" ? "production" : "development"
    DB_SECRET_ARN           = var.db_secret_arn
    JWT_SECRET_SSM          = var.jwt_secret_ssm_arn
    JWT_REFRESH_SECRET_SSM  = var.jwt_refresh_secret_ssm_arn
    STEP_FUNCTIONS_LOAN_ARN = var.loan_sfn_arn
    STEP_FUNCTIONS_KYC_ARN  = var.kyc_sfn_arn
    LOG_LEVEL               = var.env == "prod" ? "warn" : "debug"
  }
}

# ── CloudWatch log group ──────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.prefix}-api"
  retention_in_days = var.log_retention_days
}

# ── Lambda function ───────────────────────────────────────────────────────────

resource "aws_lambda_function" "api" {
  function_name = "${local.prefix}-api"
  role          = var.lambda_role_arn
  handler       = "dist/handler.handler"
  runtime       = "nodejs22.x"
  memory_size   = var.memory_size
  timeout       = var.timeout

  s3_bucket = var.artifact_bucket
  s3_key    = var.artifact_key

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = local.common_env
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.api]

  tags = { Name = "${local.prefix}-api" }
}

# ── Lambda authorizer ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "authorizer" {
  name              = "/aws/lambda/${local.prefix}-authorizer"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "authorizer" {
  function_name = "${local.prefix}-authorizer"
  role          = var.lambda_role_arn
  handler       = "dist/authorizer.handler"
  runtime       = "nodejs22.x"
  memory_size   = 256
  timeout       = 10

  s3_bucket = var.artifact_bucket
  s3_key    = var.artifact_key

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      JWT_SECRET_SSM = var.jwt_secret_ssm_arn
      NODE_ENV       = local.common_env.NODE_ENV
    }
  }

  depends_on = [aws_cloudwatch_log_group.authorizer]

  tags = { Name = "${local.prefix}-authorizer" }
}

# ── CloudWatch alarms ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${local.prefix}-lambda-api-errors"
  alarm_description   = "Lambda API error rate is elevated"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_throttles" {
  alarm_name          = "${local.prefix}-lambda-api-throttles"
  alarm_description   = "Lambda API throttles detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_duration" {
  alarm_name          = "${local.prefix}-lambda-api-duration-high"
  alarm_description   = "Lambda p99 duration approaching timeout"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  extended_statistic  = "p99"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  threshold           = var.timeout * 1000 * 0.8
  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}
