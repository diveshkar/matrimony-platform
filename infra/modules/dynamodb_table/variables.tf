variable "table_name" {
  type        = string
  description = "DynamoDB table name"
}

variable "additional_attributes" {
  type = list(object({
    name = string
    type = string
  }))
  default     = []
  description = "Additional attributes for GSIs"
}

variable "global_secondary_indexes" {
  type = list(object({
    name            = string
    hash_key        = string
    range_key       = optional(string)
    projection_type = optional(string, "ALL")
  }))
  default     = []
  description = "Global secondary indexes"
}

variable "ttl_attribute" {
  type        = string
  default     = "ttl"
  description = "TTL attribute name"
}

variable "ttl_enabled" {
  type        = bool
  default     = true
  description = "Enable TTL"
}

variable "point_in_time_recovery" {
  type        = bool
  default     = true
  description = "Enable point-in-time recovery"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Resource tags"
}
