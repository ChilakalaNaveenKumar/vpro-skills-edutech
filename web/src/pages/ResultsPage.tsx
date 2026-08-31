import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyResults } from '../services/resultsService'
import type { Result } from '../types'

// Score-based color tiers, used for both the percentage text and the
// progress bar fill below - a quick visual read of "how did I do" before
// even reading the numbers. Thresholds are informational only (there is
// no pass/fail concept anywhere else in this app), chosen as reasonable
// everyday bands rather than tied to any grading policy.
function scoreTier(percentage: number): { text: string; bar: string; ring: string } {
  if (percentage >= 80) return { text: 'text-green-700', bar: 'bg-green-500', ring: 'bg-green-50' }
  if (percentage >= 50) return { text: 'text-amber-700', bar: 'bg-amber-500', ring: 'bg-amber-50' }
  return { text: 'text-red-700', bar: 'bg-red-500', ring: 'bg-red-50' }
}

// "My Results" history (Phase 7, restyled 2026-08-31 alongside the
// Dashboard for a more polished look sitewide): every past attempt the
// logged-in student has submitted, newest first. Scoring/storage itself
// happened at submit time in Phase 6 - this page only lists what's
// already there.
export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let isMounted = true

    getMyResults()
      .then((data) => {
        if (isMounted) setResults(data)
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
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-brand-700">Your Progress</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            My Results
          </h1>
          <p className="mt-2 max-w-xl text-gray-600">
            Every assessment you have submitted, with your score right where you can see it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        {isLoading && <p className="text-gray-500">Loading...</p>}

        {loadError && (
          <p className="text-red-600">Could not load your results right now. Please try again later.</p>
        )}

        {!isLoading && !loadError && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="font-medium text-ink">No results yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Once you submit an assessment from one of your courses, it will show up here.
            </p>
          </div>
        )}

        {!isLoading && !loadError && results.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => {
              const tier = scoreTier(result.percentage)
              return (
                <Link
                  key={result.attempt_id}
                  to={`/results/${result.attempt_id}`}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                >
                  <h3 className="font-display text-lg font-semibold text-ink">{result.course_name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{result.topic_name}</p>

                  <div className="mt-4 flex items-center gap-4">
                    <div
                      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full ${tier.ring}`}
                    >
                      <span className={`text-lg font-semibold ${tier.text}`}>{result.percentage}%</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-semibold text-ink">
                        {result.score} / {result.total_questions}
                      </p>
                      <p className="text-xs text-gray-500">questions correct</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${tier.bar}`}
                          style={{ width: `${Math.min(100, Math.max(0, result.percentage))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    Submitted {new Date(result.submitted_at).toLocaleString()}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
