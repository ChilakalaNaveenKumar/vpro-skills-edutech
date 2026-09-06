# Local Development Setup

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker (for PostgreSQL; optional if you run Postgres another way)
- For a real Android build later: Android Studio + JDK (Expo can run in
  Expo Go on a physical device without these to start)

## 1. Database (Postgres via Docker)

```
cd docker
docker compose up -d postgres
```

This starts Postgres on `localhost:5433` (not the default 5432 - a
locally-installed Postgres already using 5432 is a common conflict; see
`docker/docker-compose.yml`'s comment) with the credentials already
matched in `backend/.env.example` (`vpro` / `vpro_password` /
`vpro_skills`). Change these before any real deployment.

## 2. Backend (FastAPI)

```
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit JWT_SECRET etc. if needed
uvicorn app.main:app --reload
```

Before starting the API, apply the database migration (needs Postgres
running - see step 1):

```
alembic upgrade head
```

This creates all ten tables (courses, batches, topics, questions,
question_options, assessments, assessment_attempts, assessment_answers,
users, student_batches). It was generated and offline-SQL-reviewed against
PostgreSQL but not run against a live server in development, so this is the
first real execution - if it fails, check `DATABASE_URL` in `.env` first.

Then create the first admin account (there is no self-registration -
see docs/ARCHITECTURE.md's "Authentication" section):

```
python -m scripts.create_user --email admin@vproskills.com \
  --password "change-me" --full-name "Admin" --role ADMIN
```

### Seed the site content

The migration creates the tables but leaves them empty. Until they are
seeded the public site falls back to the copy compiled into the frontend,
so it looks correct but nothing is editable from the admin panel, and the
course shelf has no per-course colours. Run both seeds once:

```
python -m scripts.seed_curriculum      # courses, modules, projects, hues
python -m scripts.seed_site_content    # testimonials, FAQs, tenets, hero copy
```

Both refuse to run if the tables already hold rows, and exit non-zero
saying so. That guard is deliberate: they delete before they insert, so on
a database someone has edited through the admin panel they would silently
discard that work. Pass `--force` only when you actually intend to throw
the current content away and reload from the file.

### Which database am I about to write to?

Nothing about these scripts is local by nature. They connect to whatever
`DATABASE_URL` in `backend/.env` points at, exactly like the API does, so
the only thing making them safe on your machine is that the copied
`.env.example` points at the Postgres in your own Docker.

Each run therefore says where it is going before it writes anything:

```
seed_curriculum: writing to vpro_skills on localhost:5433 (environment=development)
```

Read that line. `localhost` is your machine. Anything else is not, and you
should stop and check `DATABASE_URL` rather than let it continue.

As a second guard, both scripts refuse outright when `ENVIRONMENT` is
`production` - which `docker-compose.prod.yml` and `docker-compose.aws.yml`
set, and which nothing on a development machine sets. Getting past that
needs `--allow-production` typed into the command, so the live site cannot
be reseeded by someone who thought they were on their laptop.

If you want to be certain you cannot touch anything shared, point the
scripts at a throwaway file for the run without editing `.env` at all:

```
DATABASE_URL="sqlite:///./scratch.db" python -m scripts.seed_curriculum --force
```

`seed_curriculum` is the only thing that writes `courses.hue`, the colour
each spine on the course shelf is drawn in. Skip it and every course comes
back with a null hue; the frontend then falls back to the colour that
course shipped with, so the shelf still reads correctly, but nothing in
the database is authoritative and the admin panel cannot change it.

### Batches are not seeded - create them in the admin panel

Nothing in `scripts/` creates a batch, and there is deliberately no batch
fixture: a batch is a real cohort with a real trainer and a real hour, so
inventing one in a seed file would put a class on the public schedule that
nobody is teaching.

The consequence is worth expecting rather than debugging. On a freshly
seeded database the public site is *correct but empty of dates*: the
schedule page has no rows, the hero panel shows nothing to reserve, every
course reads "Dates not announced yet", and every button says "Tell me
when it opens" instead of "Reserve my seat". That is the right output for
a site with no batches, not a broken install.

Create one at `http://localhost:5173/admin/batches` (log in with the admin
account made above), which posts to `/api/admin/batches/`. A batch needs a
course, a batch number, a start and end date, days of the week, a start
and end time, and a trainer name. Give it a start date in the future and
the course flips to "Starting soon"; give it one in the past with an end
date ahead and it reads "In session". A course may have several batches
at once - the shelf card, the course page and the schedule all handle that
and give each batch its own button.

Now start the API:

```
uvicorn app.main:app --reload
```

Log in with `POST /api/auth/login` (JSON body: `email`, `password`) to get a
JWT, then call any other endpoint with `Authorization: Bearer <token>`.

Visit `http://localhost:8000/health` - should return
`{"status": "ok", ...}`. Every domain module also responds at
`http://localhost:8000/api/<module>/` with a placeholder payload until its
real endpoints are built in a later phase.

For any schema change after this point:

```
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

### Running the backend test suite (Phase 11)

The backend has a permanent `pytest` suite covering auth, authorization,
scoring, and cross-student-isolation, plus regression tests for two bugs
found during earlier phases. It runs against an isolated in-memory SQLite
database (created fresh per test) via FastAPI's `TestClient` - it never
touches the Postgres database from step 1, so it can be run any time, in
any order, without any setup beyond the venv:

```
cd backend
source .venv/bin/activate
pip install -r requirements-dev.txt
python -m pytest -v
```

All tests should pass. See `docs/ARCHITECTURE.md`'s "Testing (Phase 11)"
section for what's covered and how the isolation works.

## 3. Web app (Vite + React + TypeScript)

```
cd web
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

`web/.env.example` sets `VITE_API_BASE_URL=http://localhost:8001`, which is
the port the backend is published on **when it runs in Docker** (step 5).
If you started it with `uvicorn` in step 2 it is on `8000` instead, and the
copied default will leave every request failing against a port with nothing
behind it - the pages render from their compiled-in fallback copy, so the
site looks fine while no live data reaches it. Running uvicorn directly:

```
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
```

Vite reads `.env` at startup, so restart `npm run dev` after changing it.

## 4. Mobile app (Expo + TypeScript)

```
cd mobile
npm install
cp .env.example .env             # points at the backend, defaults to :8000
npx expo start
```

Scan the QR code with Expo Go on an Android device, or press `a` for an
Android emulator.

Note: if testing on a physical device or emulator, `EXPO_PUBLIC_API_BASE_URL`
in `mobile/.env` must point to your computer's LAN IP (not `localhost`), e.g.
`http://192.168.1.20:8000`, since the device is a separate machine from the
one running the backend.

### Building a real installable APK (Phase 10)

Two options:

- **Locally** (needs Android Studio/JDK installed): `npx expo run:android`.
- **[EAS Build](https://docs.expo.dev/build/introduction/)** (Expo's cloud
  build service - no local Android toolchain needed). `mobile/eas.json`
  already defines `development`/`preview`/`production` profiles. This
  requires your own free Expo account, since it's tied to your account's
  build queue:

  ```
  cd mobile
  npx eas-cli login          # one-time, prompts for your Expo account
  npx eas-cli build --platform android --profile preview
  ```

  `preview` produces a directly-installable `.apk` (good for sharing a test
  build); `production` produces an `.aab` for a Play Store submission.
  The build itself runs on Expo's servers - `eas build` uploads the
  project and gives you a link to watch progress and download the result
  once it finishes.

## 5. Everything together via Docker

```
cd docker
docker compose up --build
```

Brings up Postgres + the backend container for local development. Web and
mobile are still run with their own dev servers during development (they
are not containerized).

Note: inside Docker, Postgres is published on host port `5433` and the
backend on host port `8001` (not the usual `5432`/`8000`) - this sidesteps
the common case of another local Postgres or dev server already holding
the default ports. If you're running the backend directly with `uvicorn`
(step 2, no Docker) it still uses the standard `8000`. When the backend
runs via Docker, set `VITE_API_BASE_URL=http://localhost:8001` in
`web/.env` and `EXPO_PUBLIC_API_BASE_URL=http://localhost:8001` in
`mobile/.env` (both `.env.example` files already default to `:8001`).

### Production deployment (Phase 12)

`docker-compose.prod.yml` is a separate, self-contained compose file for
a real deployment - it drops the dev file's exposed Postgres host port,
takes Postgres credentials from `docker/.env` instead of hardcoded
defaults, and disables the backend's interactive API docs. It also applies
pending Alembic migrations automatically on every container start (via
`backend/docker-entrypoint.sh`), so there's no separate manual migration
step after a deploy.

```
cd docker
cp .env.example .env      # fill in real POSTGRES_USER/PASSWORD/DB
docker compose -f docker-compose.prod.yml up -d --build
```

See `docs/RUNBOOK.md` for day-to-day operations: backups/restores,
rotating `JWT_SECRET`, applying/rolling back migrations, and incident
response. See `docs/ARCHITECTURE.md`'s "Deployment (Phase 12)" section
for what changed in the image itself and why.

### Deploying the web app

The web app is a static build, not a Docker container (see the tech-stack
note in `README.md`):

```
cd web
echo "VITE_API_BASE_URL=https://api.your-real-domain.example" > .env
npm run build
```

`VITE_API_BASE_URL` is a Vite *build-time* variable - Vite inlines it into
the built JS during `npm run build`, so it must be set to the real backend
URL before building, not after deploying. Setting it later on the static
host (an environment variable in a hosting dashboard, for instance) has no
effect on an already-built `web/dist`; rebuild instead. The resulting
`web/dist` directory is a plain static site - deploy it to any static
host (Netlify, Vercel, an S3 bucket + CloudFront, GitHub Pages, etc.); this
repo does not commit to one. Whichever host is used, its domain needs to be
added to the backend's `CORS_ORIGINS` (`backend/.env`) or the web app's
API calls will be blocked by CORS.

## CI/CD

Once this is on GitHub, `docs/CICD.md` walks through wiring up automatic
builds with Jenkins (running locally in Docker) on every push, including
building the backend's Docker image via the `Jenkinsfile` at the repo
root. It also covers the eventual move to AWS.
