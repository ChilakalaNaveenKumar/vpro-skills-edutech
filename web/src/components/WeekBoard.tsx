import { minutesOfDay, nowInIst, type ScheduleRow } from '../utils/schedule'
import { courseByName } from '../content/courses'
import { Link } from 'react-router-dom'

// The real teaching week as a grid, with a read head travelling down the hours
// and the session teaching right now lit and breathing.
//
// This is the treatment the abstract hero timetable used, now carrying actual
// batches: real day columns, real hour rows, real course names. The batch data
// has a date range and a daily time but no weekdays, so a batch occupies its
// slot on every day of this week inside its run - which is what the data says.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Block {
  day: number
  /** Row index into the hour list. */
  row: number
  /** How many hour rows the session covers. */
  span: number
  row0: number
  live: boolean
  row1: number
  courseName: string
  trainer: string
  from: string
  to: string
  slug?: string
}

function weekStart(): Date {
  const { date } = nowInIst()
  const day = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - day)
  return monday
}

export default function WeekBoard({ rows, failed }: { rows: ScheduleRow[] | null; failed: boolean }) {
  const { date: today, minuteOfDay } = nowInIst()
  const todayIndex = (today.getDay() + 6) % 7

  const active = (rows ?? []).filter((row) => row.batch.status === 'ACTIVE')

  // Hour range from the real times, padded by one hour each side.
  const starts = active.map((row) => minutesOfDay(row.batch.start_time) ?? 0)
  const ends = active.map((row) => minutesOfDay(row.batch.end_time) ?? 0)
  const fromHour = active.length ? Math.max(0, Math.floor(Math.min(...starts) / 60) - 1) : 8
  const toHour = active.length ? Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1) : 21
  const hours = Array.from({ length: Math.max(4, toHour - fromHour) }, (_, i) => fromHour + i)

  const monday = weekStart()
  const blocks: Block[] = []
  for (const row of active) {
    const from = minutesOfDay(row.batch.start_time)
    const to = minutesOfDay(row.batch.end_time)
    if (from === null || to === null || to <= from) continue
    const runFrom = new Date(`${row.batch.start_date}T00:00:00`)
    const runTo = new Date(`${row.batch.end_date}T00:00:00`)
    const slug = courseByName(row.batch.course_name)?.slug

    for (let day = 0; day < DAYS.length; day += 1) {
      const cell = new Date(monday)
      cell.setDate(monday.getDate() + day)
      if (cell < runFrom || cell > runTo) continue
      const row0 = from / 60 - fromHour
      const row1 = to / 60 - fromHour
      blocks.push({
        day,
        row: Math.floor(row0),
        span: Math.max(1, Math.round(row1 - row0)),
        row0,
        row1,
        live: day === todayIndex && minuteOfDay >= from && minuteOfDay < to,
        courseName: row.batch.course_name,
        trainer: row.batch.trainer_name,
        from: row.batch.start_time.slice(0, 5),
        to: row.batch.end_time.slice(0, 5),
        slug,
      })
    }
  }

  // Where the read head rests: the current time, if it is inside the window.
  const nowRow = minuteOfDay / 60 - fromHour
  const nowVisible = nowRow >= 0 && nowRow <= hours.length

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--on-ink-faint)]">
          This week
        </p>
        <p className="tnum text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
          All times IST
        </p>
      </div>

      {failed && (
        <p className="mt-6 text-[0.86rem] text-[color:var(--on-ink-mute)]">
          The schedule is not reachable right now.
        </p>
      )}

      {!failed && rows !== null && blocks.length === 0 && (
        <p className="mt-6 text-[0.86rem] text-[color:var(--on-ink-mute)]">
          No batches are scheduled this week.
        </p>
      )}

      {blocks.length > 0 && (
        <div className="mt-5">
          {/* Day headings */}
          <div className="grid grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] gap-1">
            <span />
            {DAYS.map((day, index) => (
              <span
                key={day}
                className={`tt-head text-center text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${
                  index === todayIndex ? 'text-[color:var(--signal-text)]' : 'text-[color:var(--on-ink-faint)]'
                }`}
                style={{ ['--t' as string]: index * 40 }}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div
            className="relative mt-2 grid grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] gap-1"
            style={{ gridTemplateRows: `repeat(${hours.length}, 1.6rem)` }}
          >
            {hours.map((hour, index) => (
              <span
                key={hour}
                className="tnum self-start text-[0.58rem] text-[color:var(--on-ink-faint)]"
                style={{ gridColumn: 1, gridRow: index + 1 }}
              >
                {String(hour).padStart(2, '0')}:00
              </span>
            ))}

            {/* Empty cells, so the week reads as a grid rather than floating bars */}
            {hours.map((hour, rowIndex) =>
              DAYS.map((day, dayIndex) => (
                <span
                  key={`${hour}-${day}`}
                  className="rounded-[3px] bg-[color:var(--ink-3)]/45"
                  style={{ gridColumn: dayIndex + 2, gridRow: rowIndex + 1 }}
                />
              )),
            )}

            {/* Real sessions */}
            {blocks.map((block, index) => {
              const label = `${block.courseName}, ${block.from} to ${block.to} IST, ${block.trainer}`
              const content = (
                <>
                  <span className="sr-only">{label}</span>
                  {block.live && (
                    <span className="absolute inset-x-1 top-1 truncate text-[0.5rem] font-bold uppercase tracking-[0.08em] text-[color:var(--ink)]">
                      Live
                    </span>
                  )}
                </>
              )
              const style = {
                gridColumn: block.day + 2,
                gridRow: `${block.row + 1} / span ${block.span}`,
                ['--t' as string]: 120 + index * 26,
              }
              const className = `relative rounded-[4px] ${block.live ? 'tt-live' : 'tt-cell'}`
              return block.slug ? (
                <Link key={index} to={`/courses/${block.slug}`} className={className} style={style} title={label}>
                  {content}
                </Link>
              ) : (
                <span key={index} className={className} style={style} title={label}>
                  {content}
                </span>
              )
            })}

            {/* The read head: parked at the current hour, and travelling on a loop. */}
            <span
              className="tt-scan pointer-events-none absolute inset-x-0 z-10 h-px bg-[color:var(--signal)]/40"
              style={{ ['--scan-travel' as string]: `${hours.length * 1.6}rem` }}
              aria-hidden="true"
            />
            {nowVisible && (
              <span
                className="pointer-events-none absolute inset-x-0 z-10 h-px bg-[color:var(--signal)]"
                style={{ top: `${nowRow * 1.6}rem` }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
