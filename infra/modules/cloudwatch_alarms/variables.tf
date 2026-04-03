variable "environment" {
  type = string
}

variable "alarm_email" {
  type        = string
  default     = ""
  description = "Email to receive alarm notifications"
}

variable "lambda_function_names" {
  type        = list(string)
  default     = []
  description = "Lambda function names to monitor"
}

variable "lambda_error_threshold" {
  type    = number
  default = 5
}

variable "api_gateway_id" {
  type        = string
  description = "API Gateway ID to monitor"
}

variable "api_5xx_threshold" {
  type    = number
  default = 10
}

variable "api_latency_threshold_ms" {
  type    = number
  default = 3000
}

variable "dynamodb_table_names" {
  type        = list(string)
  default     = []
  description = "DynamoDB table names to monitor"
}

variable "tags" {
  type    = map(string)
  default = {}
}
