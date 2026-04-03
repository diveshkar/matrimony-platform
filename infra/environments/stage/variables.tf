variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "stage"
}

variable "domain_name" {
  type    = string
  default = "stage.matrimony.com"
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://stage.matrimony.com", "http://localhost:3000"]
}
