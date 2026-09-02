output "app_public_ip" {
  description = "Elastic IP of the app+Jenkins server. Backend API: http://<this>/ , Jenkins UI: http://<this>:8080/"
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  description = "EC2 instance id - use with `aws ssm start-session --target <this>` for shell access (no SSH key needed)."
  value       = aws_instance.app.id
}

output "rds_endpoint" {
  description = "RDS Postgres endpoint (host:port) - not publicly reachable, only from the app server."
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "ecr_repository_url" {
  description = "Push backend images here (the Jenkinsfile does this automatically once wired up)."
  value       = aws_ecr_repository.backend.repository_url
}

output "web_bucket_name" {
  description = "S3 bucket to `aws s3 sync web/dist` into when deploying the web app."
  value       = aws_s3_bucket.web.bucket
}

output "cloudfront_domain" {
  description = "The web app's public HTTPS URL (free automatic HTTPS on this default CloudFront domain)."
  value       = aws_cloudfront_distribution.web.domain_name
}

output "cloudfront_distribution_id" {
  description = "Needed to invalidate the CloudFront cache after deploying a new web build."
  value       = aws_cloudfront_distribution.web.id
}
