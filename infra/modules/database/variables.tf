variable "project" { type = string }
variable "env" { type = string }

variable "db_subnet_group_name" { type = string }
variable "vpc_security_group_ids" { type = list(string) }

variable "engine_version" {
  type    = string
  default = "16.2"
}

variable "min_acu" {
  type    = number
  default = 0.5
}

variable "max_acu" {
  type    = number
  default = 4
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "skip_final_snapshot" {
  type    = bool
  default = false
}
