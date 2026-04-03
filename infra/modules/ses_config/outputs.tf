output "domain_identity_arn" {
  value = aws_ses_domain_identity.this.arn
}

output "configuration_set_name" {
  value = aws_ses_configuration_set.this.name
}
