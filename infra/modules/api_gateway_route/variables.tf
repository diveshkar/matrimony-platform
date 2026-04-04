variable "api_id" {
  type = string
}

variable "api_execution_arn" {
  type = string
}

variable "route_key" {
  type        = string
  description = "e.g. GET /health, POST /auth/start"
}

variable "lambda_invoke_arn" {
  type = string
}

variable "lambda_function_name" {
  type = string
}
