// Every batch time the backend stores is a wall-clock time in Ameerpet, so
// "is this class live right now?" has to be answered in IST regardless of where
// the visitor is sitting - and this site is deliberately aimed at people abroad
// as well as in Hyderabad.
//
// India has never observed DST, so a fixed +05:30 shift is exact. Shifting the
// instant and then reading the UTC fields avoids `toLocaleString` round-trips,
// whose output format is not guaranteed to be re-parseable by `Date`.

const IST_OFFSET_MINUTES = 5 * 60 + 30

export interface IstParts {
  /** Minutes since IST midnight. */
  minutesOfDay: number
  hour: number
  /** ISO calendar date in IST, e.g. "2026-09-01". Safe to compare lexically. */
  date: string
  /** 0 = Sunday. */
  weekday: number
}

export function istParts(now: Date = new Date()): IstParts {
  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000)
  const hour = ist.getUTCHours()
  return {
    minutesOfDay: hour * 60 + ist.getUTCMinutes(),
    hour,
    date: ist.toISOString().slice(0, 10),
    weekday: ist.getUTCDay(),
  }
}

/** "18:30" or "18:30:00" -> 1110. Returns null for anything unparseable. */
export function minutesFromTime(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** 1110 -> "6:30 PM". The audience reads 12-hour time. */
export function formatClock(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  const suffix = hours24 < 12 ? 'AM' : 'PM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`
}

/** Only trusts a real ISO calendar date; anything else is treated as unknown. */
export function isoDate(value: string | null | undefined): string | null {
  if (!value) return null
  const candidate = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null
}

export function formatDate(value: string | null | undefined): string {
  const iso = isoDate(value)
  if (!iso) return value ?? ''
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
