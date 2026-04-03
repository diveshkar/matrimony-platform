variable "domain_name" {
  type        = string
  description = "Root domain name (e.g. matrimony.com)"
}

variable "cloudfront_domain_name" {
  type        = string
  description = "CloudFront distribution domain name"
}

variable "cloudfront_hosted_zone_id" {
  type        = string
  default     = "Z2FDTNDATAQYW2"
  description = "CloudFront hosted zone ID (always Z2FDTNDATAQYW2)"
}

variable "create_www_record" {
  type    = bool
  default = true
}

variable "ses_dkim_tokens" {
  type        = list(string)
  default     = []
  description = "SES DKIM tokens for DNS verification"
}

variable "ses_verification_token" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
