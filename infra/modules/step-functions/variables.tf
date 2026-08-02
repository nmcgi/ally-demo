variable "project" { type = string }
variable "env" { type = string }

variable "lambda_function_arn" { type = string }
variable "loan_asl_template" { type = string }
variable "kyc_asl_template" { type = string }

variable "log_retention_days" {
  type    = number
  default = 30
}
