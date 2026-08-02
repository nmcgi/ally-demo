variable "project" { type = string }
variable "env"     { type = string }

variable "custom_domain_name" {
  type    = string
  default = ""
}

variable "acm_certificate_arn" {
  description = "ACM cert ARN in us-east-1 (required for CloudFront)"
  type        = string
  default     = ""
}

variable "price_class" {
  type    = string
  default = "PriceClass_100"
}
