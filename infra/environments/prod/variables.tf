variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "domain_name" {
  type    = string
  default = "matrimony.com"
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://matrimony.com", "https://www.matrimony.com"]
}
