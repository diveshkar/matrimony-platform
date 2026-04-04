output "api_endpoint" {
  value = module.api_gateway.api_endpoint
}

output "frontend_bucket" {
  value = module.s3_frontend.bucket_id
}

output "media_bucket" {
  value = module.s3_media.bucket_id
}

output "dynamodb_core_table" {
  value = module.dynamodb_core.table_name
}

output "dynamodb_messages_table" {
  value = module.dynamodb_messages.table_name
}

output "dynamodb_discovery_table" {
  value = module.dynamodb_discovery.table_name
}

output "dynamodb_events_table" {
  value = module.dynamodb_events.table_name
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "cloudfront_distribution_id" {
  value = module.cloudfront_frontend.distribution_id
}

output "cloudfront_domain" {
  value = module.cloudfront_frontend.distribution_domain_name
}
