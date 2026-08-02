output "api_id"          { value = aws_apigatewayv2_api.main.id }
output "api_endpoint"    { value = aws_apigatewayv2_stage.default.invoke_url }
output "execution_arn"   { value = aws_apigatewayv2_api.main.execution_arn }
output "custom_domain_target" {
  value = length(aws_apigatewayv2_domain_name.main) > 0 ? aws_apigatewayv2_domain_name.main[0].domain_name_configuration[0].target_domain_name : ""
}
