# One ECR repository for the backend image - replaces Docker Hub as the
# production registry (the Jenkinsfile's optional Docker Hub push stage
# is left in place untouched, in case it's still wanted for other
# reasons, but this is what the real AWS deploy path uses).

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Untagged images (superseded layers from old builds) pile up and cost
# storage for no benefit - expire them after 14 days. Tagged images
# (anything a real deploy pointed at) are never touched by this rule.
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images after 14 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 14
      }
      action = { type = "expire" }
    }]
  })
}
