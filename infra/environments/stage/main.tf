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

  tags = local.common_tags
}

module "dynamodb_messages" {
  source     = "../../modules/dynamodb_table"
  table_name = "matrimony_messages_${var.environment}"
  tags       = local.common_tags
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

  tags = local.common_tags
}

module "dynamodb_events" {
  source     = "../../modules/dynamodb_table"
  table_name = "matrimony_events_${var.environment}"
  tags       = local.common_tags
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

# ──────────────────────────────────────────────
# Cognito (Phase 1B - Auth)
# ──────────────────────────────────────────────

module "cognito" {
  source    = "../../modules/cognito_user_pool"
  pool_name = "${local.prefix}-users"

  callback_urls = ["https://${var.domain_name}", "http://localhost:3000"]
  logout_urls   = ["https://${var.domain_name}", "http://localhost:3000"]

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# SES (Phase 1B - Email OTP)
# ──────────────────────────────────────────────

module "ses" {
  source      = "../../modules/ses_config"
  domain      = var.domain_name
  from_email  = "noreply@${var.domain_name}"
  environment = var.environment
  tags        = local.common_tags
}

# ──────────────────────────────────────────────
# SNS SMS (Phase 1B - Phone OTP)
# ──────────────────────────────────────────────

module "sns_sms" {
  source              = "../../modules/sns_sms"
  environment         = var.environment
  monthly_spend_limit = 10
  tags                = local.common_tags
}

# ──────────────────────────────────────────────
# CloudFront (Frontend CDN)
# ──────────────────────────────────────────────

module "cloudfront_frontend" {
  source = "../../modules/cloudfront_distribution"

  distribution_name     = "${local.prefix}-frontend-cdn"
  s3_bucket_id          = module.s3_frontend.bucket_id
  s3_bucket_arn         = module.s3_frontend.bucket_arn
  s3_bucket_domain_name = module.s3_frontend.bucket_domain_name
  domain_aliases        = [var.domain_name]
  certificate_arn       = var.certificate_arn

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# CloudFront (Media CDN - Phase 1D Photos)
# ──────────────────────────────────────────────

module "cloudfront_media" {
  source = "../../modules/cloudfront_distribution"

  distribution_name     = "${local.prefix}-media-cdn"
  s3_bucket_id          = module.s3_media.bucket_id
  s3_bucket_arn         = module.s3_media.bucket_arn
  s3_bucket_domain_name = module.s3_media.bucket_domain_name
  domain_aliases        = ["media.${var.domain_name}"]
  certificate_arn       = var.certificate_arn

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# CloudWatch Alarms (Monitoring)
# ──────────────────────────────────────────────

module "alarms" {
  source      = "../../modules/cloudwatch_alarms"
  environment = var.environment
  alarm_email = var.alarm_email

  api_gateway_id = module.api_gateway.api_id

  lambda_function_names = [
    module.lambda_health.function_name,
  ]

  dynamodb_table_names = [
    module.dynamodb_core.table_name,
    module.dynamodb_messages.table_name,
    module.dynamodb_discovery.table_name,
    module.dynamodb_events.table_name,
  ]

  tags = local.common_tags
}
