import { Link } from 'react-router-dom'
import CtaLink from './CtaLink'
import { courseByName } from '../content/courses'
import { nowInIst, useSchedule } from '../utils/schedule'
import type { ScheduleRow } from '../utils/schedule'

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
}

function hourWindow(row: ScheduleRow): string {
  return `${row.batch.start_time.slice(0, 5)} – ${row.batch.end_time.slice(0, 5)}`
}

// The schedule classifies in IST, so this must too - otherwise a visitor
// abroad sees a different set of batches from the one the schedule means.
// `state === 'today'` covers both "starts today" and "a session runs later
// today in a batch that began weeks ago", so the start date settles which.
function istTodayIso(): string {
  const { date } = nowInIst()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function coursePath(courseName: string): string {
  const slug = courseByName(courseName)?.slug
  return slug ? `/courses/${slug}` : '/courses'
}

export default function NextBatchesCard() {
  const { rows, liveNow } = useSchedule()
  const today = istTodayIso()
  const upcoming = (rows ?? []).filter(
    (row) =>
      row.state === 'upcoming' || (row.state === 'today' && row.batch.start_date === today),
  )

  if (!rows) return null

  // Nothing scheduled and nothing on air: render no panel at all rather than an
  // empty bordered box. The hero's copy stands on its own.
  if (upcoming.length === 0 && !liveNow) return null

  return (
    <div className="flex flex-col gap-[14px] bg-[color:var(--ink-2)] px-[30px] py-[26px] shadow-[inset_0_0_0_1px_rgb(237_231_222_/_0.2)]">
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
                  {row.batch.batch_number} · {hourWindow(row)} IST · {row.batch.trainer_name}
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <CtaLink
                  cta="register_now"
                  chapter="hero"
                  course={row.batch.course_name}
                  className="btn-primary btn-compact"
                >
                  Register now
                </CtaLink>
                <Link to={coursePath(row.batch.course_name)} className="btn-secondary btn-compact">
                  View course
                </Link>
              </div>
            </div>
          ))}
        </>
      )}

      {liveNow && (
        <div>
          <p className="mono mb-2 text-[color:var(--on-ink-faint)]">On air now</p>
          <p className="display-sm mb-[5px] text-[clamp(21px,1.8vw,25px)] text-[color:var(--on-ink)]">
            {liveNow.batch.course_name}
          </p>
          <p className="text-[13.5px] leading-[1.45] text-[color:var(--on-ink-faint)]">
            {liveNow.batch.batch_number} · {hourWindow(liveNow)} IST · {liveNow.batch.trainer_name}
          </p>
        </div>
      )}

      {liveNow && (
        <div className="flex flex-wrap gap-[10px]">
          <Link to={coursePath(liveNow.batch.course_name)} className="btn-primary">
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
