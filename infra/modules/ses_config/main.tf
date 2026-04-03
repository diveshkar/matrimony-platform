resource "aws_ses_domain_identity" "this" {
  domain = var.domain
}

resource "aws_ses_domain_dkim" "this" {
  domain = aws_ses_domain_identity.this.domain
}

resource "aws_ses_email_identity" "from" {
  email = var.from_email
}

# DKIM verification DNS records — add these to Route53 or your DNS provider
output "dkim_tokens" {
  value       = aws_ses_domain_dkim.this.dkim_tokens
  description = "Add these as CNAME records in DNS for DKIM verification"
}

# SES sending configuration
resource "aws_ses_configuration_set" "this" {
  name = "${var.environment}-matrimony-ses"

  delivery_options {
    tls_policy = "Require"
  }
}

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-destination"
  configuration_set_name = aws_ses_configuration_set.this.name
  enabled                = true

  matching_types = [
    "send",
    "reject",
    "bounce",
    "complaint",
    "delivery",
  ]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "ses-event"
    value_source   = "messageTag"
  }
}
