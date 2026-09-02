import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { getResultDetail } from '../services/resultsService'
import type { ResultDetail } from '../types'

// Score-based tiers + a short motivational line - same thresholds as
// ResultsPage.tsx's scoreTier (informational only, no pass/fail concept
// anywhere else in this app), extended here with copy since this page is
// where a student actually reads their outcome, not just scans a list.
function scoreTier(percentage: number): {
  text: string
  bar: string
  ring: string
  ringBorder: string
  message: string
} {
  if (percentage >= 80) {
    return {
      text: 'text-green-700',
      bar: 'bg-green-500',
      ring: 'bg-green-50',
      ringBorder: 'border-green-200',
      message: 'Excellent work! You have a strong grasp of this topic.',
    }
  }
  if (percentage >= 50) {
    return {
      text: 'text-amber-700',
      bar: 'bg-amber-500',
      ring: 'bg-amber-50',
      ringBorder: 'border-amber-200',
      message: "Good effort - a bit more practice and you'll have this mastered.",
    }
  }
  return {
    text: 'text-red-700',
    bar: 'bg-red-500',
    ring: 'bg-red-50',
    ringBorder: 'border-red-200',
    message: "Don't worry - review the topic below and give it another look.",
  }
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" className="fill-green-100" />
      <path
        d="M6.5 10.25l2.25 2.25 4.75-5"
        stroke="currentColor"
        className="text-green-600"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" className="fill-red-100" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="currentColor"
        className="text-red-600"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M2 2.75c1.4-.6 3.2-.6 4.8 0a1 1 0 01.7.95v8.6a.5.5 0 01-.7.46c-1.5-.6-3.2-.6-4.8 0V2.75zM14 2.75c-1.4-.6-3.2-.6-4.8 0a1 1 0 00-.7.95v8.6a.5.5 0 00.7.46c1.5-.6 3.2-.6 4.8 0V2.75z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Per-attempt result detail (Phase 7, restyled 2026-08-31 to match the
// Dashboard/Results redesign and give it real encouragement copy - the
// plain black-on-white review previously here read like a dry exam
// printout rather than something a student would want to look back at).
// Unlike the take-endpoint's shapes in AssessmentPage, this is allowed to
// show the correct answer alongside the student's own selection - the
// attempt is already submitted, so there's nothing left to protect by
// hiding it.
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

  const tier = scoreTier(detail.percentage)

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <Link to="/results" className="text-sm text-gray-600 hover:text-ink">
            &larr; Back to My Results
          </Link>

          <p className="mt-3 text-sm font-medium text-brand-700">{detail.course_name}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {detail.topic_name}
          </h1>

          <div
            className={`mt-6 flex flex-col gap-5 rounded-xl border ${tier.ringBorder} bg-white p-6 shadow-sm sm:flex-row sm:items-center`}
          >
            <div
              className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border ${tier.ringBorder} ${tier.ring}`}
            >
              <span className={`text-2xl font-semibold ${tier.text}`}>{detail.percentage}%</span>
            </div>

            <div className="flex-1">
              <p className="text-xl font-semibold text-ink">
                {detail.score} / {detail.total_questions} correct
              </p>
              <p className={`mt-1 text-sm font-medium ${tier.text}`}>{tier.message}</p>

              <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${tier.bar}`}
                  style={{ width: `${Math.min(100, Math.max(0, detail.percentage))}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{detail.score} correct</span>
                <span>{detail.wrong_count} incorrect</span>
                <span>Submitted {new Date(detail.submitted_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="font-display text-lg font-semibold text-ink">Question Review</h2>
        <p className="mt-1 text-sm text-gray-600">
          Go through each question below - it's the fastest way to turn today's mistakes into
          tomorrow's correct answers.
        </p>

        <div className="mt-6 space-y-4">
          {detail.answers.map((answer, index) => (
            <div
              key={answer.question_id}
              className={`rounded-xl border p-5 shadow-sm ${
                answer.is_correct ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">
                  <span className="text-gray-400">{index + 1}.</span> {answer.question_text}
                </p>
                {answer.is_correct ? <CheckCircleIcon /> : <XCircleIcon />}
              </div>

              <p className="mt-3 text-sm">
                Your answer:{' '}
                <span className={`font-medium ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                  {answer.selected_option_label
                    ? `${answer.selected_option_label}. ${answer.selected_option_text}`
                    : 'Not answered'}
                </span>
              </p>
              {!answer.is_correct && (
                <p className="mt-1 text-sm">
                  Correct answer:{' '}
                  <span className="font-medium text-green-700">
                    {answer.correct_option_label}. {answer.correct_option_text}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            Keep the momentum going - every topic you complete builds toward the next one.
          </p>
          <Link
            to={`/courses/${detail.course_id}/topics`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <BookIcon />
            Continue Learning
          </Link>
        </div>
      </section>
    </div>
  )
}
