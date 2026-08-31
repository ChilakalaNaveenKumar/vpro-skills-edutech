#!/usr/bin/env bash
# Initializes the main Terraform config (this directory) against the
# remote state bucket created by bootstrap/. Run this once, after
# bootstrap/ has already been applied (see docs/AWS_DEPLOYMENT.md).
#
# Usage: ./init.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f bootstrap/terraform.tfstate ]; then
    echo "bootstrap/ has not been applied yet - run terraform init/apply in bootstrap/ first." >&2
    exit 1
fi

BUCKET=$(terraform -chdir=bootstrap output -raw tfstate_bucket)
LOCK_TABLE=$(terraform -chdir=bootstrap output -raw tfstate_lock_table)
REGION=$(terraform -chdir=bootstrap output -raw aws_region)

echo "Initializing main config against state bucket: $BUCKET (region $REGION)"
terraform init \
    -backend-config="bucket=$BUCKET" \
    -backend-config="region=$REGION" \
    -backend-config="dynamodb_table=$LOCK_TABLE"
