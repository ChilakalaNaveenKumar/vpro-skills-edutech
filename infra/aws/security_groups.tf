# Security groups - see docs/ARCHITECTURE.md's "AWS Deployment" section
# for the full precautions list this implements. Headline: no inbound
# SSH anywhere (port 22 is never opened) - all shell access to the
# instance goes through AWS SSM Session Manager instead (needs no key
# pair, no open port, and every session is logged). RDS is reachable
# only from the app server's own security group, never from the internet.

resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-"
  description = "VPRO Skills EduTech app + Jenkins server - HTTP(S) and Jenkins only, no SSH."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP (Nginx reverse proxy in front of the backend)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS - only used once a real domain + certificate is added (docs/AWS_DEPLOYMENT.md); harmless to leave open before then, nothing listens on it yet."
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Jenkins web UI + GitHub webhook delivery. Authenticated by Jenkins login / the GitHub webhook shared secret, not by source IP - see var.admin_cidr to narrow this."
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    description = "All outbound - needed for pulling Docker images, apt/dnf updates, talking to RDS/SSM/ECR, and Jenkins reaching GitHub."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  description = "RDS Postgres - reachable only from the app server, never the public internet."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Postgres from the app server only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}
