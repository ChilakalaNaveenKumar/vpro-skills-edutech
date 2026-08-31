#!/usr/bin/env bash
# Dumps the running Postgres service to a timestamped plain-SQL file under
# docker/backups/ (gitignored). Works against either compose file, since
# both name the service "postgres" - point COMPOSE_FILE at whichever one
# is actually running (defaults to the production file).
#
# Usage:
#   ./backup.sh                                   # uses docker-compose.prod.yml
#   COMPOSE_FILE=docker-compose.yml ./backup.sh    # local dev stack instead
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

# Prefer docker/.env's real credentials; fall back to docker-compose.yml's
# dev defaults so this also works untouched against the local dev stack.
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi
POSTGRES_USER="${POSTGRES_USER:-vpro}"
POSTGRES_DB="${POSTGRES_DB:-vpro_skills}"

mkdir -p backups
out_file="backups/${POSTGRES_DB}_$(date +%Y%m%d_%H%M%S).sql"

echo "Backing up '$POSTGRES_DB' (via $COMPOSE_FILE) to $out_file ..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$out_file"

echo "Done: $out_file ($(du -h "$out_file" | cut -f1))"
