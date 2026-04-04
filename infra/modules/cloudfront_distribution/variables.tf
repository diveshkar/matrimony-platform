variable "distribution_name" {
  type = string
}

variable "s3_bucket_id" {
  type        = string
  description = "S3 bucket ID (for bucket policy)"
}

variable "s3_bucket_arn" {
  type        = string
  description = "S3 bucket ARN (for bucket policy)"
}

variable "s3_bucket_domain_name" {
  type        = string
  description = "S3 bucket regional domain name (origin)"
}

variable "domain_aliases" {
  type        = list(string)
  default     = []
  description = "Custom domain aliases (e.g. ['matrimony.com', 'www.matrimony.com'])"
}

variable "certificate_arn" {
  type        = string
  default     = ""
  description = "ACM certificate ARN for HTTPS. Leave empty for CloudFront default cert."
}

variable "tags" {
  type    = map(string)
  default = {}
}
