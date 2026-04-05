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

variable "certificate_arn" {
  type        = string
  default     = ""
  description = "ACM certificate ARN for HTTPS"
}

variable "alarm_email" {
  type        = string
  default     = ""
  description = "Email for CloudWatch alarm notifications"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "Secret key for signing JWT tokens"
}

variable "stripe_secret_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  default   = ""
  sensitive = true
}
