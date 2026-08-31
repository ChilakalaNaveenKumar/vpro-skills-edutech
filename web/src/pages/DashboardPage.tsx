import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMyBatches } from '../services/enrollmentService'
import type { Batch } from '../types'

// Student dashboard "My Courses" (Phase 5): lists the batches/courses the
// logged-in student is actually enrolled in. Course->topic navigation and
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Welcome, {user?.full_name}</h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">My Courses</h2>

        {isLoading && <p className="mt-2 text-gray-500">Loading...</p>}

        {loadError && (
          <p className="mt-2 text-red-600">
            Could not load your courses right now. Please try again later.
          </p>
        )}

        {!isLoading && !loadError && batches.length === 0 && (
          <p className="mt-2 text-gray-600">
            You are not enrolled in any courses yet. Check back once your batch has been assigned.
          </p>
        )}

        {!isLoading && !loadError && batches.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <div key={batch.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
                <h3 className="font-medium">{batch.course_name}</h3>
                <p className="mt-1 text-sm text-gray-600">Batch {batch.batch_number}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {batch.start_date} to {batch.end_date}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {batch.start_time} - {batch.end_time}
                </p>
                <p className="mt-1 text-sm text-gray-600">Trainer: {batch.trainer_name}</p>
                <Link
                  to={`/courses/${batch.course_id}/topics`}
                  className="mt-3 inline-block text-sm font-medium text-brand-600 underline hover:text-brand-700"
                >
                  View Topics
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
