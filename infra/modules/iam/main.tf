locals {
  prefix = "${var.project}-${var.env}"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# ── Lambda execution role ─────────────────────────────────────────────────────

resource "aws_iam_role" "lambda" {
  name               = "${local.prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_inline" {
  name = "${local.prefix}-lambda-inline"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SecretsManager"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [var.db_secret_arn]
      },
      {
        Sid      = "SSMParameters"
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParametersByPath"]
        Resource = ["arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_prefix}/*"]
      },
      {
        Sid      = "StepFunctions"
        Effect   = "Allow"
        Action   = ["states:StartExecution", "states:SendTaskSuccess", "states:SendTaskFailure"]
        Resource = var.step_functions_arns
      },
      {
        # Log groups are pre-created by the lambda module, so the role only
        # needs to write streams/events — scoped to this env's function groups.
        Sid      = "CloudWatchLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.prefix}-*:*"]
      }
    ]
  })
}

# ── Step Functions execution role ─────────────────────────────────────────────

data "aws_iam_policy_document" "sfn_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "step_functions" {
  name               = "${local.prefix}-sfn-role"
  assume_role_policy = data.aws_iam_policy_document.sfn_assume.json
}

resource "aws_iam_role_policy" "sfn_inline" {
  name = "${local.prefix}-sfn-inline"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "InvokeLambda"
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = ["arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.prefix}-*"]
      },
      {
        # Step Functions log-delivery management APIs do not support
        # resource-level permissions, so "*" is required by the service.
        # https://docs.aws.amazon.com/step-functions/latest/dg/cw-logs.html
        Sid    = "CloudWatchLogDelivery"
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery", "logs:GetLogDelivery", "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery", "logs:ListLogDeliveries",
          "logs:PutResourcePolicy", "logs:DescribeResourcePolicies", "logs:DescribeLogGroups"
        ]
        Resource = ["*"]
      },
      {
        # The X-Ray write APIs likewise only support "*" as the resource.
        Sid    = "XRay"
        Effect = "Allow"
        Action = ["xray:PutTraceSegments", "xray:PutTelemetryRecords", "xray:GetSamplingRules",
        "xray:GetSamplingTargets"]
        Resource = ["*"]
      }
    ]
  })
}
