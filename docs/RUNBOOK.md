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

## Operating the AWS deployment

Everything above describes the self-contained Docker deployment
(`docker-compose.prod.yml`, its own local Postgres, SSH-shaped mental
model). The AWS deployment (`docs/AWS_DEPLOYMENT.md`) changes three of
these procedures - the rest (health checks, `alembic` commands, the
overall "the entrypoint applies migrations automatically" behavior) work
identically once you have a shell on the instance.

**Getting a shell - no SSH.** Port 22 isn't open and there's no key pair
(see `docs/ARCHITECTURE.md`'s "AWS Deployment" section for why). Use AWS
Systems Manager instead:
```
aws ssm start-session --target <instance_id from terraform output>
```
Every session is logged by AWS - a real improvement over an SSH key that
can be copied/leaked with no record of who used it.

**Backups - RDS snapshots, not `backup.sh`.** `docker/backup.sh`/
`restore.sh` are for the self-contained Docker deployment's own local
Postgres container and don't apply here - RDS takes automated daily
backups itself (7-day retention, `infra/aws/rds.tf`). To restore:
```
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier vpro-skills-production \
    --target-db-instance-identifier vpro-skills-production-restored \
    --restore-time <timestamp>
```
This creates a **new** RDS instance from the backup rather than
overwriting the live one - point the app at it (update the
`database_url` SSM parameter, redeploy) once you've confirmed it's the
data you wanted, then decide whether to keep or delete the original.
For a specific stored snapshot instead of point-in-time:
```
aws rds describe-db-snapshots --db-instance-identifier vpro-skills-production
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier vpro-skills-production-restored \
    --db-snapshot-identifier <snapshot-id>
```

**Rotating `JWT_SECRET` - via SSM, not `backend/.env`.** The AWS
deployment's `backend/.env` is regenerated fresh on every deploy by
`docker/fetch-secrets.sh` (see the Jenkinsfile's deploy stage) - hand-
editing it on the instance would just be overwritten by the next push.
Rotate the actual source of truth instead:
```
aws ssm put-parameter \
    --name /vpro-skills/production/jwt_secret \
    --type SecureString \
    --value "<a new long random value>" \
    --overwrite
```
then trigger a redeploy (a Jenkins "Build Now", or push any small
change) so the running container picks it up. Same consequence as
before: every existing JWT is invalidated immediately, every logged-in
user is signed out at once.

**Everything else** (viewing logs, checking `/health`, an incident
rollback by redeploying a previous image tag from ECR) works the same
way described above, just run from inside an SSM session instead of a
local terminal, and against `docker-compose.aws.yml` instead of
`docker-compose.prod.yml`.
