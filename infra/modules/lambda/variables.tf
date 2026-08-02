variable "project" { type = string }
variable "env" { type = string }

variable "lambda_role_arn" { type = string }
variable "subnet_ids" { type = list(string) }
variable "security_group_ids" { type = list(string) }

variable "db_secret_arn" { type = string }
variable "jwt_secret_ssm_arn" { type = string }
variable "jwt_refresh_secret_ssm_arn" { type = string }

variable "loan_sfn_arn" { type = string }
variable "kyc_sfn_arn" { type = string }

variable "artifact_bucket" { type = string }
variable "artifact_key" { type = string }

variable "memory_size" {
  type    = number
  default = 512
}

variable "timeout" {
  type    = number
  default = 30
}

variable "log_retention_days" {
  type    = number
  default = 30
}
