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

## First deploy of the database-backed content (one time)

Revisions `g6a7b8c9d0e1` to `j9d0e1f2g3h4` move the site copy and the
curriculum out of the frontend's static files and into the database, and add
`leads`. The migrations themselves are additive - new tables, new nullable
columns - and have been run against a populated copy of the production schema
with no row lost. The part that needs care is that they leave every content
table **empty**, and the tables have to be filled once, by hand.

Rehearse it first, against a copy of the real database - especially with a
batch in progress:

```
./backup.sh                                        # on the production box
./rehearse-release.sh backups/<that dump>.sql      # here, on a throwaway copy
```

That restores the dump into a scratch container, runs the whole
migrate-and-seed sequence against it, and prints what changed - row counts,
every course and topic, and every recorded student attempt. Nothing it does
can reach production. Read the diff for two things: no assessment attempt may
change, and no topic a running batch depends on should turn `INACTIVE`. A
topic goes inactive when it is missing from `scripts/curriculum.json`, so the
fix is to add it to the JSON, never to edit the database by hand.

Then take a backup anyway (`./backup.sh`) and deploy normally - the
entrypoint applies the migrations. Then load the content, once:

```
docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed_site_content
docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed_curriculum
```

Both scripts replace their tables wholesale, so a second run would throw away
whatever the admin has written since the first. They refuse to run against
tables that already hold content for that reason, and exit non-zero; pass
`--force` only when you genuinely mean to discard the live copy and reload
from the JSON files. **Never** add either script to `docker-entrypoint.sh` -
it runs on every container start, and that would reset the site's content on
every restart.

Until they are run the public pages are not broken: each section falls back
to the copy compiled into the frontend, and an empty collection from the API
is treated as "nothing authored yet" rather than "show nothing".

One thing here is effectively one-way. `i8c9d0e1f2g3` makes `batches.start_time`
and `end_time` nullable so a batch can open before its hour is fixed. As soon
as one batch is saved without a time, `alembic downgrade` can no longer restore
the `NOT NULL` constraint and will abort. That abort is safe - Postgres runs
the migration in a transaction, so a failed downgrade leaves the database
exactly where it was, verified - but the way back is a restore from backup,
not a downgrade.

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

## Adding a new secret

Real secret values live in exactly one place - SSM Parameter Store - and reach
the container through `docker/fetch-secrets.sh`, authenticated by the app
instance's IAM role. No secret is ever committed, and no static AWS key exists
to steal. Adding one (an API key from a third party, say) touches four files
and one command:

1. Write the value to SSM, under the same path prefix the others use:

   ```
   aws ssm put-parameter --type SecureString --overwrite \
       --name /vpro-skills/production/google_api_key --value "<the key>"
   ```

   Do this with the CLI rather than adding it to `infra/aws/ssm.tf` when the
   value is one you were handed rather than one Terraform generates. Anything
   Terraform manages is stored in plaintext in its state file; keeping a
   handed-to-you key out of state is one less copy of it. `iam.tf` grants the
   instance the whole `/vpro-skills/production/*` prefix, so a new parameter
   there needs no IAM change.

2. Map it in `docker/fetch-secrets.sh`'s `name_map`, so the fetch writes it
   into `backend/.env` under the env var name the app reads.
3. Declare it on `Settings` in `backend/app/core/config.py`. Give it no
   default if the app cannot start without it - that turns a missing secret
   into a loud startup failure rather than a runtime surprise.
4. Document it in `backend/.env.example`, with a placeholder, never the value.

For local development there is no SSM: hand-edit `backend/.env`, which is
gitignored. The repo root also has a `.env` holding `GOOGLE_API_KEY`, left
from experimenting with Gemini - nothing reads it yet. Give it the treatment
above when the Gemini work lands, or delete it.

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
