# VPRO Skills EduTech Platform

A production-oriented EdTech platform for [VPRO Skills EduTech](https://www.vproskills.com/):
a responsive web app, an Android app, and a shared FastAPI backend covering
student course access and topic-wise MCQ assessments, plus an admin panel
for managing courses, batches, topics, questions, students, and results.

## Tech stack

- **Web**: React + Vite + TypeScript, Tailwind CSS, React Router
- **Mobile**: React Native via Expo + TypeScript, React Navigation
- **Backend**: Python + FastAPI, JWT auth, SQLAlchemy + Alembic
- **Database**: PostgreSQL
- **Deployment**: Docker (backend + Postgres), static hosting for web

See `docs/ARCHITECTURE.md` for the module layout and `docs/SETUP.md` for
step-by-step local setup.

## Project structure

```
web/       React + Vite + TypeScript (responsive web app)
mobile/    React Native (Expo) + TypeScript (Android app)
backend/   FastAPI, one package per domain (auth, courses, questions, ...)
docker/    docker-compose for local Postgres + backend
docs/      Architecture and setup documentation
```

## Development roadmap

This project is built in phases, each reviewed before the next begins.
Existing modules are not modified to make room for a later one.

1. **Project architecture** - this scaffold (current phase)
2. Database - full schema (courses, batches, topics, questions, results, etc.)
3. Backend authentication - JWT login, password hashing, route protection
4. Courses / batches / topics - CRUD + student-facing read endpoints
5. Student dashboard - "My Courses" backed by real enrollment data
6. MCQ assessment - one-question-at-a-time flow, server-side answer storage
7. Results - server-side scoring, result storage and display
8. Admin panel - courses/batches/topics/questions/students/results management
9. Responsive UI polish - full breakpoint coverage, accessibility pass
10. Android application - full student flow on-device, EAS build
11. Testing - auth, authorization, scoring, and cross-student-isolation tests
12. Docker / deployment - production images, backup/runbook documentation

Planned future modules (**not** built until explicitly requested): video
learning, assignments, coding exercises, certificates, payments,
placement/interview prep, notifications, AI features. These are expected to
land as new backend packages and new web/mobile screens without modifying
the modules above.

## Quick start

See `docs/SETUP.md` for full instructions. Short version:

```
# 1. Database
cd docker && docker compose up -d postgres

# 2. Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate \
  && pip install -r requirements.txt && cp .env.example .env \
  && uvicorn app.main:app --reload

# 3. Web
cd web && npm install && cp .env.example .env && npm run dev

# 4. Mobile
cd mobile && npm install && cp .env.example .env && npx expo start
```
