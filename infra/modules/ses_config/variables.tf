variable "domain" {
  type        = string
  description = "Domain for SES email sending"
}

variable "from_email" {
  type        = string
  description = "From email address"
}

variable "environment" {
  type    = string
  default = "stage"
}

variable "tags" {
  type    = map(string)
  default = {}
}
