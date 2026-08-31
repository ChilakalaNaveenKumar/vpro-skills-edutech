# VPRO Skills EduTech - AWS production infrastructure ("Balanced" tier -
# see the plan this was built from: one right-sized EC2 instance running
# the app + Jenkins via Docker Compose, plus a separate small managed
# Postgres database). Full narrative/decisions live in
# docs/ARCHITECTURE.md's "AWS Deployment" section and docs/AWS_DEPLOYMENT.md
# (the step-by-step walkthrough, including the one-time manual steps only
# a human can do). This file just wires up providers/shared data sources -
# see the other .tf files in this directory for the actual resources.

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# Uses the account's default VPC/subnets rather than building a dedicated
# VPC - keeps this "Balanced" tier simple and free of extra networking
# cost. A dedicated VPC (private subnets for RDS, a NAT gateway, etc.) is
# a documented future hardening step in docs/AWS_DEPLOYMENT.md, worth
# doing if/when this ever needs to grow toward the higher-traffic tier.
data "aws_vpc" "default" {
  default = true
}

# RDS requires a subnet group spanning at least two Availability Zones
# even for a single-AZ instance - the default VPC already has a subnet in
# every AZ in the region, so this just uses all of them.
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Amazon Linux 2023 AMI (x86_64) - current, patched at launch time,
# ships with the SSM Agent preinstalled (needed for decision 7's
# SSH-free admin access) and a modern dnf-based package manager for the
# user-data bootstrap script.
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
