variable "bucket_name" {
  type        = string
  description = "S3 bucket name"
}

variable "versioning" {
  type        = bool
  default     = false
  description = "Enable versioning"
}

variable "cors_allowed_origins" {
  type        = list(string)
  default     = []
  description = "CORS allowed origins"
}

variable "cors_allowed_methods" {
  type        = list(string)
  default     = ["GET", "PUT", "POST"]
  description = "CORS allowed methods"
}

variable "enable_lifecycle" {
  type        = bool
  default     = true
  description = "Enable lifecycle rules"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Resource tags"
}
