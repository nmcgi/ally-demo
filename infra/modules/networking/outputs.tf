output "vpc_id"              { value = aws_vpc.main.id }
output "public_subnet_ids"  { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
output "lambda_sg_id"       { value = aws_security_group.lambda.id }
output "rds_sg_id"          { value = aws_security_group.rds.id }
output "db_subnet_group_name" {
  value = aws_db_subnet_group.main.name
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.env}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.project}-${var.env}-db-subnet-group" }
}
