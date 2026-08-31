# RDS for PostgreSQL - single-AZ db.t4g.micro ("Balanced" tier). Storage
# encrypted at rest, not publicly accessible (reachable only from
# aws_security_group.app - see security_groups.tf), automated daily
# backups with 7-day retention. This replaces docker/backup.sh's manual
# pg_dump as the production backup mechanism - that script stays exactly
# as-is for local dev, where it's still useful.

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
}

# Generated once, never typed by a human, never committed anywhere -
# stored only in Terraform state (in the encrypted S3 backend) and, via
# ssm.tf, as an encrypted SSM parameter the app instance reads at boot.
resource "random_password" "db" {
  length  = 32
  special = false # Postgres connection strings/URLs choke on some special
                   # characters unless carefully percent-encoded; plain
                   # alphanumeric is simpler and just as strong at this length.
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage_gb
  max_allocated_storage = var.db_max_allocated_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false # single-AZ - the "Balanced" tier's
                                  # deliberate cost/resilience trade-off;
                                  # the higher-traffic tier not chosen
                                  # would flip this to true.

  backup_retention_period = 7
  backup_window            = "03:00-04:00" # low-traffic window, UTC
  maintenance_window       = "mon:04:30-mon:05:30"

  # Guards against an accidental `terraform destroy` deleting real student
  # data with no way back - deliberately harder to remove than to create.
  deletion_protection = true
  skip_final_snapshot  = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final"

  auto_minor_version_upgrade = true
}
