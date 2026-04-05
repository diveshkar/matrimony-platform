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
  type        = string
  default     = ""
  sensitive   = true
  description = "Stripe secret key"
}

variable "stripe_webhook_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Stripe webhook signing secret"
}
