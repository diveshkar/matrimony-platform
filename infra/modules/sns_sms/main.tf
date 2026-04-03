# SNS SMS configuration for OTP delivery
resource "aws_sns_sms_preferences" "this" {
  monthly_spend_limit             = var.monthly_spend_limit
  default_sms_type                = "Transactional"
  delivery_status_iam_role_arn    = aws_iam_role.sns_delivery_status.arn
  delivery_status_success_sampling_rate = 100
}

# IAM role for SNS delivery status logging
data "aws_iam_policy_document" "sns_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "sns_delivery_status" {
  name               = "${var.environment}-sns-delivery-status"
  assume_role_policy = data.aws_iam_policy_document.sns_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy" "sns_logs" {
  name = "sns-cloudwatch-logs"
  role = aws_iam_role.sns_delivery_status.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch alarm for SMS spend
resource "aws_cloudwatch_metric_alarm" "sms_spend" {
  alarm_name          = "${var.environment}-sms-spend-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SMSMonthToDateSpentUSD"
  namespace           = "AWS/SNS"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.spend_alarm_threshold
  alarm_description   = "SMS spending approaching limit"

  tags = var.tags
}
