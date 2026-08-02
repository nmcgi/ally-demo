output "api_function_name" { value = aws_lambda_function.api.function_name }
output "api_function_arn" { value = aws_lambda_function.api.arn }
output "api_invoke_arn" { value = aws_lambda_function.api.invoke_arn }
output "authorizer_function_name" { value = aws_lambda_function.authorizer.function_name }
output "authorizer_function_arn" { value = aws_lambda_function.authorizer.arn }
output "authorizer_invoke_arn" { value = aws_lambda_function.authorizer.invoke_arn }
