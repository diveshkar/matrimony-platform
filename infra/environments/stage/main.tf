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
# Shared Lambda Environment Variables
# ──────────────────────────────────────────────

locals {
  lambda_env = {
    ENVIRONMENT              = var.environment
    JWT_SECRET               = var.jwt_secret
    SES_FROM_EMAIL           = var.ses_from_email
    S3_MEDIA_BUCKET          = module.s3_media.bucket_id
    CORS_ALLOWED_ORIGINS     = join(",", var.cors_allowed_origins)
    STRIPE_SECRET_KEY        = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET    = var.stripe_webhook_secret
    WHATSAPP_PHONE_NUMBER_ID = var.whatsapp_phone_number_id
    WHATSAPP_API_TOKEN       = var.whatsapp_api_token
    WHATSAPP_TEMPLATE_NAME   = var.whatsapp_template_name
    TWILIO_ACCOUNT_SID       = var.twilio_account_sid
    TWILIO_AUTH_TOKEN        = var.twilio_auth_token
    FRONTEND_URL             = "https://${var.domain_name}"
  }

  dynamodb_arns = [
    module.dynamodb_core.table_arn,
    "${module.dynamodb_core.table_arn}/index/*",
    module.dynamodb_messages.table_arn,
    "${module.dynamodb_messages.table_arn}/index/*",
    module.dynamodb_discovery.table_arn,
    "${module.dynamodb_discovery.table_arn}/index/*",
    module.dynamodb_events.table_arn,
    "${module.dynamodb_events.table_arn}/index/*",
  ]
}

# ──────────────────────────────────────────────
# IAM Policy - DynamoDB + S3 + SES + SNS access
# ──────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_service" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = local.dynamodb_arns
  }

  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${module.s3_media.bucket_arn}/*"]
  }

  statement {
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }

  statement {
    actions   = ["sns:Publish"]
    resources = ["*"]
  }
}

# ──────────────────────────────────────────────
# Lambda Functions (8 services + health)
# ──────────────────────────────────────────────

module "lambda_health" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-health"
  handler       = "index.main"
  memory_size   = 128
  timeout       = 10
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/health.zip"

  environment_variables = local.lambda_env
  tags                  = local.common_tags
}

module "lambda_auth" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-auth"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/auth.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_profile" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-profile"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/profile.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_uploads" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-uploads"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/uploads.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_discovery" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-discovery"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/discovery.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_interests" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-interests"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/interests.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_chat" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-chat"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/chat.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_subscriptions" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-subscriptions"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/subscriptions.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

module "lambda_safety" {
  source        = "../../modules/lambda_function"
  function_name = "${local.prefix}-safety"
  handler       = "index.main"
  memory_size   = 256
  timeout       = 30
  s3_bucket     = "thamizhakal-matrimony-state"
  s3_key        = "lambda-packages/safety.zip"

  environment_variables = local.lambda_env
  policy_json           = data.aws_iam_policy_document.lambda_service.json
  attach_policy         = true
  tags                  = local.common_tags
}

# ──────────────────────────────────────────────
# API Gateway Routes (36 endpoints)
# ──────────────────────────────────────────────

module "route_health" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /health"
  lambda_invoke_arn    = module.lambda_health.invoke_arn
  lambda_function_name = module.lambda_health.function_name
}

# Auth routes
module "route_auth_start" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /auth/start"
  lambda_invoke_arn    = module.lambda_auth.invoke_arn
  lambda_function_name = module.lambda_auth.function_name
}

module "route_auth_verify" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /auth/verify"
  lambda_invoke_arn    = module.lambda_auth.invoke_arn
  lambda_function_name = module.lambda_auth.function_name
}

module "route_auth_refresh" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /auth/refresh"
  lambda_invoke_arn    = module.lambda_auth.invoke_arn
  lambda_function_name = module.lambda_auth.function_name
}

module "route_auth_logout" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /auth/logout"
  lambda_invoke_arn    = module.lambda_auth.invoke_arn
  lambda_function_name = module.lambda_auth.function_name
}

module "route_auth_me" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /auth/me"
  lambda_invoke_arn    = module.lambda_auth.invoke_arn
  lambda_function_name = module.lambda_auth.function_name
}

# Profile routes
module "route_profile_create" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /profiles"
  lambda_invoke_arn    = module.lambda_profile.invoke_arn
  lambda_function_name = module.lambda_profile.function_name
}

module "route_profile_me_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /me"
  lambda_invoke_arn    = module.lambda_profile.invoke_arn
  lambda_function_name = module.lambda_profile.function_name
}

module "route_profile_me_patch" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "PATCH /me"
  lambda_invoke_arn    = module.lambda_profile.invoke_arn
  lambda_function_name = module.lambda_profile.function_name
}

module "route_profile_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /profiles/{id}"
  lambda_invoke_arn    = module.lambda_profile.invoke_arn
  lambda_function_name = module.lambda_profile.function_name
}

module "route_boost_post" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /me/boost"
  lambda_invoke_arn    = module.lambda_profile.invoke_arn
  lambda_function_name = module.lambda_profile.function_name
}

module "route_boost_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /me/boost"
  lambda_invoke_arn    = module.lambda_profile.invoke_arn
  lambda_function_name = module.lambda_profile.function_name
}

# Upload routes
module "route_upload_url" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /uploads/photo-url"
  lambda_invoke_arn    = module.lambda_uploads.invoke_arn
  lambda_function_name = module.lambda_uploads.function_name
}

module "route_upload_confirm" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /uploads/photo-confirm"
  lambda_invoke_arn    = module.lambda_uploads.invoke_arn
  lambda_function_name = module.lambda_uploads.function_name
}

module "route_upload_list" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /uploads/photos"
  lambda_invoke_arn    = module.lambda_uploads.invoke_arn
  lambda_function_name = module.lambda_uploads.function_name
}

module "route_upload_update" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "PATCH /uploads/photos/{photoId}"
  lambda_invoke_arn    = module.lambda_uploads.invoke_arn
  lambda_function_name = module.lambda_uploads.function_name
}

module "route_upload_delete" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "DELETE /uploads/photos/{photoId}"
  lambda_invoke_arn    = module.lambda_uploads.invoke_arn
  lambda_function_name = module.lambda_uploads.function_name
}

# Discovery routes
module "route_discover" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /discover"
  lambda_invoke_arn    = module.lambda_discovery.invoke_arn
  lambda_function_name = module.lambda_discovery.function_name
}

module "route_discover_search" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /discover/search"
  lambda_invoke_arn    = module.lambda_discovery.invoke_arn
  lambda_function_name = module.lambda_discovery.function_name
}

# Interest routes
module "route_interest_send" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /interests"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

module "route_interest_respond" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /interests/{senderId}/respond"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

module "route_interest_withdraw" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "DELETE /interests/{receiverId}"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

module "route_interest_list" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /interests"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

module "route_shortlist_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /shortlist"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

module "route_shortlist_add" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /shortlist"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

module "route_shortlist_delete" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "DELETE /shortlist/{userId}"
  lambda_invoke_arn    = module.lambda_interests.invoke_arn
  lambda_function_name = module.lambda_interests.function_name
}

# Chat routes
module "route_chat_list" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /chats"
  lambda_invoke_arn    = module.lambda_chat.invoke_arn
  lambda_function_name = module.lambda_chat.function_name
}

module "route_chat_create" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /chats"
  lambda_invoke_arn    = module.lambda_chat.invoke_arn
  lambda_function_name = module.lambda_chat.function_name
}

module "route_chat_messages" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /chats/{conversationId}/messages"
  lambda_invoke_arn    = module.lambda_chat.invoke_arn
  lambda_function_name = module.lambda_chat.function_name
}

module "route_chat_send" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /chats/{conversationId}/messages"
  lambda_invoke_arn    = module.lambda_chat.invoke_arn
  lambda_function_name = module.lambda_chat.function_name
}

# Subscription routes
module "route_sub_plans" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /subscriptions/plans"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

module "route_sub_checkout" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /subscriptions/checkout"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

module "route_sub_webhook" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /subscriptions/webhook"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

module "route_sub_me" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /subscriptions/me"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

module "route_sub_verify" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /subscriptions/verify-session"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

module "route_sub_usage" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /subscriptions/usage"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

module "route_sub_cancel" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /subscriptions/cancel"
  lambda_invoke_arn    = module.lambda_subscriptions.invoke_arn
  lambda_function_name = module.lambda_subscriptions.function_name
}

# Safety routes
module "route_blocks_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /blocks"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_blocks_post" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /blocks"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_blocks_delete" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "DELETE /blocks/{userId}"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_reports" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /reports"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_who_viewed" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /who-viewed-me"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_notifications_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /notifications"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_notifications_patch" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "PATCH /notifications"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_privacy_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /settings/privacy"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_privacy_patch" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "PATCH /settings/privacy"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_success_stories" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /success-stories"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_my_story_get" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /my-story"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_my_story_matches" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "GET /my-story/matches"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_my_story_post" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /my-story"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_my_story_approve" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "POST /my-story/approve"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

module "route_my_story_delete" {
  source               = "../../modules/api_gateway_route"
  api_id               = module.api_gateway.api_id
  api_execution_arn    = module.api_gateway.execution_arn
  route_key            = "DELETE /my-story"
  lambda_invoke_arn    = module.lambda_safety.invoke_arn
  lambda_function_name = module.lambda_safety.function_name
}

# ──────────────────────────────────────────────
# SES (Email OTP)
# ──────────────────────────────────────────────

module "ses" {
  source      = "../../modules/ses_config"
  domain      = var.domain_name
  from_email  = "noreply@${var.domain_name}"
  environment = var.environment
  tags        = local.common_tags
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
  domain_aliases        = []
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
  domain_aliases        = []
  certificate_arn       = var.certificate_arn

  tags = local.common_tags
}

# ──────────────────────────────────────────────
