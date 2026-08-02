variable "project" { type = string }
variable "env" { type = string }

variable "lambda_invoke_arn" { type = string }
variable "lambda_function_name" { type = string }
variable "authorizer_invoke_arn" { type = string }
variable "authorizer_function_name" { type = string }

variable "cors_origins" {
  type    = list(string)
  default = ["*"]
}

variable "custom_domain_name" {
  type    = string
  default = ""
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "log_retention_days" {
  type    = number
  default = 30
}
