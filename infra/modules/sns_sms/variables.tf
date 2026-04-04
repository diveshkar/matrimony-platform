variable "environment" {
  type    = string
  default = "stage"
}

variable "monthly_spend_limit" {
  type        = number
  default     = 10
  description = "Monthly SMS spend limit in USD"
}

variable "spend_alarm_threshold" {
  type        = number
  default     = 8
  description = "Alarm when SMS spend exceeds this amount in USD"
}

variable "tags" {
  type    = map(string)
  default = {}
}
