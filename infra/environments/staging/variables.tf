variable "aws_region"          { type = string; default = "us-east-1" }
variable "jwt_secret"          { type = string; sensitive = true }
variable "jwt_refresh_secret"  { type = string; sensitive = true }
variable "cors_origins"        { type = list(string); default = ["*"] }
variable "custom_domain_name"  { type = string; default = "" }
variable "acm_certificate_arn" { type = string; default = "" }
