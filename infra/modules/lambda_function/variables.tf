variable "function_name" {
  type = string
}

variable "handler" {
  type    = string
  default = "index.main"
}

variable "runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "memory_size" {
  type    = number
  default = 256
}

variable "timeout" {
  type    = number
  default = 30
}

variable "s3_bucket" {
  type = string
}

variable "s3_key" {
  type = string
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "policy_json" {
  type    = string
  default = ""
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "attach_policy" {
  type    = bool
  default = false
}

variable "layers" {
  type    = list(string)
  default = []
}

variable "source_code_hash" {
  type    = string
  default = ""
}