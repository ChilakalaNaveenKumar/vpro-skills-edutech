import { describe, expect, it } from 'vitest'
import { courseBatches, courseStateFor } from './courseState'
import type { ScheduleRow } from './schedule'
import type { Batch } from '../types'

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 1,
    course_id: 1,
    course_name: 'Agentic AI',
    batch_number: 'Batch A-04',
    start_date: '2026-08-04',
    end_date: '2026-11-02',
    start_time: '19:30:00',
    end_time: '21:00:00',
    trainer_name: 'Sambasiva Rao',
    trainer_email: 'trainer@example.com',
    seats_note: null,
    days_of_week: null,
    origin: 'VPRO',
    status: 'ACTIVE',
    progress_status: 'IN_PROGRESS',
    ...overrides,
  }
}

const row = (state: ScheduleRow['state'], overrides: Partial<Batch> = {}): ScheduleRow => ({
  batch: batch(overrides),
  state,
})

describe('courseStateFor', () => {
  it('is In session when the course has a batch teaching right now', () => {
    expect(courseStateFor('Agentic AI', [row('live')])).toBe('In session')
  })

  it('is In session when the course has a batch mid-run but not at this hour', () => {
    expect(courseStateFor('Agentic AI', [row('running')])).toBe('In session')
  })

  it('is In session when the course has a batch starting later today', () => {
    expect(courseStateFor('Agentic AI', [row('today')])).toBe('In session')
  })

  it('is Starting soon when the only batch is dated but has not begun', () => {
    expect(courseStateFor('Agentic AI', [row('upcoming')])).toBe('Starting soon')
  })

  it('prefers In session over Starting soon when the course has both', () => {
    expect(courseStateFor('Agentic AI', [row('upcoming'), row('live')])).toBe('In session')
  })

  it('is Gathering interest when the course has no batches at all', () => {
    expect(courseStateFor('Quantum Computing', [row('live')])).toBe('Gathering interest')
  })

  it('ignores a completed batch even if its dates still bracket today', () => {
    expect(
      courseStateFor('Agentic AI', [row('running', { progress_status: 'COMPLETED' })]),
    ).toBe('Gathering interest')
  })

  it('is Gathering interest before the schedule has loaded, never a false positive', () => {
    expect(courseStateFor('Agentic AI', null)).toBe('Gathering interest')
  })

  it('matches the course name exactly, not by prefix', () => {
    expect(courseStateFor('Python', [row('live', { course_name: 'Python Full Stack' })])).toBe(
      'Gathering interest',
    )
  })
})

describe('courseBatches', () => {
  it('carries the hour, the note and the message line for a running batch', () => {
    expect(courseBatches('Agentic AI', [row('running')])).toEqual([
      {
        number: 'Batch A-04',
        days: '',
        daysHour: '7:30 \u2013 9:00 PM',
        hour: '7:30 \u2013 9:00 PM',
        when: 'started 4 Aug',
        note: 'Batch A-04, started 4 Aug',
        line: 'Batch A-04, 7:30 \u2013 9:00 PM, 4 Aug to 2 Nov',
        started: true,
      },
    ])
  })

  it('includes a dated batch that has not begun, worded as starts not started', () => {
    const found = courseBatches('Agentic AI', [row('upcoming')])
    expect(found).toHaveLength(1)
    expect(found[0].note).toBe('Batch A-04, starts 4 Aug')
    expect(found[0].started).toBe(false)
  })

  it('returns every cohort running at once, not just the first', () => {
    const evening = row('running')
    const morning = row('running', {
      id: 2,
      batch_number: 'Batch A-05',
      start_time: '07:00:00',
      end_time: '08:30:00',
    })
    const found = courseBatches('Agentic AI', [evening, morning])
    expect(found).toHaveLength(2)
    expect(found.map((entry) => entry.note)).toEqual([
      'Batch A-04, started 4 Aug',
      'Batch A-05, started 4 Aug',
    ])
  })

  it('puts a batch that has not started ahead of one already teaching', () => {
    const teaching = row('running')
    const opening = row('upcoming', { id: 2, batch_number: 'Batch A-05' })
    expect(courseBatches('Agentic AI', [teaching, opening]).map((entry) => entry.number)).toEqual([
      'Batch A-05',
      'Batch A-04',
    ])
  })

  it('is empty when the course has nothing scheduled at all', () => {
    expect(courseBatches('Quantum Computing', [row('running')])).toEqual([])
    expect(courseBatches('Agentic AI', [row('running', { progress_status: 'COMPLETED' })])).toEqual(
      [],
    )
    expect(courseBatches('Agentic AI', null)).toEqual([])
  })
})
