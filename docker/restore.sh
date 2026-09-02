#!/usr/bin/env bash
# Restores a plain-SQL dump produced by backup.sh into the running
# Postgres service. DESTRUCTIVE: existing data in the target database is
# not automatically wiped first - a dump of CREATE/INSERT statements
# against a non-empty database will fail on conflicting rows/objects. For
# a clean restore, drop and recreate the database first (see
# docs/RUNBOOK.md), or restore into a fresh volume.
#
# Usage:
#   ./restore.sh backups/vpro_skills_20260830_120000.sql
#   COMPOSE_FILE=docker-compose.yml ./restore.sh backups/some_dump.sql
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -ne 1 ]; then
    echo "Usage: $0 <path-to-backup.sql>" >&2
    exit 1
fi
backup_file="$1"
if [ ! -f "$backup_file" ]; then
    echo "No such file: $backup_file" >&2
    exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi
POSTGRES_USER="${POSTGRES_USER:-vpro}"
POSTGRES_DB="${POSTGRES_DB:-vpro_skills}"

echo "About to restore $backup_file into '$POSTGRES_DB' (via $COMPOSE_FILE)."
echo "This does NOT stop the backend - stop it first if you don't want writes"
echo "landing mid-restore (see docs/RUNBOOK.md)."
read -r -p "Type 'yes' to continue: " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$backup_file"

echo "Restore complete."
