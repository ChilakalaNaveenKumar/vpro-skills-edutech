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

  return (
    <div className="flex flex-col gap-[14px] bg-[color:var(--ink-2)] px-[30px] py-[26px] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)] max-[900px]:gap-4 max-[900px]:px-[22px] max-[900px]:py-6">
      {upcoming.length > 0 && (
        <>
          <p className="eyebrow">Next batches</p>

          {upcoming.slice(0, 2).map((row) => (
            <div
              key={row.batch.id}
              className="flex flex-wrap items-center justify-between gap-5 pb-[18px] shadow-[inset_0_-1px_0_0_var(--rule)]"
            >
              <div className="min-w-0">
                <p className="display-sm mb-1 text-[clamp(19px,1.5vw,23px)] leading-[1.14] text-[color:var(--on-ink)]">
                  {row.batch.course_name}
                </p>
                <p className="mono mb-[5px] text-[12px] tracking-[0.1em] text-[color:var(--tan)]">
                  Starts {longDate(row.batch.start_date)}
                </p>
                <p className="text-[13.5px] leading-[1.45] text-[color:var(--on-ink-faint)]">
                  {row.batch.batch_number}, {hourWindow(row)}, {row.batch.trainer_name}
                </p>
                <SeatsNote row={row} className="mt-[5px] block text-[13.5px]" />
              </div>
              <div className="flex flex-none gap-2 max-[900px]:w-full [&>*]:max-[900px]:min-h-[46px] [&>*]:max-[900px]:flex-1">
                <CtaLink
                  cta="register_now"
                  chapter="hero"
                  course={row.batch.course_name}
                  className="btn-primary btn-compact"
                >
                  Register now
                </CtaLink>
                <Link to={coursePath(courses, row.batch.course_name)} className="btn-secondary btn-compact">
                  View course
                </Link>
              </div>
            </div>
          ))}
        </>
      )}

      {running && (
        <div>
          <p className="mono mb-2 text-[color:var(--on-ink-faint)]">
            {running.state === 'live' ? 'On air now' : 'In session'}
          </p>
          <p className="display-sm mb-[5px] text-[clamp(21px,1.8vw,25px)] text-[color:var(--on-ink)]">
            {running.batch.course_name}
          </p>
          <p className="text-[13.5px] leading-[1.45] text-[color:var(--on-ink-faint)]">
            {running.batch.batch_number}, {hourWindow(running)}, {running.batch.trainer_name}
          </p>
        </div>
      )}

      {running && (
        <div className="flex flex-wrap gap-[10px]">
          <Link to={coursePath(courses, running.batch.course_name)} className="btn-primary">
            View this course
          </Link>
          <Link to="/batches" className="btn-secondary">
            Reserve my seat
          </Link>
        </div>
      )}
    </div>
  )
}
