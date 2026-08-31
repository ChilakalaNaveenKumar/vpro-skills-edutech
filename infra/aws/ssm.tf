# Encrypted SSM parameters holding the backend's two secrets. Nobody
# types or sees these values - JWT_SECRET is Terraform-generated,
# DATABASE_URL is assembled from the RDS resource's own outputs. The app
# instance reads them at container-start time via docker/fetch-secrets.sh,
# authenticated by its IAM instance role (iam.tf) - no static AWS keys
# involved. See backend/app/core/config.py for what these two env vars
# actually configure.

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/${var.environment}/jwt_secret"
  type  = "SecureString"
  value = random_password.jwt_secret.result
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/${var.environment}/database_url"
  type  = "SecureString"
  value = "postgresql+psycopg2://${var.db_username}:${random_password.db.result}@${aws_db_instance.main.endpoint}/${var.db_name}"
}

# Not a secret, but kept alongside the other two so fetch-secrets.sh can
# pull all three backend/.env values with one aws ssm get-parameters-by-path
# call rather than mixing SSM and hardcoded config. Points CORS at the
# CloudFront distribution serving the web app (s3_web.tf) - update this
# (or just re-apply Terraform) if a custom domain is added later and the
# web app starts being served from there instead.
resource "aws_ssm_parameter" "cors_origins" {
  name  = "/${var.project_name}/${var.environment}/cors_origins"
  type  = "String"
  value = "https://${aws_cloudfront_distribution.web.domain_name}"
}
