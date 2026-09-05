import { describe, expect, it } from 'vitest'
import { courseStateFor, courseStateNote } from './courseState'
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

  it('is Gathering interest when the only batch has not started yet', () => {
    expect(courseStateFor('Agentic AI', [row('upcoming')])).toBe('Gathering interest')
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

describe('courseStateNote', () => {
  it('names the running batch and its start date', () => {
    expect(courseStateNote('Agentic AI', [row('running')])).toBe('Batch A-04 · started 4 Aug')
  })

  it('is null when nothing is running, so no note is rendered at all', () => {
    expect(courseStateNote('Agentic AI', [row('upcoming')])).toBeNull()
  })
})
