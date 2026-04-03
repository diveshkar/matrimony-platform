locals {
  prefix = "matrimony-${var.environment}"
  common_tags = {
    Project     = "matrimony"
    Environment = var.environment
  }
}

# ──────────────────────────────────────────────
# DynamoDB Tables
# ──────────────────────────────────────────────

module "dynamodb_core" {
  source     = "../../modules/dynamodb_table"
  table_name = "matrimony_core_${var.environment}"

  additional_attributes = [
    { name = "GSI1PK", type = "S" },
    { name = "GSI1SK", type = "S" },
  ]

  global_secondary_indexes = [
    {
      name      = "GSI1"
      hash_key  = "GSI1PK"
      range_key = "GSI1SK"
    },
  ]

  point_in_time_recovery = true
  tags                   = local.common_tags
}

module "dynamodb_messages" {
  source                 = "../../modules/dynamodb_table"
  table_name             = "matrimony_messages_${var.environment}"
  point_in_time_recovery = true
  tags                   = local.common_tags
}

module "dynamodb_discovery" {
  source     = "../../modules/dynamodb_table"
  table_name = "matrimony_discovery_${var.environment}"

  additional_attributes = [
    { name = "GSI1PK", type = "S" },
    { name = "GSI1SK", type = "S" },
    { name = "GSI2PK", type = "S" },
    { name = "GSI2SK", type = "S" },
  ]

  global_secondary_indexes = [
    {
      name      = "GSI1"
      hash_key  = "GSI1PK"
      range_key = "GSI1SK"
    },
    {
      name      = "GSI2"
      hash_key  = "GSI2PK"
      range_key = "GSI2SK"
    },
  ]

  point_in_time_recovery = true
  tags                   = local.common_tags
}

module "dynamodb_events" {
  source                 = "../../modules/dynamodb_table"
  table_name             = "matrimony_events_${var.environment}"
  point_in_time_recovery = true
  tags                   = local.common_tags
}

# ──────────────────────────────────────────────
# S3 Buckets
# ──────────────────────────────────────────────

module "s3_frontend" {
  source      = "../../modules/s3_bucket"
  bucket_name = "${local.prefix}-frontend"
  tags        = local.common_tags
}

module "s3_media" {
  source               = "../../modules/s3_bucket"
  bucket_name          = "${local.prefix}-media"
  cors_allowed_origins = var.cors_allowed_origins
  cors_allowed_methods = ["GET", "PUT"]
  versioning           = true
  tags                 = local.common_tags
}

# ──────────────────────────────────────────────
# API Gateway
# ──────────────────────────────────────────────

module "api_gateway" {
  source               = "../../modules/api_gateway_http"
  api_name             = "${local.prefix}-api"
  cors_allowed_origins = var.cors_allowed_origins
  tags                 = local.common_tags
}

# ──────────────────────────────────────────────
# Lambda - Health Check
# ──────────────────────────────────────────────

module "lambda_health" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-health"
  handler       = "health-check.main"
  memory_size   = 128
  timeout       = 10

  environment_variables = {
    ENVIRONMENT = var.environment
    AWS_REGION  = var.aws_region
  }

  tags = local.common_tags
}
