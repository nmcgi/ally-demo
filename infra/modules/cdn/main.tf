locals {
  prefix = "${var.project}-${var.env}"
}

# ── S3 buckets ────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "mfe" {
  for_each = toset(["host", "accounts", "loans", "admin"])
  bucket   = "${local.prefix}-mfe-${each.key}"
  tags     = { Name = "${local.prefix}-mfe-${each.key}" }
}

resource "aws_s3_bucket_versioning" "mfe" {
  for_each = aws_s3_bucket.mfe
  bucket   = each.value.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "mfe" {
  for_each = aws_s3_bucket.mfe
  bucket   = each.value.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "mfe" {
  for_each                = aws_s3_bucket.mfe
  bucket                  = each.value.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── S3 bucket for Lambda artifacts ───────────────────────────────────────────

resource "aws_s3_bucket" "artifacts" {
  bucket = "${local.prefix}-lambda-artifacts"
  tags   = { Name = "${local.prefix}-lambda-artifacts" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── CloudFront Origin Access Control ─────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "mfe" {
  name                              = "${local.prefix}-mfe-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policies allowing CloudFront OAC
resource "aws_s3_bucket_policy" "mfe" {
  for_each = aws_s3_bucket.mfe
  bucket   = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFront"
      Effect = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action   = "s3:GetObject"
      Resource = "${each.value.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
        }
      }
    }]
  })
}

# ── CloudFront distribution ───────────────────────────────────────────────────

locals {
  mfe_keys = ["host", "accounts", "loans", "admin"]

  s3_origins = {
    host     = { bucket = aws_s3_bucket.mfe["host"],     path = "" }
    accounts = { bucket = aws_s3_bucket.mfe["accounts"], path = "/accounts" }
    loans    = { bucket = aws_s3_bucket.mfe["loans"],    path = "/loans" }
    admin    = { bucket = aws_s3_bucket.mfe["admin"],    path = "/admin" }
  }
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = var.custom_domain_name != "" ? [var.custom_domain_name] : []

  dynamic "origin" {
    for_each = aws_s3_bucket.mfe
    content {
      domain_name              = origin.value.bucket_regional_domain_name
      origin_id                = "s3-${origin.key}"
      origin_access_control_id = aws_cloudfront_origin_access_control.mfe.id
    }
  }

  # Host shell — default behaviour
  default_cache_behavior {
    target_origin_id       = "s3-host"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # Static assets cached for 1 year; HTML never cached
    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  # MFE remotes — /accounts/*, /loans/*, /admin/*
  dynamic "ordered_cache_behavior" {
    for_each = { for k, v in local.s3_origins : k => v if k != "host" }
    content {
      path_pattern           = "/${ordered_cache_behavior.key}/*"
      target_origin_id       = "s3-${ordered_cache_behavior.key}"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      forwarded_values {
        query_string = false
        cookies { forward = "none" }
      }

      min_ttl     = 0
      default_ttl = 86400
      max_ttl     = 31536000
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == ""
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : "TLSv1"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = { Name = "${local.prefix}-cdn" }
}

# ── CloudFront function — SPA rewrite ─────────────────────────────────────────

resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "${local.prefix}-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite requests without file extension to /index.html"

  code = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri = '/index.html';
      }
      return request;
    }
  EOF
}
