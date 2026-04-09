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

variable "whatsapp_phone_number_id" {
  type        = string
  default     = ""
  description = "Meta WhatsApp Business API phone number ID"
}

variable "whatsapp_api_token" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Meta WhatsApp Business API access token"
}

variable "whatsapp_template_name" {
  type        = string
  default     = "matrimony_otp"
  description = "WhatsApp OTP message template name"
}

variable "twilio_account_sid" {
  type        = string
  default     = ""
  description = "Twilio Account SID for phone number validation"
}

variable "twilio_auth_token" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Twilio Auth Token for phone number validation"
}
