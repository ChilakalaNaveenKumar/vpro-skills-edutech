# Operations runbook

Day-to-day operational procedures for a deployed VPRO Skills EduTech
backend. For local development setup, see `docs/SETUP.md`. For what the
production Docker image/compose file actually do and why, see
`docs/ARCHITECTURE.md`'s "Deployment (Phase 12)" section.

All commands below assume `docker/` as the working directory and
`docker/.env` already filled in from `docker/.env.example`.

## Starting / stopping the production stack

```
cd docker
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend    # or: postgres
docker compose -f docker-compose.prod.yml down               # stop (keeps data)
```

`docker-compose.prod.yml` is self-contained - always run it alone (`-f
docker-compose.prod.yml`), not layered with `docker-compose.yml`. The
backend's `docker-entrypoint.sh` runs `alembic upgrade head` automatically
every time the container starts, so a plain `up -d --build` after a code
change already applies any new migration - there is no separate manual
migration step for the common case.

## Applying / rolling back a migration manually

Normally automatic (see above). To do it by hand, or to roll back:

```
docker compose -f docker-compose.prod.yml exec backend alembic current
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend alembic downgrade -1
```

**`alembic downgrade` is dangerous** if the migration being undone dropped
a column or table - that data is gone, downgrade or not. Only downgrade a
migration you know was purely additive (a new nullable column, a new
table), and take a backup first regardless (see below).

## Creating the first admin account

There is no self-registration endpoint (see `docs/ARCHITECTURE.md`'s
"Authentication" section) - the very first admin account is always created
via the bootstrap CLI, run once inside the backend container:

```
docker compose -f docker-compose.prod.yml exec backend \
    python -m scripts.create_user --email admin@vproskills.com \
    --password "<a real password>" --full-name "Admin" --role ADMIN
```

Every admin account after that can be created through the admin panel
itself (`POST /api/users/`, or the "Students" page's web UI for student
accounts).

## Rotating `JWT_SECRET`

Edit `backend/.env`'s `JWT_SECRET`, then restart the backend service:

```
docker compose -f docker-compose.prod.yml up -d --build backend
```

**This immediately invalidates every existing JWT** - `app/auth/dependencies.py`
verifies each token's signature against the current secret on every
request, so every logged-in user (student and admin) is signed out at
once and must log in again. There's no partial/staged rotation today.
Plan for this during a maintenance window, not silently mid-day.

## Database backups

```
./backup.sh                                   # dumps to docker/backups/<db>_<timestamp>.sql
COMPOSE_FILE=docker-compose.yml ./backup.sh    # same, against the local dev stack instead
```

`docker/backups/` is gitignored - these files contain real user data
(names, emails, password hashes, assessment history) and must be stored
somewhere with its own access control and retention policy (e.g. synced
to encrypted object storage), not left only on the host disk. For a
recurring schedule, add a cron entry on the host running Docker, e.g.
daily at 02:00:

```
0 2 * * * cd /path/to/LMS/docker && ./backup.sh >> backups/backup.log 2>&1
```

Prune old backups periodically - `backup.sh` does not do this
automatically, to avoid silently deleting the only copy of a backup that
turns out to be needed.

## Restoring from a backup

```
./restore.sh backups/vpro_skills_20260830_020000.sql
```

Prompts for confirmation before running. Restoring into a database that
already has conflicting data (not empty) will fail partway through - for
a clean restore, either restore into a fresh volume (`docker compose -f
docker-compose.prod.yml down -v` **destroys the current data first**, only
do this if that's actually what you want) or drop and recreate the
database before restoring:

```
docker compose -f docker-compose.prod.yml exec postgres \
    psql -U "$POSTGRES_USER" -d postgres \
    -c 'DROP DATABASE "'"$POSTGRES_DB"'"; CREATE DATABASE "'"$POSTGRES_DB"'";'
./restore.sh backups/vpro_skills_20260830_020000.sql
docker compose -f docker-compose.prod.yml restart backend   # re-applies migrations via the entrypoint
```

Stop the backend first (`docker compose -f docker-compose.prod.yml stop
backend`) if you want to guarantee no writes land mid-restore, then start
it again afterward.

## Health / monitoring

`GET /health` (no auth) returns `{"status": "ok", "app": ..., "environment":
...}` and never touches the database - it's a liveness check, not a
readiness check for Postgres connectivity. The Docker image's own
`HEALTHCHECK` already polls this every 30s; `docker compose -f
docker-compose.prod.yml ps` shows each container's current health state.

## Incident / rollback

- **Bad backend deploy**: `git checkout <previous-good-commit> -- backend/`
  (or check out the previous tag/branch entirely) and re-run `docker
  compose -f docker-compose.prod.yml up -d --build backend`. Since the
  entrypoint runs `alembic upgrade head` on every start, rolling back code
  without also rolling back a migration that code depended on can leave
  the schema ahead of the code - check `alembic current` against what the
  rolled-back code's migration head actually is before assuming this is
  safe.
- **Postgres is down / unhealthy**: `docker compose -f
  docker-compose.prod.yml logs postgres`; the backend will fail its own
  healthcheck shortly after since every real request needs the database.
  Restarting the `postgres` service (`docker compose -f
  docker-compose.prod.yml restart postgres`) is usually enough; if the
  volume itself is corrupted, restore the most recent backup into a fresh
  volume (see above).
- **Suspected credential leak (`JWT_SECRET` or Postgres password)**:
  rotate `JWT_SECRET` (above); for the Postgres password, update
  `docker/.env` and the Postgres user's actual password (`ALTER USER ...
  WITH PASSWORD ...` via `psql`, then update `docker/.env` to match)
  before restarting the backend.

## Deploying the web app

See `docs/SETUP.md`'s "Deploying the web app" section - the web app is a
static build (`web/dist`), not a Docker container; this repo doesn't
commit to a specific static host.
