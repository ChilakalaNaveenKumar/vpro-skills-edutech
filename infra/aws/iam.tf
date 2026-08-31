# EC2 instance role - the identity used by (a) the app container fetching
# its two secrets from SSM at boot, and (b) Jenkins, running as a second
# Docker Compose stack on this same instance, pushing/pulling the backend
# image to/from ECR. Scoped to exactly those two things plus SSM Session
# Manager (for the human's own admin shell access) - not a broad AWS
# permission set. No static AWS access keys are ever stored on the
# instance or in Jenkins for this - the instance metadata service hands
# out short-lived, auto-rotating credentials for this role.

resource "aws_iam_role" "instance" {
  name = "${var.project_name}-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# SSM Session Manager - lets an admin get a shell on the instance via
# `aws ssm start-session`, with no SSH key pair and no inbound port 22.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Read-only, and scoped to this project's own parameter path only - the
# instance can fetch JWT_SECRET/DATABASE_URL (see ssm.tf), nothing else
# in the account's Parameter Store.
resource "aws_iam_role_policy" "ssm_read_params" {
  name = "${var.project_name}-ssm-read-params"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParametersByPath",
      ]
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
    }]
  })
}

# Push/pull the one backend image repository only (ecr.tf) - not every
# repository in the account. GetAuthorizationToken has no resource-level
# scoping in ECR's IAM model (it's how `docker login` works), so it stays
# a "Resource": "*" statement even though the repo-specific actions below
# are scoped.
resource "aws_iam_role_policy" "ecr_push_pull" {
  name = "${var.project_name}-ecr-push-pull"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = aws_ecr_repository.backend.arn
      },
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.instance.name
}
