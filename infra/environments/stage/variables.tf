variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
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
  type        = list(string)
  default     = ["https://stage.matrimony.com", "http://localhost:3000"]
  description = "After first deploy, add your CloudFront URL (e.g. https://d13g8w11hvs9mg.cloudfront.net) to terraform.tfvars"
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

variable "ses_from_email" {
  type    = string
  default = ""
}

variable "twilio_account_sid" {
  type        = string
  default     = ""
  description = "Twilio Account SID for phone validation + WhatsApp OTP"
}

variable "twilio_auth_token" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Twilio Auth Token for phone validation + WhatsApp OTP"
}

variable "twilio_whatsapp_from" {
  type        = string
  default     = "whatsapp:+14155238886"
  description = "Twilio WhatsApp sender number (sandbox or production)"
}

variable "frontend_url" {
  type        = string
  default     = "https://stage.matrimony.com"
  description = "Frontend URL for Stripe redirects and CORS"
}

variable "sns_sms_monthly_spend_limit" {
  type        = number
  default     = 10
  description = "Monthly SNS SMS spend limit in USD (default $10 for stage)"
}
