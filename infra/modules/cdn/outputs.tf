output "distribution_id" { value = aws_cloudfront_distribution.main.id }
output "distribution_domain" { value = aws_cloudfront_distribution.main.domain_name }
output "artifact_bucket_name" { value = aws_s3_bucket.artifacts.id }
output "artifact_bucket_arn" { value = aws_s3_bucket.artifacts.arn }
output "mfe_bucket_names" {
  value = { for k, v in aws_s3_bucket.mfe : k => v.id }
}
