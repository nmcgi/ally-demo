variable "project" { type = string }
variable "env"     { type = string }

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "azs" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "single_nat_gateway" {
  description = "Use one NAT GW for all AZs (cost-saving for non-prod)"
  type        = bool
  default     = false
}
