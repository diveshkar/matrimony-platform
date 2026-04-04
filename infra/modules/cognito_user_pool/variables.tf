variable "pool_name" {
  type        = string
  description = "Cognito User Pool name"
}

variable "callback_urls" {
  type        = list(string)
  default     = ["http://localhost:3000"]
  description = "Allowed callback URLs"
}

variable "logout_urls" {
  type        = list(string)
  default     = ["http://localhost:3000"]
  description = "Allowed logout URLs"
}

variable "tags" {
  type    = map(string)
  default = {}
}
