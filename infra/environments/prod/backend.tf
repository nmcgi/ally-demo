terraform {
  backend "s3" {
    bucket         = "ally-demo-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ally-demo-tfstate-lock"
    encrypt        = true
  }
}
