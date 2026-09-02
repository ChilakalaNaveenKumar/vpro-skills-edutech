#!/usr/bin/env bash
# Entrypoint for the backend production image: apply any pending Alembic
# migrations, then hand off to whatever CMD the image (or a compose file's
# `command:` override) was actually started with. `exec` replaces this
# shell process with that command so it keeps receiving signals (SIGTERM
# on `docker stop`) directly, instead of a shell sitting in between.
set -euo pipefail

echo "docker-entrypoint: applying database migrations..."
alembic upgrade head

echo "docker-entrypoint: starting: $*"
exec "$@"
