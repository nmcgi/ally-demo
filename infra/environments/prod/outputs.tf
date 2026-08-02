output "api_endpoint"    { value = module.api_gateway.api_endpoint }
output "cdn_domain"      { value = module.cdn.distribution_domain }
output "artifact_bucket" { value = module.cdn.artifact_bucket_name }
output "db_secret_name"  { value = module.database.db_secret_name }
