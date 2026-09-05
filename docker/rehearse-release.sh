#!/usr/bin/env bash
# Rehearses a release against a copy of the real database, so you can see
# exactly what the migrations and the content seeds do to live data before
# any of it runs for real.
#
# Nothing here can touch production. It restores a dump into a throwaway
# Postgres container on a spare port, does the whole upgrade-and-seed
# sequence there, and prints what changed. The container is destroyed on the
# way out.
#
# Usage:
#   ./backup.sh                                  # on the production box
#   scp ...                                      # bring the dump here
#   ./rehearse-release.sh backups/vpro_skills_20260905_120000.sql
#
# Requires: docker, and backend/.venv (see docs/SETUP.md).
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -ne 1 ]; then
    echo "Usage: $0 <path-to-backup.sql>" >&2
    exit 1
fi
DUMP="$1"
[ -f "$DUMP" ] || { echo "No such dump: $DUMP" >&2; exit 1; }

BACKEND="$(cd .. && pwd)/backend"
VENV="$BACKEND/.venv/bin"
[ -x "$VENV/alembic" ] || {
    echo "backend/.venv not found or incomplete - see docs/SETUP.md" >&2
    exit 1
}

CONTAINER="vpro-rehearsal"
PORT="${REHEARSAL_PORT:-55432}"
WORK="$(mktemp -d)"
cleanup() {
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    rm -rf "$WORK"
}
trap cleanup EXIT

export DATABASE_URL="postgresql+psycopg2://vpro:rehearsal@localhost:${PORT}/vpro_skills"
# The app's Settings refuses to construct without these; their values are
# irrelevant to a schema-and-content rehearsal.
export JWT_SECRET="rehearsal-only"
export CORS_ORIGINS="http://localhost:5173"

# A snapshot small enough to eyeball and stable enough to diff. Counts catch
# anything appearing or vanishing wholesale; the per-row listings catch the
# subtler damage - a topic quietly retired, a course's copy rewritten.
cat > "$WORK/snapshot.sql" <<'SQL'
\pset footer off
\pset tuples_only on
SELECT '-- row counts';
SELECT format('%-22s %s', table_name, n) FROM (
    SELECT 'users' AS table_name, count(*) AS n FROM users
    UNION ALL SELECT 'courses', count(*) FROM courses
    UNION ALL SELECT 'batches', count(*) FROM batches
    UNION ALL SELECT 'student_batches', count(*) FROM student_batches
    UNION ALL SELECT 'topics', count(*) FROM topics
    UNION ALL SELECT 'assessments', count(*) FROM assessments
    UNION ALL SELECT 'questions', count(*) FROM questions
    UNION ALL SELECT 'assessment_attempts', count(*) FROM assessment_attempts
) t ORDER BY table_name;

SELECT '';
SELECT '-- courses (id, name, status)';
SELECT format('%-4s %-40s %s', id, name, status) FROM courses ORDER BY id;

SELECT '';
SELECT '-- topics (id, course, name, status) - the curriculum seed rewrites these';
SELECT format('%-5s %-4s %-45s %s', t.id, t.course_id, t.name, t.status)
FROM topics t ORDER BY t.id;

SELECT '';
SELECT '-- student results, which must never change';
SELECT format('attempt %-5s student=%-5s assessment=%-5s topic=%-5s %s%%',
              id, student_id, assessment_id, topic_id, percentage)
FROM assessment_attempts ORDER BY id;
SQL

snapshot() {
    docker exec -i "$CONTAINER" psql -U vpro -d vpro_skills -q -f - < "$WORK/snapshot.sql"
}

echo "==> starting throwaway Postgres on port $PORT"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
    -e POSTGRES_USER=vpro -e POSTGRES_PASSWORD=rehearsal -e POSTGRES_DB=vpro_skills \
    -p "${PORT}:5432" postgres:16-alpine >/dev/null
for _ in $(seq 1 60); do
    docker exec "$CONTAINER" pg_isready -U vpro -d vpro_skills >/dev/null 2>&1 && break
    sleep 1
done

echo "==> restoring $DUMP"
docker exec -i "$CONTAINER" psql -U vpro -d vpro_skills -q -v ON_ERROR_STOP=1 < "$DUMP"

echo "==> revision this dump is at"
(cd "$BACKEND" && "$VENV/alembic" current 2>&1 | grep -v '^INFO' || true)

snapshot > "$WORK/before.txt"

echo "==> applying migrations"
(cd "$BACKEND" && "$VENV/alembic" upgrade head 2>&1 | grep -E 'Running upgrade|ERROR' || true)

echo "==> seeding site content"
(cd "$BACKEND" && "$VENV/python" -m scripts.seed_site_content || true)

echo "==> seeding curriculum"
(cd "$BACKEND" && "$VENV/python" -m scripts.seed_curriculum || true)

snapshot > "$WORK/after.txt"

echo
echo "============================================================"
echo " What the release did to this copy of the data"
echo "============================================================"
if diff -u "$WORK/before.txt" "$WORK/after.txt" > "$WORK/diff.txt"; then
    echo "Nothing changed at all - check the migrations actually ran."
else
    sed -n '3,$p' "$WORK/diff.txt"
fi

echo
echo "-- content the seeds loaded --"
docker exec "$CONTAINER" psql -U vpro -d vpro_skills -Atc "
SELECT 'testimonials='||count(*) FROM testimonials
UNION ALL SELECT 'faqs='||count(*) FROM faqs
UNION ALL SELECT 'tenets='||count(*) FROM tenets
UNION ALL SELECT 'batch_loop_steps='||count(*) FROM batch_loop_steps
UNION ALL SELECT 'site_content='||count(*) FROM site_content
UNION ALL SELECT 'course_projects='||count(*) FROM course_projects
UNION ALL SELECT 'leads='||count(*) FROM leads;"

echo
echo "Read the diff above with two questions in mind:"
echo "  1. Did any assessment_attempt line change? It must not - those are"
echo "     student results."
echo "  2. Did a topic you rely on go INACTIVE or disappear? That means it is"
echo "     missing from backend/scripts/curriculum.json, and the running"
echo "     batch's syllabus would change. Fix the JSON, not the database."
