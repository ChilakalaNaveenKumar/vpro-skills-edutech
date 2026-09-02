import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBatches } from '../services/batchesService'
import { courseByName } from '../content/courses'
import type { Batch } from '../types'

function parseDate(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Minutes since midnight, from an "HH:MM" or "HH:MM:SS" string. */
function minutes(time: string): number | null {
  const parts = time.split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return null
  return parts[0] * 60 + parts[1]
}

/** Now, in IST, regardless of the visitor's own timezone. */
function nowInIst(): { date: Date; minuteOfDay: number } {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return { date: ist, minuteOfDay: ist.getHours() * 60 + ist.getMinutes() }
}

type State = 'live' | 'today' | 'running' | 'upcoming'

interface Row {
  batch: Batch
  state: State
  slug?: string
}

function classify(batch: Batch): Row | null {
  if (batch.status !== 'ACTIVE') return null
  const start = parseDate(batch.start_date)
  const end = parseDate(batch.end_date)
  if (!start || !end) return null

  const { date, minuteOfDay } = nowInIst()
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const from = minutes(batch.start_time)
  const to = minutes(batch.end_time)
  const slug = courseByName(batch.course_name)?.slug

  const withinRun = today.getTime() >= start.getTime() && today.getTime() <= end.getTime()

  if (withinRun && from !== null && to !== null && minuteOfDay >= from && minuteOfDay < to) {
    return { batch, state: 'live', slug }
  }
  if (withinRun && from !== null && minuteOfDay < from) return { batch, state: 'today', slug }
  if (withinRun) return { batch, state: 'running', slug }
  if (start.getTime() > today.getTime()) return { batch, state: 'upcoming', slug }
  return null
}

const ORDER: Record<State, number> = { live: 0, today: 1, running: 2, upcoming: 3 }

const LABEL: Record<State, string> = {
  live: 'Live now',
  today: 'Starts today',
  running: 'In progress',
  upcoming: 'Upcoming',
}

// The real schedule: what is teaching right now, what starts today, what is
// mid-run, and what is next. Batches come from the admin panel, so this panel
// changes when the schedule changes and never needs editing here.
export default function LiveClassesPanel() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let mounted = true
    listBatches()
      .then((batches) => {
        if (!mounted) return
        const classified = batches
          .map(classify)
          .filter((row): row is Row => row !== null)
          .sort((a, b) => {
            const byState = ORDER[a.state] - ORDER[b.state]
            if (byState !== 0) return byState
            return a.batch.start_date.localeCompare(b.batch.start_date)
          })
        setRows(classified)
      })
      .catch(() => {
        if (mounted) setFailed(true)
      })
    return () => {
      mounted = false
    }
  }, [])

  const liveCount = rows?.filter((row) => row.state === 'live').length ?? 0

  return (
    <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)] p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {liveCount > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--signal)] opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                liveCount > 0 ? 'bg-[color:var(--signal)]' : 'bg-[color:var(--on-ink-faint)]'
              }`}
            />
          </span>
          <h2 className="display text-[1.2rem] text-[color:var(--on-ink)]">
            {liveCount > 0 ? `${liveCount} class${liveCount > 1 ? 'es' : ''} teaching now` : 'Class schedule'}
          </h2>
        </div>
        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
          All times IST
        </p>
      </div>

      {rows === null && !failed && (
        <p className="mt-6 text-[0.9rem] text-[color:var(--on-ink-faint)]">Loading the schedule...</p>
      )}

      {failed && (
        <p className="mt-6 text-[0.9rem] text-[color:var(--on-ink-mute)]">
          The schedule is not reachable right now. Message us on WhatsApp for the next batch and we
          will send the dates.
        </p>
      )}

      {rows !== null && rows.length === 0 && (
        <p className="mt-6 text-[0.9rem] text-[color:var(--on-ink-mute)]">
          No batches are scheduled yet. Message us and we will tell you when the next one opens.
        </p>
      )}

      {rows !== null && rows.length > 0 && (
        <ul className="mt-6 space-y-px">
          {rows.slice(0, 6).map((row) => (
            <li
              key={row.batch.id}
              className="border-t border-[color:var(--rule)] py-4 last:border-b"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {row.slug ? (
                      <Link
                        to={`/courses/${row.slug}`}
                        className="text-[0.98rem] font-medium text-[color:var(--on-ink)] underline decoration-[color:var(--rule)] underline-offset-4 hover:decoration-[color:var(--signal)]"
                      >
                        {row.batch.course_name}
                      </Link>
                    ) : (
                      <span className="text-[0.98rem] font-medium text-[color:var(--on-ink)]">
                        {row.batch.course_name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] ${
                        row.state === 'live'
                          ? 'bg-[color:var(--signal)] text-[color:var(--ink)]'
                          : 'border border-[color:var(--rule)] text-[color:var(--on-ink-faint)]'
                      }`}
                    >
                      {LABEL[row.state]}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.78rem] text-[color:var(--on-ink-faint)]">
                    Batch {row.batch.batch_number} &middot; {row.batch.trainer_name}
                  </p>
                </div>
                <p className="tnum shrink-0 text-[0.82rem] text-[color:var(--on-ink-mute)]">
                  {row.batch.start_time.slice(0, 5)}&ndash;{row.batch.end_time.slice(0, 5)}
                  <span className="text-[color:var(--on-ink-faint)]">
                    {' '}&middot; from {row.batch.start_date}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
