locals {
  prefix = "${var.project}-${var.env}"
}

# ── HTTP API ──────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Requested-With"]
    max_age       = 3600
  }

  tags = { Name = "${local.prefix}-api" }
}

# ── CloudWatch log group ──────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${local.prefix}"
  retention_in_days = var.log_retention_days
}

# ── Stage ─────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      requestTime      = "$context.requestTime"
      httpMethod       = "$context.httpMethod"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      protocol         = "$context.protocol"
      responseLength   = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  default_route_settings {
    throttling_burst_limit = 500
    throttling_rate_limit  = 1000
  }
}

# ── Lambda authorizer ─────────────────────────────────────────────────────────

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id                            = aws_apigatewayv2_api.main.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = var.authorizer_invoke_arn
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${local.prefix}-authorizer"
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true

  # Cache authorizer results for 5 minutes
  authorizer_result_ttl_in_seconds = 300
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = var.authorizer_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*"
}

# ── Lambda integration ────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*"
}

# ── Routes ───────────────────────────────────────────────────────────────────

# Public routes (no auth)
resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "auth_refresh" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/refresh"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Catch-all authenticated route
resource "aws_apigatewayv2_route" "proxy" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "CUSTOM"
}

# ── Custom domain (optional) ──────────────────────────────────────────────────

resource "aws_apigatewayv2_domain_name" "main" {
  count       = var.custom_domain_name != "" ? 1 : 0
  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "main" {
  count       = var.custom_domain_name != "" ? 1 : 0
  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.main[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

# ── CloudWatch alarms ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${local.prefix}-apigw-5xx"
  alarm_description   = "API Gateway 5xx error rate elevated"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"
  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.prefix}-apigw-latency-high"
  alarm_description   = "API Gateway p99 latency is high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  extended_statistic  = "p99"
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  threshold           = 5000
  dimensions = {
    ApiId = aws_apigatewayv2_api.main.id
  }
}
