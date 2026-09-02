import { useSchedule } from '../utils/schedule'
import CtaLink from './CtaLink'

// A marquee at the very top carrying what is actually running right now.
//
// Every value comes from the batches API, so the bar is either true or absent -
// it renders nothing at all when there is no active or upcoming batch, rather
// than announcing a class that is not happening.
export default function LiveTicker() {
  const { liveNow, nextUp } = useSchedule()
  const row = liveNow ?? nextUp
  if (!row) return null

  const { batch } = row
  const from = batch.start_time.slice(0, 5)
  const to = batch.end_time.slice(0, 5)

  const message = liveNow
    ? `Live right now - ${batch.course_name}, batch ${batch.batch_number}, running daily ${from} to ${to} IST with ${batch.trainer_name}`
    : `Next live class - ${batch.course_name}, batch ${batch.batch_number}, daily ${from} to ${to} IST from ${batch.start_date}, with ${batch.trainer_name}`

  return (
    <div className="relative z-50 flex items-center gap-4 border-b border-[color:var(--rule)] bg-[color:var(--ink-2)] py-2 pl-4 pr-2 sm:pl-6">
      {liveNow && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--signal)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--signal)]" />
        </span>
      )}

      {/* The marquee is decorative motion over text that is already complete,
          so the same sentence is announced once to assistive technology. */}
      <div className="ticker min-w-0 flex-1 overflow-hidden">
        <p className="sr-only">{message}</p>
        <div className="ticker-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy} className="ticker-item">
              {[0, 1, 2].map((repeat) => (
                <span key={repeat} className="pr-16 text-[0.74rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-mute)]">
                  {message}
                  <span className="px-6 text-[color:var(--signal)]">&bull;</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <CtaLink
        cta="demo_register"
        chapter="ticker"
        className="shrink-0 rounded-full bg-[color:var(--signal)] px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[color:var(--ink)] transition-[filter] duration-200 hover:brightness-110"
      >
        Register now
      </CtaLink>
    </div>
  )
}
