import Spotlight from '../motion/Spotlight'

// An illustration of a week of live teaching. Not a feed of one.
//
// This deliberately shows no course names, no trainer names, no dates and no
// times attached to any block, because it is an authored pattern rather than the
// real schedule - and an abstract grid cannot be misread as "these are this
// week's classes" the way a labelled one could. The real schedule, with real
// names and real times, is a separate thing that belongs next to a real booking.
//
// It moves on its own: the week lays itself out column by column, one block is
// lit and breathing, and a read head travels down the hours the way somebody
// scanning a timetable actually reads it.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']

interface Block {
  /** Column index into DAYS. */
  day: number
  /** Row index into HOURS. */
  row: number
  /** Row span, for the longer sessions. */
  span?: number
  live?: boolean
}

// Authored to read like a real teaching week: dense on weekdays, one long
// weekend block, and a single lit session that the eye lands on.
const BLOCKS: Block[] = [
  { day: 0, row: 0 },
  { day: 0, row: 1 },
  { day: 0, row: 3, span: 2 },
  { day: 0, row: 5 },
  { day: 1, row: 0 },
  { day: 1, row: 2 },
  { day: 1, row: 4 },
  { day: 1, row: 6 },
  { day: 2, row: 1, live: true },
  { day: 2, row: 3 },
  { day: 2, row: 5 },
  { day: 3, row: 0 },
  { day: 3, row: 2, span: 2 },
  { day: 3, row: 5 },
  { day: 4, row: 0 },
  { day: 4, row: 3 },
  { day: 4, row: 6 },
  { day: 5, row: 0 },
  { day: 5, row: 2, span: 3 },
  { day: 6, row: 1 },
  { day: 6, row: 4 },
  { day: 6, row: 6 },
]

// Staggered on a diagonal so the week appears to be laid out rather than
// switched on, and the lit block arrives last.
function delayFor(block: Block): number {
  return 240 + block.day * 70 + block.row * 34 + (block.live ? 420 : 0)
}

export default function WeekTimetable() {
  return (
    <Spotlight className="bracketed border border-[color:var(--rule)] bg-[color:var(--ink-2)]">
      <figure className="m-0">
        <figcaption className="flex items-baseline justify-between gap-4 border-b border-[color:var(--rule)] px-4 py-3">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--on-ink-mute)]">
            A teaching week
          </span>
          <span className="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
            <span className="h-2 w-2 shrink-0 rounded-sm bg-[color:var(--signal)]" aria-hidden="true" />
            Live session
          </span>
        </figcaption>

        <div className="px-3 pb-4 pt-3 sm:px-4">
          <div className="grid grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] gap-x-1">
            <span aria-hidden="true" />
            {DAYS.map((day, index) => (
              <span
                key={day}
                className="tt-head text-center text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--on-ink-mute)]"
                style={{ ['--t' as string]: 120 + index * 60 }}
              >
                {day}
              </span>
            ))}
          </div>

          <div className="relative mt-2 grid grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] gap-x-1">
            <div className="grid" style={{ gridTemplateRows: `repeat(${HOURS.length}, 2.6rem)` }}>
              {HOURS.map((hour) => (
                <span key={hour} className="tnum pt-1 text-[0.58rem] text-[color:var(--on-ink-faint)]">
                  {hour}
                </span>
              ))}
            </div>

            {DAYS.map((day, dayIndex) => (
              <div
                key={day}
                className="relative grid border-l border-[color:var(--rule)]"
                style={{ gridTemplateRows: `repeat(${HOURS.length}, 2.6rem)` }}
              >
                {BLOCKS.filter((block) => block.day === dayIndex).map((block) => (
                  <span
                    key={`${block.day}-${block.row}`}
                    aria-hidden="true"
                    className={`mx-[3px] my-[3px] rounded-sm ${
                      block.live ? 'tt-live bg-[color:var(--signal)]' : 'tt-cell bg-[color:var(--ink-3)]'
                    }`}
                    style={{
                      gridRow: `${block.row + 1} / span ${block.span ?? 1}`,
                      ['--t' as string]: delayFor(block),
                    }}
                  />
                ))}
              </div>
            ))}

            <span
              aria-hidden="true"
              className="tt-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-[color:var(--signal)]/40"
              style={{ ['--scan-travel' as string]: `${HOURS.length * 2.6}rem` }}
            />
          </div>
        </div>
      </figure>
    </Spotlight>
  )
}
