import { useEffect, useState } from 'react'
import { listBatches } from '../services/batchesService'
import type { Batch } from '../types'

export type BatchState = 'live' | 'today' | 'running' | 'upcoming'

export interface ScheduleRow {
  batch: Batch
  state: BatchState
}

export const STATE_LABEL: Record<BatchState, string> = {
  live: 'Live now',
  today: 'Starts today',
  running: 'In progress',
  upcoming: 'Upcoming',
}

const STATE_ORDER: Record<BatchState, number> = { live: 0, today: 1, running: 2, upcoming: 3 }

function parseDate(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Minutes since midnight from "HH:MM" or "HH:MM:SS". */
export function minutesOfDay(time: string): number | null {
  const parts = time.split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return null
  return parts[0] * 60 + parts[1]
}

/** Today's date in IST as YYYY-MM-DD. The schedule classifies in IST, so
    callers comparing against `batch.start_date` must too - otherwise a visitor
    abroad sees a different set of batches from the one the schedule means. */
export function istTodayIso(): string {
  const { date } = nowInIst()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** A batch that has not started teaching yet. `state === 'today'` covers both
    "starts today" and "a session runs later today in a batch that began weeks
    ago", so the start date settles which. */
export function isUpcoming(row: ScheduleRow, todayIso: string): boolean {
  return row.state === 'upcoming' || (row.state === 'today' && row.batch.start_date === todayIso)
}

/** Now in IST, whatever the visitor's own timezone is. */
export function nowInIst(): { date: Date; minuteOfDay: number } {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return { date: ist, minuteOfDay: ist.getHours() * 60 + ist.getMinutes() }
}

function classify(batch: Batch): ScheduleRow | null {
  if (batch.status !== 'ACTIVE') return null
  const start = parseDate(batch.start_date)
  const end = parseDate(batch.end_date)
  if (!start || !end) return null

  const { date, minuteOfDay } = nowInIst()
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const from = minutesOfDay(batch.start_time)
  const to = minutesOfDay(batch.end_time)
  const withinRun = today.getTime() >= start.getTime() && today.getTime() <= end.getTime()

  if (withinRun && from !== null && to !== null && minuteOfDay >= from && minuteOfDay < to) {
    return { batch, state: 'live' }
  }
  if (withinRun && from !== null && minuteOfDay < from) return { batch, state: 'today' }
  if (withinRun) return { batch, state: 'running' }
  if (start.getTime() > today.getTime()) return { batch, state: 'upcoming' }
  return null
}

export function classifyBatches(batches: Batch[]): ScheduleRow[] {
  return batches
    .map(classify)
    .filter((row): row is ScheduleRow => row !== null)
    .sort((a, b) => {
      const byState = STATE_ORDER[a.state] - STATE_ORDER[b.state]
      if (byState !== 0) return byState
      return a.batch.start_date.localeCompare(b.batch.start_date)
    })
}

export interface Schedule {
  rows: ScheduleRow[] | null
  failed: boolean
  /** The batch teaching at this moment, if any. */
  liveNow: ScheduleRow | null
  /** The next thing that starts, when nothing is teaching. */
  nextUp: ScheduleRow | null
}

// One fetch of the real schedule, classified in IST. Shared by the hero and the
// schedule panel so they can never disagree about what is teaching.
// Every consumer shared the hook but not the request, so the home page fired
// four identical /api/batches calls - the hero, the ticker, the courses section
// and the schedule panel. One in-flight promise is shared instead.
let inFlight: Promise<Batch[]> | null = null

function batchesOnce(): Promise<Batch[]> {
  if (!inFlight) {
    inFlight = listBatches().catch((error) => {
      // Do not cache a failure: the next mount should be able to retry.
      inFlight = null
      throw error
    })
  }
  return inFlight
}

export function useSchedule(): Schedule {
  const [rows, setRows] = useState<ScheduleRow[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let mounted = true
    batchesOnce()
      .then((batches) => {
        if (mounted) setRows(classifyBatches(batches))
      })
      .catch(() => {
        if (mounted) setFailed(true)
      })
    return () => {
      mounted = false
    }
  }, [])

  const liveNow = rows?.find((row) => row.state === 'live') ?? null
  const nextUp = rows?.find((row) => row.state === 'today' || row.state === 'upcoming') ?? null

  return { rows, failed, liveNow, nextUp }
}
