import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMyBatches } from '../services/enrollmentService'
import { localHourRange } from '../utils/hours'
import type { Batch, BatchProgressStatus } from '../types'

const PROGRESS_LABEL: Record<BatchProgressStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

// Small inline icons (self-contained, no icon-library dependency - matches
// how the rest of the app has no external UI kit) used to give the batch
// schedule details a bit more visual structure than plain stacked text
// lines. 16x16, currentColor, so they inherit whatever text color they're
// placed in.
function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.75V8l2.25 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrainerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.75 13.5c.7-2.6 2.9-4 5.25-4s4.55 1.4 5.25 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4.5 4-4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Student dashboard "My Courses" (Phase 5, restyled 2026-08-31 per direct
// admin feedback that the plain "View Topics" link "seems not good" and a
// request for an overall more polished look). Course->topic navigation and
// the assessment flow itself are Phase 6 - this page lists enrollment and
// stops there. Redirects admins elsewhere - see the `isAdmin` check below.
export default function DashboardPage() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    // Admins are never enrolled in anything - skip the fetch entirely for
    // them rather than firing a pointless request before the redirect
    // below sends them to /admin.
    if (isAdmin) return

    let isMounted = true

    getMyBatches()
      .then((data) => {
        if (isMounted) setBatches(data)
      })
      .catch(() => {
        if (isMounted) setLoadError(true)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  // Admin accounts are never enrolled in anything, so this page is always
  // empty for them - the nav and post-login redirect both send admins to
  // /admin instead (post-launch fix), but this route itself still exists
  // (e.g. a stale bookmark), so redirect an admin who lands here anyway
  // rather than showing the confusing empty state. This check has to come
  // after every hook above it (Rules of Hooks - an early return before a
  // hook call would change the hook count/order between renders).
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const inProgressCount = batches.filter((b) => b.progress_status === 'IN_PROGRESS').length
  const completedCount = batches.filter((b) => b.progress_status === 'COMPLETED').length

  return (
    <div>
      {/* Hero band - same gradient/typography vocabulary as HomePage.tsx's
          hero, so the dashboard reads as part of the same brand rather
          than a plain utility screen bolted on afterward. */}
      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-brand-700">Student Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Welcome back, {user?.full_name}
          </h1>
          <p className="mt-2 max-w-xl text-gray-600">
            Here is everything you are currently enrolled in - pick up right where you left off.
          </p>

          {!isLoading && !loadError && batches.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold text-ink">{batches.length}</p>
                <p className="text-xs text-gray-500">Enrolled {batches.length === 1 ? 'course' : 'courses'}</p>
              </div>
              {inProgressCount > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-2xl font-semibold text-brand-600">{inProgressCount}</p>
                  <p className="text-xs text-gray-500">In progress</p>
                </div>
              )}
              {completedCount > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-2xl font-semibold text-ink">{completedCount}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="font-display text-2xl font-semibold text-ink">My Courses</h2>

        {isLoading && <p className="mt-4 text-gray-500">Loading...</p>}

        {loadError && (
          <p className="mt-4 text-red-600">
            Could not load your courses right now. Please try again later.
          </p>
        )}

        {!isLoading && !loadError && batches.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="font-medium text-ink">You are not enrolled in any courses yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Check back once your batch has been assigned - it will show up here automatically.
            </p>
          </div>
        )}

        {!isLoading && !loadError && batches.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">{batch.course_name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      batch.progress_status === 'IN_PROGRESS'
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {PROGRESS_LABEL[batch.progress_status]}
                  </span>
                </div>
                <span className="mt-2 inline-block w-fit rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Batch {batch.batch_number}
                </span>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarIcon />
                    <span>
                      {batch.start_date} to {batch.end_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon />
                    <span>
                      {localHourRange(batch.start_time, batch.end_time, batch.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrainerIcon />
                    <span>{batch.trainer_name}</span>
                  </div>
                </div>

                <Link
                  to={`/courses/${batch.course_id}/topics`}
                  className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md"
                >
                  Start Learning
                  <ArrowIcon />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
