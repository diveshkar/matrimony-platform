# SNS topic for alarm notifications
resource "aws_sns_topic" "alarms" {
  name = "${var.environment}-matrimony-alarms"
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Lambda error alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.environment}-${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Lambda ${each.value} error rate too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = each.value
  }

  tags = var.tags
}

# API Gateway 5xx alarm
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.environment}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = var.api_5xx_threshold
  alarm_description   = "API Gateway 5xx error rate too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiId = var.api_gateway_id
  }

  tags = var.tags
}

# API Gateway latency alarm
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.environment}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p95"
  threshold           = var.api_latency_threshold_ms
  alarm_description   = "API Gateway p95 latency too high"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiId = var.api_gateway_id
  }

  tags = var.tags
}

# DynamoDB throttle alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  for_each = toset(var.dynamodb_table_names)

  alarm_name          = "${var.environment}-${each.value}-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "DynamoDB ${each.value} throttling detected"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TableName = each.value
  }

  tags = var.tags
}
