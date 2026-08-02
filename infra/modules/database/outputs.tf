output "cluster_endpoint" { value = aws_rds_cluster.main.endpoint }
output "cluster_reader_endpoint" { value = aws_rds_cluster.main.reader_endpoint }
output "db_secret_arn" { value = aws_secretsmanager_secret.db.arn }
output "db_secret_name" { value = aws_secretsmanager_secret.db.name }
