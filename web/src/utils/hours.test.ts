import { describe, expect, it } from 'vitest'
import { hourRange, istInstant, localHourRange } from './hours'

describe('hourRange', () => {
  it('writes the meridiem once when both ends share it', () => {
    expect(hourRange('19:30:00', '21:00:00')).toBe('7:30 – 9:00 PM')
    expect(hourRange('07:00:00', '08:30:00')).toBe('7:00 – 8:30 AM')
  })

  it('writes it on both ends across the midday boundary', () => {
    expect(hourRange('11:30:00', '13:00:00')).toBe('11:30 AM – 1:00 PM')
  })

  it('renders midnight and noon as 12', () => {
    expect(hourRange('00:00:00', '01:00:00')).toBe('12:00 – 1:00 AM')
    expect(hourRange('12:00:00', '13:30:00')).toBe('12:00 – 1:30 PM')
  })

  it('is empty for unusable input rather than guessing', () => {
    expect(hourRange('', '')).toBe('')
    expect(hourRange('19:30', 'not-a-time')).toBe('')
    expect(hourRange('25:00', '26:00')).toBe('')
  })
})

describe('localHourRange', () => {
  // 19:30 IST on 4 Aug 2026 is 14:00 UTC. Toronto is on EDT (UTC−4) that day.
  it('shifts an evening IST class into a Toronto morning', () => {
    expect(localHourRange('19:30:00', '21:00:00', '2026-08-04', 'America/Toronto')).toBe(
      '10:00 – 11:30 AM EDT',
    )
  })

  it('keeps the same clock in India, and names the zone', () => {
    expect(localHourRange('19:30:00', '21:00:00', '2026-08-04', 'Asia/Kolkata')).toMatch(
      /^7:30 – 9:00 PM (IST|GMT\+5:30)$/,
    )
  })

  it('uses EST in January, when Toronto is not on daylight time', () => {
    expect(localHourRange('19:30:00', '21:00:00', '2026-01-15', 'America/Toronto')).toBe(
      '9:00 – 10:30 AM EST',
    )
  })

  it('falls back to the IST string when the date is unusable', () => {
    expect(localHourRange('19:30:00', '21:00:00', 'not-a-date', 'America/Toronto')).toBe(
      '7:30 – 9:00 PM',
    )
  })

  it('agrees with Date math for the IST offset', () => {
    const at = istInstant('2026-08-04', '19:30:00')
    expect(at?.toISOString()).toBe('2026-08-04T14:00:00.000Z')
  })
})
