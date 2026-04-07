terraform {
  backend "s3" {
    bucket         = "thamizhakal-matrimony-state"
    key            = "stage/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "matrimony-terraform-locks"
    encrypt        = true
  }
}
