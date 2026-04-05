resource "aws_lambda_layer_version" "this" {
  layer_name          = var.layer_name
  s3_bucket           = var.s3_bucket
  s3_key              = var.s3_key
  compatible_runtimes = ["nodejs20.x"]
}

output "layer_arn" {
  value = aws_lambda_layer_version.this.arn
}