variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "domain_name" {
  type    = string
  default = "theworldtamilmatrimony.com"
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://theworldtamilmatrimony.com", "https://www.theworldtamilmatrimony.com"]
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

variable "twilio_messaging_service_sid" {
  type        = string
  default     = ""
  description = "Twilio Messaging Service SID for SMS OTP (starts with MG...)"
}

variable "twilio_verify_service_sid" {
  type        = string
  default     = ""
  description = "Twilio Verify Service SID for phone verification (starts with VA...)"
}

variable "ses_from_email" {
  type        = string
  default     = ""
  description = "Sender email address (used by Resend currently; will revert to SES if re-enabled)"
}

variable "resend_api_key" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Resend.com API key for sending OTP emails"
}

variable "frontend_url" {
  type        = string
  default     = "https://theworldtamilmatrimony.com"
  description = "Frontend URL for Stripe redirects and CORS"
}

variable "sns_sms_monthly_spend_limit" {
  type        = number
  default     = 50
  description = "Monthly SNS SMS spend limit in USD (default $50 for prod)"
}
