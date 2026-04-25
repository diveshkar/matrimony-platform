variable "api_name" {
  type = string
}

variable "stage_name" {
  type    = string
  default = "$default"
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["*"]
}

variable "throttling_burst_limit" {
  type        = number
  default     = 100
  description = "Maximum burst requests across all routes"
}

variable "throttling_rate_limit" {
  type        = number
  default     = 50
  description = "Steady-state requests per second across all routes"
}

variable "tags" {
  type    = map(string)
  default = {}
}
