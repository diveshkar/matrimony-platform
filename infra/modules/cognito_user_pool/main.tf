resource "aws_cognito_user_pool" "this" {
  name = var.pool_name

  # Username configuration — login via phone or email
  username_attributes      = ["phone_number", "email"]
  auto_verified_attributes = ["phone_number", "email"]

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # MFA — optional for MVP, can enable later
  mfa_configuration = "OFF"

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_email"
      priority = 2
    }
  }

  # Schema attributes
  schema {
    name                = "phone_number"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  # Verification message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your Matrimony verification code"
    email_message        = "Your verification code is {####}. It expires in 5 minutes."
    sms_message          = "Your Matrimony code is {####}. It expires in 5 minutes."
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }

  tags = merge(var.tags, {
    Name = var.pool_name
  })
}

# App client — used by frontend
resource "aws_cognito_user_pool_client" "this" {
  name         = "${var.pool_name}-client"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  supported_identity_providers = ["COGNITO"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["phone", "email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true

  access_token_validity  = 60 # minutes
  id_token_validity      = 60 # minutes
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"
}
