import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { getResultDetail } from '../services/resultsService'
import type { ResultDetail } from '../types'

// Per-attempt result detail (Phase 7): the score summary plus a
// question-by-question review. Unlike the take-endpoint's shapes in
// AssessmentPage, this is allowed to show the correct answer alongside the
// student's own selection - the attempt is already submitted, so there's
// nothing left to protect by hiding it.
export default function ResultDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const attemptIdNum = Number(attemptId)

  const [detail, setDetail] = useState<ResultDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getResultDetail(attemptIdNum)
      .then((data) => {
        if (isMounted) setDetail(data)
      })
      .catch((err) => {
        if (!isMounted) return
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setLoadError('This is not your result to view.')
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          setLoadError('That result could not be found.')
        } else {
          setLoadError('Could not load this result right now. Please try again later.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [attemptIdNum])

  if (isLoading) {
    return <p className="p-8 text-gray-500">Loading...</p>
  }

  if (loadError || !detail) {
    return (
      <div className="p-8">
        <p className="text-red-600">{loadError}</p>
        <Link to="/results" className="mt-4 inline-block text-sm text-gray-600 hover:text-ink">
          &larr; Back to My Results
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-xl">
      <Link to="/results" className="text-sm text-gray-600 hover:text-ink">
        &larr; Back to My Results
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">{detail.topic_name}</h1>
      <p className="text-sm text-gray-500">{detail.course_name}</p>

      <div className="mt-6 rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-3xl font-semibold">
          {detail.score} / {detail.total_questions}
        </p>
        <p className="mt-1 text-gray-600">{detail.percentage}% correct</p>
        <p className="mt-1 text-sm text-gray-500">{detail.wrong_count} incorrect</p>
        <p className="mt-2 text-xs text-gray-500">
          Submitted {new Date(detail.submitted_at).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {detail.answers.map((answer, index) => (
          <div
            key={answer.question_id}
            className={`rounded-lg border p-4 shadow-sm ${
              answer.is_correct ? 'border-green-300' : 'border-red-300'
            }`}
          >
            <p className="font-medium">
              {index + 1}. {answer.question_text}
            </p>
            <p className="mt-2 text-sm">
              Your answer:{' '}
              <span className={answer.is_correct ? 'text-green-700' : 'text-red-700'}>
                {answer.selected_option_label
                  ? `${answer.selected_option_label}. ${answer.selected_option_text}`
                  : 'Not answered'}
              </span>
            </p>
            {!answer.is_correct && (
              <p className="mt-1 text-sm text-green-700">
                Correct answer: {answer.correct_option_label}. {answer.correct_option_text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
