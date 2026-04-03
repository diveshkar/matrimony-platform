terraform {
  backend "s3" {
    bucket         = "matrimony-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "matrimony-terraform-locks"
    encrypt        = true
  }
}
