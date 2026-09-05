import type { ScheduleRow } from './schedule'

export type CourseState = 'In session' | 'Gathering interest'

// A batch that is teaching, mid-run, or starting later today all mean the same
// thing to a visitor: this course is running. 'upcoming' does not - the batch
// has not begun, so the course is still gathering people.
const RUNNING_STATES: ReadonlySet<ScheduleRow['state']> = new Set(['live', 'today', 'running'])

function runningRow(courseName: string, rows: ScheduleRow[] | null): ScheduleRow | null {
  if (!rows) return null
  return (
    rows.find(
      (row) =>
        row.batch.course_name === courseName &&
        row.batch.progress_status !== 'COMPLETED' &&
        RUNNING_STATES.has(row.state),
    ) ?? null
  )
}

// Derived, never stored. A `state` column on courses.ts would drift the moment
// a batch ended and nobody remembered to edit it.
export function courseStateFor(courseName: string, rows: ScheduleRow[] | null): CourseState {
  return runningRow(courseName, rows) ? 'In session' : 'Gathering interest'
}

/** e.g. "Batch A-04 · started 4 Aug". Null when nothing is running. */
export function courseStateNote(courseName: string, rows: ScheduleRow[] | null): string | null {
  const row = runningRow(courseName, rows)
  if (!row) return null
  const started = new Date(`${row.batch.start_date}T00:00:00`)
  const label = started.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${row.batch.batch_number} · started ${label}`
}
