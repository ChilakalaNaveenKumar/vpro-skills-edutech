import { Link } from 'react-router-dom'
import CtaLink from './CtaLink'
import SeatsNote from './SeatsNote'
import { findByName, useCourses } from '../hooks/useCourses'
import { hourRange } from '../utils/hours'
import { istTodayIso, useSchedule } from '../utils/schedule'
import type { ScheduleRow } from '../utils/schedule'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

function hourWindow(row: ScheduleRow): string {
  const window = hourRange(row.batch.start_time, row.batch.end_time)
  // Only says "Weekdays" when a batch actually carries the field - the comp's
  // wording, without inventing which days an unset batch runs on.
  return row.batch.days_of_week ? `${row.batch.days_of_week}, ${window}` : window
}

function coursePath(courses: ReturnType<typeof useCourses>, courseName: string): string {
  const slug = findByName(courses, courseName)?.slug
  return slug ? `/courses/${slug}` : '/courses'
}

// The two kinds of entry used to be written out separately, and drifted: one
// pair of buttons was compact and the other full size, the same destination was
// called "View course" in one and "View this course" in the other, and the
// copper fill sat on the booking action in one and on the browsing link in the
// other, so colour stopped meaning anything. One renderer, so they cannot
// disagree again.
function BatchEntry({
  row,
  running,
  coursesHref,
}: {
  row: ScheduleRow
  running: boolean
  coursesHref: string
}) {
  const status = running
    ? row.state === 'live'
      ? 'On air now'
      : 'In session'
    : `Starts ${longDate(row.batch.start_date)}`

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="min-w-0">
        <p
          className="mono mb-[7px] text-[12px] tracking-[0.1em]"
          style={{ color: running ? 'var(--signal)' : 'var(--tan)' }}
        >
          {status}
        </p>
        <p className="display-sm mb-[5px] text-[clamp(19px,1.5vw,23px)] leading-[1.14] text-[color:var(--on-ink)]">
          {row.batch.course_name}
        </p>
        <p className="text-[13.5px] leading-[1.45] text-[color:var(--on-ink-faint)]">
          {row.batch.batch_number}, {hourWindow(row)}, {row.batch.trainer_name}
        </p>
        <SeatsNote row={row} className="mt-[5px] block text-[13.5px]" />
      </div>

      {/* A two-column grid rather than a flex row: the pair then has one width
          whatever the labels say, instead of each button sizing to its own text
          and the two entries ending up visibly different. */}
      <div className="grid grid-cols-2 gap-2">
        <CtaLink
          cta={running ? 'reserve_seat' : 'register_now'}
          chapter="hero"
          course={row.batch.course_name}
          batch={row.batch.batch_number}
          className="btn-primary btn-compact w-full"
        >
          {running ? 'Reserve my seat' : 'Register now'}
        </CtaLink>
        <Link to={coursesHref} className="btn-secondary btn-compact w-full">
          View course
        </Link>
      </div>
    </div>
  )
}

export default function NextBatchesCard() {
  const { rows, liveNow } = useSchedule()
  const courses = useCourses()
  const today = istTodayIso()
  const upcoming = (rows ?? []).filter(
    (row) =>
      row.state === 'upcoming' || (row.state === 'today' && row.batch.start_date === today),
  )

  // A batch that is teaching stays in the hero all day, not only during its
  // 90-minute window. `liveNow` is true only while a session is actually in
  // progress, so on its own it hid the running batch for ~22 hours a day.
  const running =
    liveNow ??
    (rows ?? []).find(
      (row) =>
        row.state === 'running' || (row.state === 'today' && row.batch.start_date !== today),
    ) ??
    null

  if (!rows) return null

  // Nothing scheduled and nothing running: render no panel at all rather than an
  // empty bordered box. The hero's copy stands on its own.
  if (upcoming.length === 0 && !running) return null

  const entries = [
    ...upcoming.slice(0, 2).map((row) => ({ row, running: false })),
    ...(running ? [{ row: running, running: true }] : []),
  ]

  // The panel deliberately shows at most two upcoming batches plus whatever is
  // teaching. When that is not all of them, the link has to say so - otherwise
  // a course with a third cohort looks like it does not have one.
  const total = rows.length
  const hidden = total - entries.length

  return (
    <div className="flex flex-col gap-[18px] bg-[color:var(--ink-2)] px-[30px] py-[26px] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)] max-[900px]:gap-4 max-[900px]:px-[22px] max-[900px]:py-6">
      <p className="eyebrow">{upcoming.length > 0 ? 'Next batches' : 'Running now'}</p>

      {entries.map((entry, index) => (
        <div
          key={entry.row.batch.id}
          className={
            index < entries.length - 1 ? 'pb-[18px] shadow-[inset_0_-1px_0_0_var(--rule)]' : ''
          }
        >
          <BatchEntry
            row={entry.row}
            running={entry.running}
            coursesHref={coursePath(courses, entry.row.batch.course_name)}
          />
        </div>
      ))}

      <Link
        to="/batches"
        className="group mt-[2px] inline-flex items-center gap-2.5 self-start text-[13.5px] text-[color:var(--on-ink)] transition-colors duration-[240ms] ease-[var(--ease-state)] hover:text-[color:var(--signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        {hidden > 0
          ? `See the dates and timings of all ${total} batches`
          : 'See the dates and timings of every batch'}
        <span
          aria-hidden="true"
          className="transition-transform duration-[240ms] ease-[var(--ease-state)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        >
          →
        </span>
      </Link>
    </div>
  )
}
