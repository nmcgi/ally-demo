terraform {
  backend "s3" {
    bucket         = "ally-demo-tfstate"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ally-demo-tfstate-lock"
    encrypt        = true
  }
}
