# ── CloudWatch Logs Insights saved queries ────────────────────────────────────
#
# The API emits one JSON object per log line (see StructuredLogger), so Logs
# Insights auto-discovers fields like `level`, `correlationId`, `statusCode`,
# `durationMs`, and `event`. These saved queries cover the common debugging
# patterns for this service.

locals {
  api_log_groups = [aws_cloudwatch_log_group.api.name, aws_cloudwatch_log_group.authorizer.name]
}

resource "aws_cloudwatch_query_definition" "recent_errors" {
  name            = "${local.prefix}/recent-errors"
  log_group_names = local.api_log_groups

  query_string = <<-QUERY
    fields @timestamp, correlationId, context, message, stack
    | filter level = "error" or level = "fatal"
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "trace_by_correlation_id" {
  name            = "${local.prefix}/trace-by-correlation-id"
  log_group_names = local.api_log_groups

  # Replace the placeholder with a correlation ID from a client response's
  # x-correlation-id header to reconstruct the full request timeline.
  query_string = <<-QUERY
    fields @timestamp, level, context, message
    | filter correlationId = "REPLACE_WITH_CORRELATION_ID"
    | sort @timestamp asc
  QUERY
}

resource "aws_cloudwatch_query_definition" "slowest_requests" {
  name            = "${local.prefix}/slowest-requests"
  log_group_names = [aws_cloudwatch_log_group.api.name]

  query_string = <<-QUERY
    fields @timestamp, method, path, statusCode, durationMs, correlationId
    | filter event = "request.completed"
    | sort durationMs desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "server_errors_5xx" {
  name            = "${local.prefix}/server-errors-5xx"
  log_group_names = [aws_cloudwatch_log_group.api.name]

  query_string = <<-QUERY
    fields @timestamp, method, path, statusCode, correlationId
    | filter event = "request.completed" and statusCode >= 500
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "request_rate_by_status" {
  name            = "${local.prefix}/request-rate-by-status"
  log_group_names = [aws_cloudwatch_log_group.api.name]

  query_string = <<-QUERY
    fields statusCode
    | filter event = "request.completed"
    | stats count(*) as requests by statusCode
    | sort requests desc
  QUERY
}

resource "aws_cloudwatch_query_definition" "authorizer_denials" {
  name            = "${local.prefix}/authorizer-denials"
  log_group_names = [aws_cloudwatch_log_group.authorizer.name]

  query_string = <<-QUERY
    fields @timestamp, context, message, error
    | filter level = "error"
    | sort @timestamp desc
    | limit 100
  QUERY
}
