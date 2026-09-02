# One-time bootstrap: creates the S3 bucket + DynamoDB lock table that the
# *real* infrastructure config (../) uses as its remote Terraform state
# backend. This has to be a separate, tiny config kept on local state -
# Terraform's S3 backend can't be configured to point at a bucket that the
# very same config is also trying to create (chicken-and-egg). Run this
# once, note the bucket name it outputs, then run ../init.sh to initialize
# the main config against it. See docs/AWS_DEPLOYMENT.md for the full
# walkthrough.
#
# These two resources essentially never change once created - low risk in
# keeping this one small state file local (see .gitignore: infra/aws/**/*.tfstate*
# is never committed regardless).

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for the whole deployment."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used as a prefix for every resource this project creates."
  type        = string
  default     = "vpro-skills"
}

data "aws_caller_identity" "current" {}

# Bucket name includes the account id to guarantee global uniqueness
# without anyone having to pick a name by hand - S3 bucket names are
# unique across all of AWS, not just this account.
resource "aws_s3_bucket" "tfstate" {
  bucket = "${var.project_name}-tfstate-${data.aws_caller_identity.current.account_id}"

  # Terraform state can contain resource attributes (like the RDS
  # endpoint) that shouldn't be deleted out from under a running
  # deployment by accident.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Locking so two `terraform apply` runs never race each other and corrupt
# state - relevant here since both this session and, later, the user
# themselves could in principle run Terraform against the same state.
resource "aws_dynamodb_table" "tflock" {
  name         = "${var.project_name}-tfstate-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "tfstate_bucket" {
  value = aws_s3_bucket.tfstate.bucket
}

output "tfstate_lock_table" {
  value = aws_dynamodb_table.tflock.name
}

output "aws_region" {
  value = var.aws_region
}
