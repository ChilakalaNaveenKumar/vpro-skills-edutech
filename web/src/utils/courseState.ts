import { hourRange } from './hours'
import type { ScheduleRow } from './schedule'

export type CourseState = 'In session' | 'Gathering interest'

/** One running batch, in the three shapes the UI needs it in. */
export interface CourseBatch {
  /** "Batch A-04" */
  number: string
  /** "Weekdays", or empty when the batch does not say. */
  days: string
  /** "19:30 – 21:00 IST" */
  hour: string
  /** "Weekdays 19:30 – 21:00 IST", or just the hour when days are unset. */
  daysHour: string
  /** "Batch A-04, started 6 Aug" */
  note: string
  /** Everything a WhatsApp reply needs: number, hour and both dates. */
  line: string
}

// A batch that is teaching, mid-run, or starting later today all mean the same
// thing to a visitor: this course is running. 'upcoming' does not - the batch
// has not begun, so the course is still gathering people.
const RUNNING_STATES: ReadonlySet<ScheduleRow['state']> = new Set(['live', 'today', 'running'])

// A course can have more than one batch teaching at once - a morning cohort and
// an evening one is the normal case for a training centre. This used to be a
// `.find`, so the second cohort was silently invisible: its hour never appeared
// on the shelf and its number never reached the message a visitor sent us.
function runningRows(courseName: string, rows: ScheduleRow[] | null): ScheduleRow[] {
  if (!rows) return []
  return rows.filter(
    (row) =>
      row.batch.course_name === courseName &&
      row.batch.progress_status !== 'COMPLETED' &&
      RUNNING_STATES.has(row.state),
  )
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Every batch of this course that is teaching right now, in schedule order. */
export function courseBatches(courseName: string, rows: ScheduleRow[] | null): CourseBatch[] {
  return runningRows(courseName, rows).map((row) => {
    // The comp says "Weekdays 7:30 - 9:00 PM"; `Batch` carries no day-of-week
    // field, so the window is rendered without inventing which days it falls on.
    const hour = hourRange(row.batch.start_time, row.batch.end_time)
    const days = row.batch.days_of_week ?? ''
    return {
      number: row.batch.batch_number,
      days,
      hour,
      daysHour: days ? `${days} ${hour}` : hour,
      note: `${row.batch.batch_number}, started ${shortDate(row.batch.start_date)}`,
      line: `${row.batch.batch_number}, ${hour}, ${shortDate(row.batch.start_date)} to ${shortDate(row.batch.end_date)}`,
    }
  })
}

// Derived, never stored. A `state` column on courses.ts would drift the moment
// a batch ended and nobody remembered to edit it.
export function courseStateFor(courseName: string, rows: ScheduleRow[] | null): CourseState {
  return runningRows(courseName, rows).length > 0 ? 'In session' : 'Gathering interest'
}
