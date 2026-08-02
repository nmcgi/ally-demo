variable "project" { type = string }
variable "env" { type = string }

variable "db_secret_arn" { type = string }
variable "step_functions_arns" { type = list(string) }
variable "ssm_parameter_prefix" { type = string }
