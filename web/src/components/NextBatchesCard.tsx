import { Link } from 'react-router-dom'
import CtaLink from './CtaLink'
import { useSchedule } from '../utils/schedule'
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

export default function NextBatchesCard() {
  const { rows, liveNow } = useSchedule()
  const upcoming = (rows ?? []).filter((row) => row.state === 'today' || row.state === 'upcoming')

  if (!rows) return null

  // Nothing scheduled and nothing on air: render no card at all rather than an
  // empty bordered box. The hero's copy stands on its own.
  if (upcoming.length === 0 && !liveNow) return null

  return (
    <div className="bg-[color:var(--ink-2)] p-8 shadow-[inset_0_0_0_1px_var(--rule)] lg:p-10">
      {upcoming.length > 0 && (
        <>
          <p className="eyebrow">Next batches</p>
          <ul className="mt-6 space-y-8">
            {upcoming.slice(0, 2).map((row) => (
              <li key={row.batch.id} className="border-b border-[color:var(--rule)] pb-8">
                <p className="display text-[1.35rem]">{row.batch.course_name}</p>
                <p className="mono mt-2 text-[color:var(--on-ink-faint)]">
                  Starts {longDate(row.batch.start_date)}
                </p>
                <p className="mt-2 text-sm text-[color:var(--on-ink-mute)]">
                  {row.batch.batch_number} · {hourWindow(row)} IST · {row.batch.trainer_name}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <CtaLink
                    cta="register_now"
                    chapter="hero"
                    course={row.batch.course_name}
                    className="btn-primary"
                  >
                    Register now
                  </CtaLink>
                  <Link to="/batches" className="btn-secondary">
                    All batches
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {liveNow && (
        <div className={upcoming.length > 0 ? 'mt-8' : ''}>
          <p className="eyebrow">On air now</p>
          <p className="display mt-3 text-[1.35rem]">{liveNow.batch.course_name}</p>
          <p className="mt-2 text-sm text-[color:var(--on-ink-mute)]">
            {liveNow.batch.batch_number} · {hourWindow(liveNow)} IST · {liveNow.batch.trainer_name}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/courses" className="btn-primary">
              View this course
            </Link>
            <CtaLink
              cta="sit_in_on_a_class"
              chapter="hero"
              course={liveNow.batch.course_name}
              className="btn-secondary"
            >
              Sit in on a class
            </CtaLink>
          </div>
        </div>
      )}
    </div>
  )
}
