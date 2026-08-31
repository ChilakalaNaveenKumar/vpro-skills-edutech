# The single app+Jenkins server ("Balanced" tier). user-data.sh.tpl
# installs Docker, then boots Jenkins on first launch - the exact same
# docker/jenkins/Dockerfile + docker/docker-compose.jenkins.yml already
# built for the (superseded) local-Mac CI/CD round, embedded here via
# Terraform's file()/templatefile() functions so the instance always gets
# whatever is actually committed in this repo at apply time, not a
# hand-copied duplicate that can drift out of sync.
#
# The *app itself* is not started by user-data - it's started by Jenkins'
# own pipeline the first time it runs (build -> push to ECR -> deploy),
# once the user has finished the one-time Jenkins/GitHub wiring in
# docs/AWS_DEPLOYMENT.md. There is nothing for user-data to git-clone or
# authenticate to for that part.

resource "aws_eip" "app" {
  domain = "vpc"
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.al2023.id
  instance_type           = var.instance_type
  subnet_id                = data.aws_subnets.default.ids[0]
  vpc_security_group_ids   = [aws_security_group.app.id]
  iam_instance_profile     = aws_iam_instance_profile.app.name

  # No SSH key pair - deliberate (see security_groups.tf). Admin shell
  # access is via `aws ssm start-session --target <instance-id>` only.

  root_block_device {
    volume_size           = var.root_volume_size_gb
    volume_type            = "gp3"
    encrypted               = true
    delete_on_termination   = true
  }

  metadata_options {
    http_tokens = "required" # IMDSv2 only - a real precaution against
                              # SSRF-style attacks that try to read
                              # instance-role credentials off IMDSv1.
  }

  user_data = templatefile("${path.module}/user-data.sh.tpl", {
    jenkins_dockerfile_b64 = base64encode(file("${path.module}/../../docker/jenkins/Dockerfile"))
    jenkins_compose_b64    = base64encode(file("${path.module}/../../docker/jenkins/../docker-compose.jenkins.yml"))
  })

  # A change to the Jenkins bootstrap files should actually reach the
  # instance - forces a replacement (new instance, same Elastic IP re-
  # attached) when either embedded file's content changes, rather than
  # silently leaving the running instance on stale user-data.
  user_data_replace_on_change = true

  tags = {
    Name = "${var.project_name}-${var.environment}-app"
  }
}

# ---- Basic health monitoring (decision 7) ----

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "instance_status" {
  alarm_name          = "${var.project_name}-instance-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "The app+Jenkins EC2 instance is failing its own status checks - it may be unreachable."
  dimensions = {
    InstanceId = aws_instance.app.id
  }
  alarm_actions = [aws_sns_topic.alerts.arn]
}
