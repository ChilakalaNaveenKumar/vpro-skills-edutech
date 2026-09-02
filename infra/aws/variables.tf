variable "aws_region" {
  description = "AWS region for the whole deployment. Must match bootstrap/'s aws_region."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used as a prefix for every resource this project creates."
  type        = string
  default     = "vpro-skills"
}

variable "environment" {
  description = "Deployment environment tag/name - matches backend/app/core/config.py's ENVIRONMENT value."
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type for the single app+Jenkins server (\"Balanced\" tier)."
  type        = string
  default     = "t3.medium"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 30
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  description = "Initial RDS storage in GB."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage_gb" {
  description = "RDS storage autoscaling ceiling in GB."
  type        = number
  default     = 50
}

variable "db_name" {
  description = "Postgres database name."
  type        = string
  default     = "vpro_skills"
}

variable "db_username" {
  description = "Postgres master username."
  type        = string
  default     = "vpro_admin"
}

variable "alert_email" {
  description = "Email address for the AWS Budget alert and CloudWatch alarm notifications - required, no default (there's no safe generic default for who should be notified about your spend/instance health)."
  type        = string
}

variable "monthly_budget_usd" {
  description = "Forecast-spend threshold (USD/month) that triggers the AWS Budget alert email - a cheap safety net against a mistake or traffic spike silently running up a bill."
  type        = number
  default     = 100
}

variable "admin_cidr" {
  description = "CIDR allowed to reach the Jenkins UI (port 8080) - defaults to open (0.0.0.0/0) since GitHub's webhook needs to reach it and its source IP ranges are large/change over time; the webhook itself is authenticated by a shared secret configured in Jenkins and GitHub, not by IP. Narrow this to your own office/home IP + GitHub's published ranges if you want tighter access control - see docs/AWS_DEPLOYMENT.md."
  type        = string
  default     = "0.0.0.0/0"
}
