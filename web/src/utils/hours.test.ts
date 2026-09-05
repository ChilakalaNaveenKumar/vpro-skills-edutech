import { describe, expect, it } from 'vitest'
import { hourRange } from './hours'

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
