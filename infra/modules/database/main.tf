locals {
  prefix   = "${var.project}-${var.env}"
  db_name  = "ally_db"
  db_user  = "ally"
}

resource "random_password" "db" {
  length  = 32
  special = false
}

# ── Secrets Manager ───────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "db" {
  name                    = "${local.prefix}/db/credentials"
  recovery_window_in_days = 7
  tags                    = { Name = "${local.prefix}-db-secret" }
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = local.db_user
    password = random_password.db.result
    dbname   = local.db_name
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    url      = "postgresql://${local.db_user}:${random_password.db.result}@${aws_rds_cluster.main.endpoint}:5432/${local.db_name}"
  })
}

# ── Aurora PostgreSQL Serverless v2 ──────────────────────────────────────────

resource "aws_rds_cluster_parameter_group" "main" {
  name        = "${local.prefix}-pg16"
  family      = "aurora-postgresql16"
  description = "${local.prefix} Aurora PostgreSQL 16"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${local.prefix}-cluster"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = var.engine_version
  database_name           = local.db_name
  master_username         = local.db_user
  master_password         = random_password.db.result
  db_subnet_group_name    = var.db_subnet_group_name
  vpc_security_group_ids  = var.vpc_security_group_ids
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  storage_encrypted       = true
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.prefix}-final-snapshot"

  serverlessv2_scaling_configuration {
    min_capacity = var.min_acu
    max_capacity = var.max_acu
  }

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = { Name = "${local.prefix}-cluster" }
}

resource "aws_rds_cluster_instance" "writer" {
  identifier         = "${local.prefix}-instance-1"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  tags               = { Name = "${local.prefix}-writer" }
}

# ── CloudWatch alarms ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "${local.prefix}-db-connections-high"
  alarm_description   = "Aurora connection count is high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${local.prefix}-db-cpu-high"
  alarm_description   = "Aurora CPU utilisation is high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.cluster_identifier
  }
}
