# Architecture

## Overview

```
React Web (web/)          React Native / Expo (mobile/)
        \                          /
         \                        /
              FastAPI REST API (backend/)
                        |
                  PostgreSQL (docker/)
```

Both clients talk to the same backend over REST. No business logic is
duplicated between web and mobile - each has its own thin `services/`
layer that calls the backend, but validation, scoring, and authorization
rules live only in `backend/`.

## Backend module boundaries

`backend/app/` is one package per domain: `auth, users, courses, batches,
topics, questions, assessments, results, admin`. Each package owns:

- `router.py` - its `APIRouter`, included once in `app/main.py`
- `models.py` - its SQLAlchemy models (added starting Phase 2)
- `schemas.py` - its Pydantic request/response schemas (added starting Phase 2)

`app/main.py` only imports and registers routers - it never contains
business logic itself, so it will not grow into a monolith as modules are
added.

`app/core/` holds cross-cutting infrastructure (settings, security/JWT
helpers) and `app/database/` holds the SQLAlchemy engine/session setup and
the shared declarative `Base`. As of Phase 3, `app/auth/` joins these two as
a third package every domain module may depend on, for its `get_current_user`/
`require_admin` route-protection dependencies (see "Authentication" below).

Beyond those three, the rule is **read across, write only your own table**:
a module may import another module's models or query helpers to answer a
legitimate cross-cutting question (`results` reading `assessments`' models
to report on attempts; `topics` reading `batches`' models and
`users.enrollment` to check whether a student is enrolled in a course), but
a row is only ever inserted/updated/deleted by the module whose `models.py`
declares that table - `topics` never writes a `StudentBatch` row, `batches`
never writes a `Topic` row, and so on. This is what keeps the module
boundary meaningful even as reporting/authorization logic naturally needs
to see across it.

The one nuance (Phase 6): a module *can* trigger a write into another
module's table, as long as the write itself is performed by code that
lives in and is owned by the target module, exposed as a function the
caller calls rather than a table the caller inserts into directly. Only
`assessments.provisioning.ensure_assessment_for_topic` does this today:
`questions`' admin "create question" endpoint calls it, but every actual
`Assessment` insert happens inside `assessments`' own module. This isn't a
new exception so much as the write-shaped version of the read rule above -
`topics` already calls `users.enrollment.is_student_enrolled_in_course` to
read across a boundary the same way.

## Adding a future module (rule for later phases)

Future modules (payments, certificates, video learning, etc.) are added as
new packages under `backend/app/` with their own router, models, and
schemas, then registered with one `include_router` call in `main.py`.
Existing modules are not modified to make room for a new one. Web/mobile
add matching new `pages/`/`screens/` and a new `services/*.ts` file rather
than editing existing ones.

## Why Expo for mobile

The Android app uses Expo (managed React Native + TypeScript). It is still
genuine React Native - Expo is a toolchain/runtime around RN, not a
replacement for it - chosen so the project doesn't require a local Android
Studio/Gradle setup just to start development. `npx expo run:android` or
EAS Build produce a real installable APK when needed.

## Database access

`app/database/session.py` creates one pooled SQLAlchemy engine per backend
process (`pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`) and a
`get_db()` FastAPI dependency that yields a request-scoped session. This is
sized for the ~1,000-concurrent-assessment-user target in the product spec
and can be tuned via `backend/.env` without touching any endpoint code.

## Migrations

Schema changes go through Alembic (`backend/alembic/`), never manual DB
edits. `alembic/env.py` is wired to the app's own `Settings` (so the DB URL
always comes from `.env`, one source of truth) and to the shared `Base`,
so `alembic revision --autogenerate` picks up every module's models once
they exist (Phase 2 onward).

## Database schema (Phase 2)

Ten tables, one Alembic migration (`backend/alembic/versions/f5cea33fb190_initial_schema.py`):

- `users` - accounts (ADMIN/STUDENT via `role`), `student_batches` - which batches a student is enrolled in (admin-assigned)
- `courses`, `batches` (FK courses), `topics` (FK courses)
- `questions` (FK topics), `question_options` (FK questions - one row per A/B/C/D option)
- `assessments` (FK topics, one per topic in Phase 1), `assessment_attempts` (FK assessments + users - the final, server-computed outcome of one attempt), `assessment_answers` (FK attempts + questions + question_options - an audit trail of what was selected)

Two decisions worth knowing before touching this schema:

1. **There is no separate `results` table.** An `AssessmentAttempt` row *is* a result - it is written once, at submission, already containing `total_questions`, `correct_count`, `wrong_count`, and `percentage` (per the spec's "calculate server-side, save on submit, never write per-click" rule). The `results` module has no models of its own; its endpoints (added later) read `AssessmentAttempt` joined with `User`/`Course`/`Topic`. This is the one place a module is expected to read another module's models directly - every other module boundary in this file still holds.
2. **`question_options.is_correct` has a database-level partial unique index** (`uq_question_options_one_correct`, unique on `question_id` `WHERE is_correct`) so a question cannot have two options marked correct even if application code has a bug - this is enforced by Postgres itself, not just by the API layer that will be built in a later phase.

Shared enums (`UserRole`, `EntityStatus`) live in `app/core/enums.py`, and shared timestamp columns (`TimestampMixin`, `CreatedAtMixin`) live in `app/database/base.py` - both reused across every model instead of being redefined per table.

PostgreSQL note: because `EntityStatus` and `UserRole` are shared across several tables, the migration creates each enum type once explicitly (`CREATE TYPE ... AS ENUM`) and every column references it with `create_type=False` - referencing the same enum name from a plain per-column `sa.Enum(...)` on more than one table is a well-known Alembic/Postgres pitfall (the second `CREATE TABLE` fails because the type already exists), so this migration was hand-checked for it rather than left as autogenerate produced it.

## Authentication (Phase 3)

`POST /api/auth/login` takes a JSON `{email, password}` body (not the
OAuth2 form-encoded convention FastAPI's tutorials default to - our real
clients are the web/mobile apps calling the API directly with JSON) and
returns a JWT. Clients send it back as `Authorization: Bearer <token>` on
every subsequent request.

`app/auth/dependencies.py` provides the two functions every module's real
endpoints use for authorization:

- `get_current_user` - decodes the token, then re-checks the database
  (existence + `is_active`) rather than trusting the token's claims alone,
  so deactivating an account takes effect immediately.
- `require_admin` - `get_current_user` plus a role check, 403 for non-admins.

`auth` is a foundational module any other module may import from for these
two dependencies - the one deliberate exception to "domain modules don't
import each other." Every other placeholder router added `dependencies=[Depends(...)]`
at the router level in this phase (`get_current_user` for the
student-facing modules, `require_admin` for `users` and `admin`) - real
business logic in those routes still lands in later phases, only the auth
gate exists today.

There is no public self-registration endpoint - accounts are created by an
admin. Since the admin panel doesn't exist until Phase 8, `backend/scripts/create_user.py`
is a small bootstrap CLI for creating the first account(s); see docs/SETUP.md.

## Courses / Batches / Topics (Phase 4)

`GET /api/courses/` and `GET /api/batches/` (and their `/{id}` detail
routes) serve three audiences from one endpoint each, via
`get_current_user_optional` (`app/auth/dependencies.py`): anonymous
visitors and logged-in students see only `ACTIVE` rows, an admin caller
sees everything. This is why there's no separate `GET` under
`/api/admin/courses` or `/api/admin/batches` - admin reuses the public
route with elevated visibility, and each module's `admin_router` only
carries the writes (`POST`/`PUT`). Neither courses nor batches has a hard
`DELETE` - the spec grants only Create/View/Edit/Activate-Deactivate for
both, so a status flip via `PUT` is the only way to retire one. Batch
create/update catches the DB's `(course_id, batch_number)` unique
constraint and returns `409 Conflict` instead of a raw `500`.

`GET /api/courses/{course_id}/topics` lives in the `topics` module but is
mounted under `/api/courses` for a REST-friendly URL - it requires
authentication outright (unlike courses/batches), and a non-admin caller
must additionally be enrolled in the course (via `is_student_enrolled_in_course`,
`app/users/enrollment.py`) or gets a 403; an enrolled student then sees
only `ACTIVE` topics, while an admin sees every topic regardless of status.
Topics does get a hard `DELETE` (`/api/admin/topics/{id}`) - the spec
explicitly lists it, unlike courses/batches.


## Student dashboard / my enrollments (Phase 5)

`GET /api/users/me/batches` answers "what is this student actually
enrolled in" - the data source for the student dashboard's "My Courses"
list. It lives in `users/router.py` as a second router, `me_router`
(prefix `/api/users/me`, `dependencies=[Depends(get_current_user)]`),
separate from the existing admin-only `router` in the same file, since
`/api/users/me/...` is a different trust boundary (any authenticated
caller reading their own data) than `/api/users`'s admin-only account
management.

The query joins `StudentBatch` (owned by `users`) to `Batch` and returns
`batches.schemas.BatchPublic` - reusing another module's *schema*, not
just its model, the same way `auth`'s `/me` already reuses `users.UserPublic`.
There's no separate "my courses" endpoint: a student enrolls into a
`Batch`, and `BatchPublic` already carries `course_name` alongside the
schedule, which is what a dashboard card needs. Any authenticated user can
call this endpoint and gets only their own `student_batches` rows - an
admin simply gets an empty list back, no role check needed.

`BatchPublic` gained a `from_model(batch)` classmethod carrying the
`course_name` assembly logic that used to be a private `_to_public()`
helper inside `batches/router.py`. Moving it onto the schema let the new
`users` endpoint reuse the exact same assembly instead of duplicating it
or reaching into another module's router internals; `batches/router.py`'s
own three call sites were updated to match, with no change in behavior.


## MCQ assessment flow (Phase 6)

`Assessment` has no admin CRUD of its own - the spec's Admin feature list
never names it as something an admin creates or edits, only `Question`s
are admin-managed. A topic's `Assessment` row simply starts existing the
moment its first `Question` does, via `ensure_assessment_for_topic` (see
the module-boundary note above). `POST /api/admin/questions/` requires
exactly 4 options labeled A-D with exactly one marked correct (validated
in the schema; Phase 2's DB-level partial unique index backstops it
either way), and `DELETE /api/admin/questions/{id}` turns the DB's
`ON DELETE RESTRICT` from `assessment_answers.question_id` into a `409`
rather than a raw `500` when a question has already been answered.

`GET /api/topics/{topic_id}/assessment` and
`POST /api/topics/{topic_id}/assessment/submit` live in `assessments` but
are mounted under `/api/topics` - the same REST-friendly-prefix,
owning-module-keeps-the-logic split Phase 4 used for topics under
`/api/courses`. The `GET` never includes `is_correct` in its response, for
any caller, admin included - correct answers not reaching the frontend
before submission is an absolute rule here, not a student-only one. A
non-admin caller must be enrolled in the topic's course and the
topic/assessment/questions must all be `ACTIVE`, or `404`; admin bypasses
those filters for a preview but still never sees `is_correct` through this
endpoint. The `POST` is student-only (admin gets `403`) and re-derives the
entire scoring set from the database - the client's submitted question
list, count, and any score are never trusted, only which option id it
picked per question id, and only when that id actually belongs to that
question. Everything is written in one commit at submit time (one
`AssessmentAttempt` plus its `AssessmentAnswer` rows) - nothing is written
per question navigation. Multiple attempts are allowed; nothing constrains
`(assessment_id, student_id)` to one row. The submit response includes the
freshly computed score as immediate feedback on the attempt just taken -
that's a side effect of the endpoint's own return value, not a "results"
feature; a persistent results history/review screen is still Phase 7.
## Results (Phase 7)

`results` still has no models of its own - it reads Phase 6's
`AssessmentAttempt`/`AssessmentAnswer` joined across `assessments`,
`topics`, `courses`, `questions`, and `users`. Making that join efficient
needed four new pure `relationship()` additions, none of which change any
existing behavior: `Assessment.topic`, `Topic.course`,
`AssessmentAttempt.student`, and `AssessmentAnswer.question` /
`AssessmentAnswer.selected_option`. All four sit on foreign key columns
that already existed since Phase 2/6 - this is the same kind of
read-only-convenience addition as Phase 4's `Course.batches` /
`Batch.course`, not a schema change.

Two routers, no admin CRUD - there is nothing to create, update, or
delete here, only to list and view what Phase 6's submit endpoint already
wrote. `router` (`/api/results`, any authenticated user): `GET /` lists
the caller's own attempts, newest first; `GET /{attempt_id}` returns one
attempt's full per-question breakdown, viewable by the student who owns
it or by an admin (`403` for any other student, `404` if the attempt
doesn't exist). `admin_router` (`/api/admin/results`, admin-only): `GET /`
lists every attempt across every student, with optional `student_id`
and/or `topic_id` query filters - no pagination yet, matching every other
list endpoint so far. No admin UI is built for this in Phase 7 - like
courses/batches/topics/questions before it, the UI is uniformly Phase 8.

The detail view (`GET /api/results/{attempt_id}` and the admin listing)
is the one place correct answers are shown. Every prior phase's rule was
"never expose `is_correct` before submission" - that's still exactly true
of `assessments/schemas.py`'s take-endpoint shapes, which this phase
leaves untouched. It doesn't apply here because a result only exists for
an attempt that has *already* been submitted - there's nothing left to
protect by hiding the correct option once that specific student has
already completed that specific assessment. `ResultDetailPublic` /
`AdminResultPublic` therefore include each question's text, the student's
selected option, and the correct option; they live in
`results/schemas.py`, not `assessments/schemas.py`, since they're the
results module's own read shapes even though they're assembled from
`assessments`' models - the same split `batches`/`users` already use for
`BatchPublic`.

## Admin panel / student management (Phase 8)

Every domain except `users` already had full admin CRUD APIs by the end of
Phase 7 (`/api/admin/{courses,batches,topics,questions}`, `/api/admin/results`)
- this phase's backend work is entirely in `users`, plus one bug fix.

`users`' admin-gated `router` (`/api/users`, `require_admin`) went from a
Phase-3 placeholder to real account management: `GET /` (optional `role`
filter), `POST /` (create an account - the HTTP equivalent of
`scripts/create_user.py`'s bootstrap CLI, which stays in place for creating
the very first admin account before any admin is logged in), `PUT /{id}`
(partial update of `full_name`/`is_active` only - no email, password, or
role change in this phase). There is no `DELETE /{id}` - deactivation
(`is_active=false`) is this app's substitute for hard delete everywhere
(courses/batches already work this way), and deleting a student outright
would cascade-destroy their `assessment_attempts` history via
`AssessmentAttempt.student_id`'s `ON DELETE CASCADE`, which nothing has
asked for.

Batch assignment is a sub-resource of `users` (`/{user_id}/batches`) rather
than of `batches`, because `StudentBatch` is `users`' own table (see
`users/models.py`'s docstring) - the same "write only your own table"
boundary every other module follows. `GET /{user_id}/batches` is the admin
view of what `/api/users/me/batches` already does for the caller
themselves; `POST /{user_id}/batches` creates one `StudentBatch` row (404
if the user or batch doesn't exist, 400 if the user isn't a `STUDENT`, 409
on the existing unique-constraint violation); `DELETE
/{user_id}/batches/{batch_id}` removes one enrollment. This closes the
"no admin-facing way to assign a student to a batch" gap Phase 5/7's
verification scripts had been working around with direct DB inserts.

Second bug caught during this phase's own verification: adding
`GET/PUT/POST/DELETE /{user_id}...` routes to `router` created a path
collision with `me_router`'s literal `/me/batches` route, both mounted
under the same `/api/users` prefix. Since `main.py` registers `users_router`
before `users_me_router`, and a plain `{user_id}` path segment matches any
string at Starlette's routing layer (type validation happens after route
matching), a request to `/api/users/me/batches` was being swallowed by
`/api/users/{user_id}/batches` - the literal string `"me"` matched as if
it were a `user_id`, and since `router`'s dependency is `require_admin`,
the request from an ordinary logged-in student came back `403 Admin access
required` instead of that student's own batches. Fixed by giving every
new path parameter here an explicit `:int` converter
(`/{user_id:int}/batches`, etc.) - Starlette's int converter rejects
non-numeric segments and falls through to check the next matching route
regardless of registration order, so `"me"` now correctly reaches
`me_router` instead. Worth remembering for any future module that adds a
path-parameterized admin route alongside a fixed-path `me_router`-style
route under the same prefix.

Bug fix found while building this phase: `topics/router.py`'s
`delete_topic` didn't catch `IntegrityError`. Deleting a topic cascades to
delete its `Assessment` and `Question`s (`ON DELETE CASCADE`), but
`assessment_answers.question_id` is `ON DELETE RESTRICT` - so deleting a
topic with already-answered questions raised an uncaught `IntegrityError`
(a raw 500). Nothing exercised that path end-to-end until this phase wired
an actual delete button to it. Fixed the same way `questions/router.py`'s
`delete_question` already handles its own analogous case: catch
`IntegrityError`, roll back, return 409.

The admin web UI itself (`web/src/pages/Admin*.tsx`, under `/admin`, guarded
by `AdminRoute.tsx` on top of the existing login-only `ProtectedRoute.tsx`)
is the first UI layer built on top of every admin API from Phases 4-8 - it
adds no new backend behavior beyond what's described above. Topics and
Questions aren't top-level admin nav items; they're reached by drilling in
from Courses and Topics respectively, mirroring the same
course -> topic -> assessment hierarchy the student-facing flow already uses.
The admin results list reuses the existing `/results/:attemptId` detail
page (Phase 7 already allows admin viewing of any attempt) rather than
duplicating it.


## Design system (Phase 9)

Phases 1-8 used plain functional Tailwind styling (`gray-900`/`gray-200`
neutrals) with no brand identity, and only a handful of pages had any
responsive breakpoint beyond a grid column count. Phase 9's goal per the
roadmap was "Responsive UI polish - full breakpoint coverage, accessibility
pass," and it's also when the public home page got real marketing content
instead of the bare functional layout from Phase 4.

**Brand palette source.** The original intent was to pull real logo/color
assets from a local "VPro Skills" folder on the user's machine, which the
user explicitly chose when asked. Folder-access could not be granted after
three attempts (`device_request_folder_access` returned "requires
approval" every time, with `device_list_dir` confirming no access was ever
actually available, despite two rounds of the user confirming approval).
Rather than keep retrying an operation that wasn't changing state, the
fallback the user had also agreed to was used instead: an original palette
derived from the purple/blue colors already present in
`web/public/favicon.svg` (generated in Phase 1's scaffold) - `#863bff`,
`#7e14ff`, `#47bfff`, `#ede6ff` - so the favicon and the rest of the UI are
finally consistent with each other, rather than picking an unrelated color
from scratch. If real brand assets become available later, only
`web/src/index.css`'s `@theme` block and `web/src/components/Logo.tsx` need
to change - every other page references the `brand-*`/`accent-*` tokens,
never a raw hex value.

**Tokens** (`web/src/index.css`, Tailwind v4 CSS-first `@theme`):
`--color-brand-50/100/200/500/600/700`, `--color-accent-500`, and
`--font-display: "Poppins", ui-sans-serif, system-ui, sans-serif` (loaded
via a Google Fonts `<link>` in `index.html`, weights 500/600/700, headings
only - body text stays on the system font stack). These auto-generate
`bg-brand-*`/`text-brand-*`/`border-brand-*` utility classes with no
`tailwind.config.js` needed.

**WCAG contrast**: `brand-600` (`#7e14ff`) passes AA (~6.12:1) as either
white-text-on-purple (buttons) or purple-text-on-white (links); `brand-700`
is used where slightly darker contrast reads better. `accent-500`
(`#47bfff`) fails AA (~2.07:1) as text or as a button background with white
text, so it's used decoratively only (never for actionable text or
buttons).

**`Logo.tsx`** (`web/src/components/Logo.tsx`) is a small reusable
component - an inline SVG mark plus a "VPRO Skills EduTech" wordmark in
`font-display` - used in `PublicLayout.tsx`'s and `AdminLayout.tsx`'s
headers and in the home page hero, sized via a `size` prop instead of
shipping an external image asset.

**Responsive nav.** `PublicLayout.tsx`'s header (My Courses / My Results /
Admin / name / Log out) gets a `useState`-toggled hamburger menu below the
`sm` breakpoint - no library, same convention as the rest of the app's
interactive UI. `AdminLayout.tsx`'s four-item nav uses `flex-wrap` instead,
since four short labels don't need a full hamburger treatment.

**Focus visibility.** Rather than repeating `focus-visible:ring-*` utility
classes on every button/link/input across every page (easy to miss on a
future page), one global rule in `index.css` styles
`:focus-visible` for every `button`/`a`/`input`/`select`/`textarea`
site-wide with a brand-colored outline. Both layouts also add a "Skip to
main content" link (visually hidden until focused - the `.skip-link`
class in `index.css`), targeting `id="main-content"` /
`id="admin-main-content"` on each layout's main content area.

**Accessibility fix found while auditing for this phase**: none of the 7
`Admin*.tsx` pages' `<label>`/`<input>` pairs (built in Phase 8) used
`htmlFor`/`id` - `LoginPage.tsx` already did this correctly (Phase 5) and
`AssessmentPage.tsx`'s radio options use the valid wrapping-label pattern,
so the Admin pages were the one place this was missed. Fixed across all 7
pages: every standalone label now has a matching `htmlFor`/`id` pair.
Create-form fields use static ids (`create-course-name`); a course/topic/
question's per-row edit form can be open at the same time as the create
form, so its fields use ids keyed by that row's own id
(`` `edit-course-name-${course.id}` ``) to avoid DOM id collisions. A
handful of inputs never had a visible label at all - `AdminBatchesPage.tsx`'s
per-row edit form (placeholder text only) and `AdminResultsPage.tsx`'s two
filter `<select>`s - these got `aria-label` instead of a visible label,
since adding one would have changed the compact card/filter-bar layout
those pages were designed around.

**Button-group rows.** Every Admin list page's `flex items-start
justify-between` (or `items-center justify-between`) row - a card's text
next to 2-3 action buttons - became `flex flex-col gap-3 sm:flex-row
sm:items-start/center sm:justify-between`, so the buttons wrap below the
content on narrow screens instead of being squeezed or overflowing.

**Home page** (`HomePage.tsx`) was rewritten as an actual marketing page:
hero (`Logo`, headline, tagline, "Browse Courses"/"Student Login" CTAs), a
3-item "why train with us" value-prop section (honest, feature-grounded
copy - no invented student counts, testimonials, or placement stats), then
the original Phase 4 courses/batches fetch logic kept exactly as-is with
only the surrounding JSX restyled.


## Mobile app (Phase 10)

`mobile/` had only ever had its Phase 1 scaffold - a navigation skeleton
with placeholder Login/Dashboard screens and a `healthService.ts` proving
the app could reach the backend. This phase built the full student flow on
top of it: login, "My Courses" dashboard, course -> topics, one-question-
at-a-time MCQ assessment, immediate score, and "My Results" history +
detail. No backend changes - every screen consumes the same REST contract
the web app already uses (`GET /api/auth/me`, `GET /api/users/me/batches`,
`GET /api/courses/{id}`, `GET /api/courses/{id}/topics`,
`GET/POST /api/topics/{id}/assessment[/submit]`, `GET /api/results/`,
`GET /api/results/{id}`).

**Student-only scope.** The admin panel (Phase 8) was always a web-only
`/admin` section; the roadmap's Phase 10 wording ("full **student** flow")
confirms mobile doesn't need an admin equivalent. `mobile/src/types/index.ts`
only carries the student-relevant subset of `web/src/types/index.ts` - no
admin CRUD payload types.

**Token storage** uses `expo-secure-store` (encrypted on-device storage,
the Expo-recommended replacement for `localStorage` on native) instead of
web's `localStorage`-backed `tokenStorage.ts`. Same three-function shape
(`getToken`/`setToken`/`clearToken`) and the same try/catch-and-swallow
philosophy on write failure, but async throughout (`SecureStore` has no
synchronous API) - `apiClient.ts`'s request interceptor is an async
function for the same reason. This also means `AuthContext.tsx`'s
`isLoading` always starts `true` (the web version can start `false` when a
synchronous `localStorage` read at `useState` init proves there's no
stored token; there's no equivalent synchronous read here), flipping to
`false` once the rehydration effect's `SecureStore.getItemAsync` +
`GET /api/auth/me` round-trip resolves either way.

**Auth-gated navigation** uses two whole React Navigation stacks instead of
a per-route guard like web's `ProtectedRoute.tsx`: `RootNavigator.tsx`
renders an `AuthStack` (just `Login`) while `user` is `null`, an `AppStack`
(`Dashboard`/`Topics`/`Assessment`/`Results`/`ResultDetail`, typed via
`AppStackParamList`) once `user` is set, and a centered `ActivityIndicator`
while `isLoading`. React Navigation unmounts/remounts the right stack
automatically when `user` changes, so login/logout never need a manual
`navigation.reset()` call - the same "declarative redirect, no imperative
navigation" property `ProtectedRoute.tsx` has on web.

**`theme/colors.ts`** ports the Phase 9 brand palette as plain hex
constants (same values as `web/src/index.css`'s `@theme` block) since React
Native has no Tailwind; every screen's `StyleSheet.create` references these
so the mobile app matches the Phase 9 web redesign's brand identity rather
than shipping unstyled defaults.

**`AssessmentScreen.tsx`** disables the header back button and swipe-back
gesture (`headerBackVisible: false`, `gestureEnabled: false`) for the
duration of an in-progress attempt, re-enabling both once a result exists -
a small platform-appropriate addition beyond the web page's behavior, since
an accidental swipe-back gesture is a much easier way to lose an
in-progress attempt's local-only state on a touchscreen than an equivalent
stray click is on web.

**EAS Build.** `mobile/eas.json` defines standard `development`/`preview`/
`production` build profiles. Actually running a build (`eas build`) needs
the user's own Expo account login (`eas login`) - that's documented in
`docs/SETUP.md`'s mobile section rather than executed as part of this
phase, since it's an interactive, credential-bearing step no one but the
user can do.

**Verification note:** this sandbox has no `adb`/`emulator` on PATH, so the
app was never actually launched on a device/emulator from here - the same
class of limitation as "no live browser" for every web phase. Verification
was `npx tsc --noEmit` (clean) plus `npx expo export --platform android`
(Metro-bundled all 848 modules successfully, confirming every new
screen/service/context file's imports and syntax are valid - the `--no-bytecode`
flag was needed since this sandbox's Hermes native bytecode compiler binary
doesn't run here, an environment quirk unrelated to the app code itself)
plus a router-by-router cross-check of every new service function's
URL/method/payload against the actual backend, not just the web service it
was ported from.

## Testing (Phase 11)

Every phase through Phase 10 was verified by hand: a temporary SQLite-backed
`uvicorn` process driven with `curl`, written fresh each time and thrown
away afterward. That caught real bugs but left nothing behind to catch a
regression later. This phase replaces that with a permanent `pytest` suite
(`backend/tests/`, 33 tests) covering exactly the roadmap's four categories
- auth, authorization, scoring, cross-student-isolation - plus a fifth file
for two bugs already found and fixed by hand in earlier phases.

**Scope: backend-only.** Neither the web app nor the mobile app has a test
framework configured. None of the four roadmap categories describes
frontend behavior to test - the frontend only calls the API and renders
what it's told; it doesn't itself enforce auth, authorization, scoring, or
isolation. Introducing a frontend test framework wasn't implied by this
phase and isn't done here.

**Isolation.** `app.main.app`'s `get_db` dependency is overridden per test
(`backend/tests/conftest.py`) with a fresh in-memory SQLite engine
(`sqlite:///:memory:`, `StaticPool`, `check_same_thread=False` - the
standard FastAPI `TestClient` pattern for a single shared in-memory
connection), and `Base.metadata.create_all()` is run fresh for every single
test function. Nothing is shared between tests, and nothing touches the
real Postgres database from `docs/SETUP.md` step 1 - the suite can run
before that's even set up. The same `PRAGMA foreign_keys=ON` "connect"
event hook `app/database/session.py` registers on its own engine (so
`ON DELETE RESTRICT`/`CASCADE` are actually enforced under SQLite, added in
Phase 6) is re-registered on this separate test engine, since
`event.listens_for(engine, ...)` is tied to one specific engine object.
`DATABASE_URL`/`JWT_SECRET` are set via `os.environ.setdefault(...)` at the
top of `conftest.py`, before `app.main` is imported, so the suite is
self-contained and never depends on a developer's local `backend/.env`.

Auth is exercised through the real `POST /api/auth/login` endpoint (a
`login_as` fixture helper), not hand-crafted JWTs - this doubles as
coverage of the login path itself and matches how every real caller
actually gets a token. Test data comes from factory fixtures
(`make_admin`, `make_student`, `make_course`, `make_batch`, `make_topic`,
`make_question`, `enroll`) that insert directly via the ORM rather than
through admin API calls, keeping each test focused on the one thing it's
actually verifying.

**What's covered:**

- `test_auth.py` - login success/failure shapes; wrong password and a
  nonexistent email both return the identical generic 401 (no
  user-enumeration leak); an inactive account is rejected; `/api/auth/me`
  with no token, a garbage token, or a token for a since-deactivated user
  all return 401; a created user's `password_hash` is a real bcrypt hash,
  never the plaintext password.
- `test_authorization.py` - role gating (401 unauthenticated / 403 student
  / 200+ admin) across a representative admin-only endpoint from each of
  courses/batches/topics/users; enrollment gating on topic listing; results
  ownership gating (403 non-owner, 200 owner, 200 admin-for-anyone).
- `test_scoring.py` - submission always recomputes the score from the
  database regardless of what the client sends: a `selected_option_id`
  belonging to a different question counts as wrong rather than crashing
  or cross-matching; unanswered counts as wrong; client-supplied
  score-like fields in the request body are silently ignored (Pydantic v2
  drops unknown fields by default); the response's score/wrong_count/
  percentage match a hand-computed expectation for a known right/wrong/
  unanswered mix; `GET .../assessment` never exposes `is_correct` anywhere
  in its raw JSON, for a student or an admin; only students can submit; a
  non-enrolled student is blocked from both GET and submit; a topic with
  no active questions 404s on both.
- `test_cross_student_isolation.py` - one student's results/batches list
  never includes another's; a student gets 403 fetching another's result
  detail by id or attempting a topic only the other is enrolled in; two
  students attempting the same topic score independently; the admin
  results listing's `student_id` filter correctly isolates each student.
- `test_regressions.py` - permanent guards for two bugs from the "Admin
  panel / student management (Phase 8)" section above: the `/me/batches`
  routing collision (a student's `GET /api/users/me/batches` must return
  their own batches, not 403) and `delete_topic`'s missing
  `IntegrityError` handling (deleting a topic with an already-answered
  question 409s instead of an uncaught 500; deleting an untouched topic
  still 204s).

**Sanity-checked, not just written.** After the suite was complete, the
enrollment check in `topics/router.py`'s `list_topics` was temporarily
disabled and the suite re-run: `test_topics_listing_requires_enrollment_for_students`
failed as expected (200 instead of 403), confirming the suite actually
exercises the code path rather than passing vacuously. The change was then
reverted and the full suite re-confirmed green (33/33).

**Dependencies and running it.** Test-only dependencies (`pytest`,
`httpx` - the latter is `TestClient`'s actual HTTP layer, not pulled in by
the production `requirements.txt`) live in `backend/requirements-dev.txt`,
kept separate from production dependencies. `backend/pytest.ini` sets
`testpaths = tests` and `addopts = -p no:cacheprovider` (the latter avoids
a mounted-filesystem permission quirk in this sandbox - see
`backend/pytest.ini`'s own comment - unrelated to the tests). See
`docs/SETUP.md`'s "Running the backend test suite" section for the exact
commands.

## Deployment (Phase 12)

Every phase through Phase 11 left the deployment story at Phase 1's
original scaffold: `backend/Dockerfile` ran as root, applied no
migrations automatically, and had no healthcheck; `docker/docker-compose.yml`
was dev-only. This phase hardens the backend image for production use and
adds the backup/runbook documentation the roadmap calls for. Scope matches
`README.md`'s own tech-stack line - "Deployment: Docker (backend +
Postgres), static hosting for web" - so the web app gets deployment
*documentation* (see `docs/SETUP.md`'s "Deploying the web app" section),
not a Dockerfile; mobile deployment was already covered in Phase 10.

**`backend/Dockerfile`** gained three things, all additive to the
existing single-stage build (no multi-stage rewrite - the image already
installs only production dependencies and already had a `.dockerignore`):
a non-root `appuser` (`useradd --system`, then `chown -R` and `USER
appuser`) instead of running as root; a `HEALTHCHECK` against the existing
`GET /health` endpoint via a Python stdlib `urllib` one-liner rather than
`curl`/`wget`, so nothing extra needs installing into the slim image; and
an `ENTRYPOINT` pointing at the new `backend/docker-entrypoint.sh`, which
runs `alembic upgrade head` and then `exec`s whatever `CMD` the container
was actually started with. Before this, nothing applied migrations inside
the container - a fresh `docker compose up --build` against an empty
Postgres volume would start `uvicorn` against a database with no tables.
`alembic/env.py` already resolves `sqlalchemy.url` from
`get_settings().database_url`, which the container's `DATABASE_URL` env
var already correctly overrides, so no Alembic config changes were needed
- only the entrypoint script.

**`backend/app/main.py`** gained one small conditional: interactive API
docs (`/docs`, `/redoc`) and the raw OpenAPI schema (`/openapi.json`) are
now disabled when `settings.environment == "production"`, using the
`environment` field `app/core/config.py` already defined (previously only
surfaced read-only via `GET /health`, never used to change behavior). A
live Swagger UI on a production deployment is an avoidable disclosure of
the full API surface; this doesn't affect any existing test (`conftest.py`
never sets `ENVIRONMENT`, so it defaults to `"development"` there and docs
stay enabled) or local dev (same default).

**`docker/docker-compose.prod.yml`** is a new, self-contained compose file
for real deployments - not a partial override of `docker-compose.yml`,
because Compose merges list-valued keys like `ports` across `-f a -f b`
files by concatenation rather than replacement, so an override file cannot
reliably *remove* the dev file's exposed Postgres host port. Differences
from the dev file: no host port mapping for Postgres (only the `backend`
service needs to reach it, over the Docker network by service name);
Postgres user/password/db and the backend's `DATABASE_URL` come from
`${POSTGRES_USER}`/`${POSTGRES_PASSWORD}`/`${POSTGRES_DB}` (Compose's
built-in `docker/.env` interpolation, documented in the new
`docker/.env.example`) instead of hardcoded dev defaults, with a `:?`
Compose interpolation guard so `up` fails fast with a clear message if
`docker/.env` wasn't filled in; and `ENVIRONMENT=production` is set on the
backend service. `docker-compose.yml` itself is untouched and remains the
local-dev file `docs/SETUP.md` step 5 already documented.

**`docker/backup.sh`/`docker/restore.sh`** wrap `pg_dump`/`psql` against
whichever compose file's `postgres` service is actually running
(`COMPOSE_FILE` env var, defaulting to the production file), reading
credentials from `docker/.env` when present and falling back to the dev
file's defaults otherwise - so the same two scripts work against either
stack. Output lands in `docker/backups/` (new, gitignored - see
`docs/RUNBOOK.md` for why these files need their own storage/retention
policy rather than living only on the host disk). `restore.sh` prompts for
confirmation before running, since it's destructive against a database
that already has conflicting data.

**`docs/RUNBOOK.md`** (new) is the day-to-day operations doc this phase's
roadmap wording calls for: starting/stopping the stack, applying/rolling
back migrations, creating the first admin account, rotating `JWT_SECRET`
(and its consequence - every existing token is invalidated immediately,
since `app/auth/dependencies.py` verifies every token's signature against
the current secret on every request), backups/restores, health/monitoring,
and incident/rollback guidance.

**Verification note:** this sandbox has no `docker`/`docker compose` CLI
at all (confirmed directly - both report "command not found"), the same
class of limitation as Phase 10's "no adb/emulator". The new/changed files
were therefore verified without actually building or running a container:
`bash -n` on all three new shell scripts (clean), `docker-compose.prod.yml`
confirmed to be valid YAML via Python's `yaml.safe_load` (Compose-specific
schema semantics can't be checked without the CLI), the Dockerfile changes
hand-traced instruction by instruction, the full Phase 11 test suite
(33 tests) re-run to confirm the `main.py` change didn't break anything,
and the one real behavior change (docs enabled/disabled) verified
in-process by importing `app.main.app` with and without
`ENVIRONMENT=production` set and checking `docs_url`/`redoc_url`.

**Real bug found once the user actually ran this with Docker (post-Phase-12):**
`backend/Dockerfile` copied `app/`, `alembic/`, and `alembic.ini` into the
image but never `backend/scripts/` - so `docker compose exec backend
python -m scripts.create_user ...` (the documented way to bootstrap the
first admin account, see `docs/SETUP.md`/`docs/RUNBOOK.md`) failed with
`ModuleNotFoundError: No module named 'scripts'` inside the container,
even though the exact same command works fine outside Docker (local venv).
This bug predates Phase 12 - the `scripts/` folder was never copied in
since the Dockerfile was first written in Phase 1 - but nothing caught it
until now because every phase's own verification ran the app directly via
a local venv, never through an actual built container (this sandbox has no
Docker - see the verification note above). Fixed by adding `COPY scripts
./scripts` to the Dockerfile, alongside the existing `app`/`alembic`
copies. Rebuild the image (`docker compose up --build`) to pick up the fix.

## CI/CD (Jenkins)

A `Jenkinsfile` at the repo root defines the pipeline: backend `pytest`,
web `tsc` build + `oxlint`, then a `docker build` of the backend image
(all on Jenkins' own agent - no live Postgres needed, since the backend
test suite runs against an in-memory SQLite fixture, see
`backend/tests/conftest.py`). An optional, parameter-gated final stage
tags and pushes that image to Docker Hub once a `dockerhub-credentials`
Jenkins credential exists; a placeholder `Deploy` stage stands in for the
future AWS step.

Jenkins itself runs locally via `docker/docker-compose.jenkins.yml`,
built from `docker/jenkins/Dockerfile` (`jenkins/jenkins:lts-jdk17` plus
the Docker CLI, Python 3, and Node.js 20, with the needed plugins baked
in via `jenkins-plugin-cli`). It talks to the *host's* Docker daemon
through a `/var/run/docker.sock` bind-mount ("Docker outside of Docker")
rather than running its own nested daemon.

Full step-by-step setup - pushing to GitHub with a Personal Access Token,
first Jenkins login, adding credentials, creating the pipeline job, and
wiring the GitHub webhook through ngrok (since a local Jenkins has no
public URL of its own) - lives in `docs/CICD.md`, kept separate from this
file since it's an operational walkthrough rather than a design record.
Every step in it that needs a GitHub/Docker Hub/ngrok credential is
written as something the developer runs themselves; nothing in this
repo's automation handles or stores those credentials.

**Verification note:** same class of limitation as the Deployment (Phase
12) section above - this sandbox has no `docker` CLI, so the Jenkins
image/compose file couldn't be built or run here. Verified instead via
`yaml.safe_load` on `docker-compose.jenkins.yml`, a hand-trace of the
Dockerfile and Jenkinsfile against how `docker-compose.yml`/
`docker-compose.prod.yml` already do the equivalent (matching port/volume
conventions), and confirming the backend test suite genuinely needs no
live database (it uses an in-memory SQLite engine per test, not the
`postgres` service) so the pipeline's test stage is correct without one.
