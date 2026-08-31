#!/usr/bin/env bash
# Fetches the backend's two secrets (JWT_SECRET, DATABASE_URL) plus
# CORS_ORIGINS from AWS Systems Manager Parameter Store and writes them
# to backend/.env, ready for `docker compose -f docker-compose.aws.yml up`.
#
# Authenticated by whatever AWS identity is already available in the
# environment this runs in (the EC2 instance's IAM role when run from
# Jenkins on the AWS instance itself - see infra/aws/iam.tf) - no AWS
# access key is stored or passed to this script. Only ever used for the
# AWS deployment; local dev keeps hand-editing backend/.env directly, and
# docker-compose.prod.yml (a self-contained single-box deployment with
# its own local Postgres) doesn't use this either.
#
# Usage: ./fetch-secrets.sh [output-path]   (default: ../backend/.env)
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-vpro-skills}"
ENVIRONMENT="${ENVIRONMENT:-production}"
PATH_PREFIX="/${PROJECT_NAME}/${ENVIRONMENT}/"
OUT_FILE="${1:-$(dirname "$0")/../backend/.env}"

TMP_JSON="$(mktemp)"
trap 'rm -f "$TMP_JSON"' EXIT

aws ssm get-parameters-by-path \
    --path "$PATH_PREFIX" \
    --with-decryption \
    --query "Parameters[].{Name:Name,Value:Value}" \
    --output json > "$TMP_JSON"

python3 - "$PATH_PREFIX" "$OUT_FILE" "$TMP_JSON" <<'PY'
import json
import sys

path_prefix, out_file, tmp_json = sys.argv[1], sys.argv[2], sys.argv[3]

with open(tmp_json) as f:
    params = json.load(f)

# Maps each SSM parameter's short name (after the shared path prefix) to
# the env var name backend/app/core/config.py's Settings actually reads.
name_map = {
    "jwt_secret": "JWT_SECRET",
    "database_url": "DATABASE_URL",
    "cors_origins": "CORS_ORIGINS",
}

lines = []
for p in params:
    short_name = p["Name"][len(path_prefix):] if p["Name"].startswith(path_prefix) else p["Name"]
    env_name = name_map.get(short_name)
    if env_name:
        lines.append(f"{env_name}={p['Value']}")

found = {line.split("=", 1)[0] for line in lines}
missing = set(name_map.values()) - found
if missing:
    sys.exit(
        f"fetch-secrets.sh: missing expected SSM parameters under {path_prefix}: {sorted(missing)} "
        "- has `terraform apply` been run in infra/aws/ yet?"
    )

with open(out_file, "w") as f:
    f.write("\n".join(sorted(lines)) + "\n")

print(f"fetch-secrets.sh: wrote {len(lines)} value(s) to {out_file}")
PY
