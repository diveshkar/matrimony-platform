data "aws_route53_zone" "this" {
  name         = var.domain_name
  private_zone = false
}

# A record — point domain to CloudFront
resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# www redirect
resource "aws_route53_record" "www" {
  count   = var.create_www_record ? 1 : 0
  zone_id = data.aws_route53_zone.this.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# SES DKIM verification records
resource "aws_route53_record" "ses_dkim" {
  count   = length(var.ses_dkim_tokens)
  zone_id = data.aws_route53_zone.this.zone_id
  name    = "${var.ses_dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = ["${var.ses_dkim_tokens[count.index]}.dkim.amazonses.com"]
}

# SES domain verification
resource "aws_route53_record" "ses_verification" {
  count   = var.ses_verification_token != "" ? 1 : 0
  zone_id = data.aws_route53_zone.this.zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 300
  records = [var.ses_verification_token]
}
