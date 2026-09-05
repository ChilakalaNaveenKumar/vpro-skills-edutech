// The design writes hours the way the audience says them - "7:30 – 9:00 PM",
// not "19:30 – 21:00". Minutes are always shown, and the meridiem is written
// once when both ends share it.

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

/** e.g. "7:30 – 9:00 PM", or "11:30 AM – 1:00 PM" across the boundary. */
export function hourRange(startTime: string, endTime: string): string {
  const start = parts(startTime)
  const end = parts(endTime)
  if (!start || !end) return ''
  if (meridiem(start.h) === meridiem(end.h)) {
    return `${clock(start)} – ${clock(end)} ${meridiem(end.h)}`
  }
  return `${clock(start)} ${meridiem(start.h)} – ${clock(end)} ${meridiem(end.h)}`
}
