variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_refresh_secret" {
  type      = string
  sensitive = true
}
