# Partial backend config - deliberately missing `bucket`/`region`/
# `dynamodb_table`, since a Terraform backend block can't reference
# variables (it's read before any variable is resolved). Those three
# values come from bootstrap/'s own outputs, passed in at `terraform init`
# time via -backend-config flags - see init.sh, which does this for you.
terraform {
  backend "s3" {
    key     = "vpro-skills/prod/terraform.tfstate"
    encrypt = true
  }
}
