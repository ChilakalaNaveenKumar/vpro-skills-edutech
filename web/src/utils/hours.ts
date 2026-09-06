// The design writes hours the way the audience says them - "7:30 – 9:00 PM",
// not "19:30 – 21:00". Minutes are always shown, and the meridiem is written
// once when both ends share it.
//
// The database stores a wall-clock time in IST. "Is the class live right now?"
// is still answered in IST - that is when the trainer is in the room.
// What a visitor reads is converted to their own timezone, because a Canadian
// looking at "7:30 PM" and joining at 7:30 PM local would miss the class.

/** India has never observed DST; a fixed offset is exact. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000

function parts(time: string): { h: number; m: number } | null {
  const [rawHour, rawMinute] = time.split(':')
  // "".split(':') yields [""], and Number("") is 0 - so both halves have to be
  // checked for presence, not just for NaN.
  if (rawHour === undefined || rawMinute === undefined) return null
  const h = Number(rawHour)
  const m = Number(rawMinute)
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

function clock({ h, m }: { h: number; m: number }): string {
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')}`
}

const meridiem = (h: number) => (h < 12 ? 'AM' : 'PM')

function formatPair(
  start: { h: number; m: number },
  end: { h: number; m: number },
  zone = '',
): string {
  const suffix = zone ? ` ${zone}` : ''
  if (meridiem(start.h) === meridiem(end.h)) {
    return `${clock(start)} – ${clock(end)} ${meridiem(end.h)}${suffix}`
  }
  return `${clock(start)} ${meridiem(start.h)} – ${clock(end)} ${meridiem(end.h)}${suffix}`
}

/** e.g. "7:30 – 9:00 PM", or "11:30 AM – 1:00 PM" across the boundary.
 *  IST wall-clock, no conversion. Admin screens and tests use this. */
export function hourRange(startTime: string, endTime: string): string {
  const start = parts(startTime)
  const end = parts(endTime)
  if (!start || !end) return ''
  return formatPair(start, end)
}

/**
 * The UTC instant of an IST wall-clock on a given calendar date.
 * `dateIso` is YYYY-MM-DD in India, which is how the batch stores it.
 */
export function istInstant(dateIso: string, time: string): Date | null {
  const clockParts = parts(time)
  if (!clockParts) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return null
  const [year, month, day] = dateIso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, clockParts.h, clockParts.m) - IST_OFFSET_MS)
}

function localClock(at: Date, timeZone: string): { h: number; m: number; zone: string } | null {
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone,
    timeZoneName: 'short',
  })
  const bag: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const part of fmt.formatToParts(at)) {
    if (part.type !== 'literal') bag[part.type] = part.value
  }
  const h = Number(bag.hour)
  const m = Number(bag.minute)
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null
  // hour12:false still yields 24 at midnight in some engines; treat as 0.
  return { h: h === 24 ? 0 : h, m, zone: bag.timeZoneName ?? timeZone }
}

/**
 * The same window as `hourRange`, shifted from IST into `timeZone`.
 * Defaults to the browser's zone. Falls back to the IST string if the date
 * or times cannot be read, rather than inventing a clock.
 */
export function localHourRange(
  startTime: string,
  endTime: string,
  dateIso: string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  const startAt = istInstant(dateIso, startTime)
  const endAt = istInstant(dateIso, endTime)
  if (!startAt || !endAt) return hourRange(startTime, endTime)
  const start = localClock(startAt, timeZone)
  const end = localClock(endAt, timeZone)
  if (!start || !end) return hourRange(startTime, endTime)
  return formatPair(start, end, end.zone)
}
