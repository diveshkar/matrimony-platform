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

variable "tags" {
  type    = map(string)
  default = {}
}
