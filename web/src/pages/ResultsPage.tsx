import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyResults } from '../services/resultsService'
import type { Result } from '../types'

// "My Results" history (Phase 7): every past attempt the logged-in student
// has submitted, newest first. Scoring/storage itself happened at submit
// time in Phase 6 - this page only lists what's already there.
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
    <div className="p-8">
      <h1 className="text-2xl font-semibold">My Results</h1>

      {isLoading && <p className="mt-6 text-gray-500">Loading...</p>}

      {loadError && (
        <p className="mt-6 text-red-600">
          Could not load your results right now. Please try again later.
        </p>
      )}

      {!isLoading && !loadError && results.length === 0 && (
        <p className="mt-6 text-gray-600">
          You have not attempted any assessments yet.
        </p>
      )}

      {!isLoading && !loadError && results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Link
              key={result.attempt_id}
              to={`/results/${result.attempt_id}`}
              className="rounded-xl border border-gray-200 p-4 shadow-sm transition-colors hover:border-brand-200"
            >
              <h3 className="font-medium">{result.course_name}</h3>
              <p className="mt-1 text-sm text-gray-600">{result.topic_name}</p>
              <p className="mt-2 text-2xl font-semibold">
                {result.score} / {result.total_questions}
              </p>
              <p className="mt-1 text-sm text-gray-600">{result.percentage}% correct</p>
              <p className="mt-2 text-xs text-gray-500">
                Submitted {new Date(result.submitted_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
