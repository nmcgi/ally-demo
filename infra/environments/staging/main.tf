terraform {
  required_version = ">= 1.7"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = local.project
      Environment = local.env
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project    = "ally-demo"
  env        = "staging"
  prefix     = "${local.project}-${local.env}"
  ssm_prefix = "/${local.project}/${local.env}"
}

module "networking" {
  source             = "../../modules/networking"
  project            = local.project
  env                = local.env
  single_nat_gateway = true
}

module "cdn" {
  source      = "../../modules/cdn"
  project     = local.project
  env         = local.env
  price_class = "PriceClass_100"
}

module "database" {
  source                 = "../../modules/database"
  project                = local.project
  env                    = local.env
  db_subnet_group_name   = module.networking.db_subnet_group_name
  vpc_security_group_ids = [module.networking.rds_sg_id]
  min_acu                = 0.5
  max_acu                = 8
  deletion_protection    = true
  skip_final_snapshot    = false
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${local.ssm_prefix}/jwt-secret"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "jwt_refresh_secret" {
  name  = "${local.ssm_prefix}/jwt-refresh-secret"
  type  = "SecureString"
  value = var.jwt_refresh_secret
}

resource "aws_ssm_parameter" "feature_flags" {
  for_each = {
    "loan-origination" = "true"
    "ach-payments"     = "true"
    "wire-transfers"   = "true"
    "admin-portal"     = "true"
  }
  name  = "${local.ssm_prefix}/feature-flags/${each.key}"
  type  = "String"
  value = each.value
}

module "iam" {
  source               = "../../modules/iam"
  project              = local.project
  env                  = local.env
  db_secret_arn        = module.database.db_secret_arn
  ssm_parameter_prefix = local.ssm_prefix
  step_functions_arns  = [module.step_functions.loan_sfn_arn, module.step_functions.kyc_sfn_arn]
  depends_on           = [module.step_functions]
}

module "step_functions" {
  source              = "../../modules/step-functions"
  project             = local.project
  env                 = local.env
  lambda_function_arn = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${local.prefix}-api"
  loan_asl_template   = "${path.root}/../../../workflows/step-functions/loan-origination.asl.json"
  kyc_asl_template    = "${path.root}/../../../workflows/step-functions/kyc-verification.asl.json"
}

module "lambda" {
  source                     = "../../modules/lambda"
  project                    = local.project
  env                        = local.env
  lambda_role_arn            = module.iam.lambda_role_arn
  subnet_ids                 = module.networking.private_subnet_ids
  security_group_ids         = [module.networking.lambda_sg_id]
  db_secret_arn              = module.database.db_secret_arn
  jwt_secret_ssm_arn         = aws_ssm_parameter.jwt_secret.arn
  jwt_refresh_secret_ssm_arn = aws_ssm_parameter.jwt_refresh_secret.arn
  loan_sfn_arn               = module.step_functions.loan_sfn_arn
  kyc_sfn_arn                = module.step_functions.kyc_sfn_arn
  artifact_bucket            = module.cdn.artifact_bucket_name
  artifact_key               = "api/latest.zip"
  memory_size                = 1024
  timeout                    = 30
  depends_on                 = [module.iam, module.database, module.step_functions]
}

module "api_gateway" {
  source                   = "../../modules/api-gateway"
  project                  = local.project
  env                      = local.env
  lambda_invoke_arn        = module.lambda.api_invoke_arn
  lambda_function_name     = module.lambda.api_function_name
  authorizer_invoke_arn    = module.lambda.authorizer_invoke_arn
  authorizer_function_name = module.lambda.authorizer_function_name
  cors_origins             = var.cors_origins
  custom_domain_name       = var.custom_domain_name
  acm_certificate_arn      = var.acm_certificate_arn
}

data "aws_caller_identity" "current" {}
