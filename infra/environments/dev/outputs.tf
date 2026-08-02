output "api_endpoint" {
  description = "HTTP API Gateway invoke URL"
  value       = module.api_gateway.api_endpoint
}

output "cdn_domain" {
  description = "CloudFront distribution domain"
  value       = module.cdn.distribution_domain
}

output "artifact_bucket" {
  description = "S3 bucket for Lambda ZIP artifacts"
  value       = module.cdn.artifact_bucket_name
}

output "db_secret_name" {
  description = "Secrets Manager secret name for DB credentials"
  value       = module.database.db_secret_name
}
