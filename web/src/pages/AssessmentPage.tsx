import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { getAssessment, submitAssessment } from '../services/assessmentService'
import type { Assessment, AssessmentResult } from '../types'

// Topic-wise MCQ assessment (Phase 6): one question at a time, answers
// held only in this component's state - nothing is sent to the backend
// until Submit, which is the only write for the whole attempt.
export default function AssessmentPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const topicIdNum = Number(topicId)
  const startedAtRef = useRef(new Date().toISOString())

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, number | null>>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  useEffect(() => {
    let isMounted = true

    getAssessment(topicIdNum)
      .then((data) => {
        if (isMounted) setAssessment(data)
      })
      .catch((err) => {
        if (!isMounted) return
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setLoadError('You are not enrolled in this course.')
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          setLoadError('No assessment is available for this topic yet.')
        } else {
          setLoadError('Could not load this assessment right now. Please try again later.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [topicIdNum])

  async function handleSubmit() {
    if (!assessment) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const answers = assessment.questions.map((question) => ({
        question_id: question.id,
        selected_option_id: selectedByQuestion[question.id] ?? null,
      }))
      const submitResult = await submitAssessment(topicIdNum, startedAtRef.current, answers)
      setResult(submitResult)
    } catch {
      setSubmitError('Could not submit your assessment right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p className="p-8 text-gray-500">Loading...</p>
  }

  if (loadError) {
    return (
      <div className="p-8">
        <p className="text-red-600">{loadError}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-gray-600 hover:text-ink">
          &larr; Back to My Courses
        </Link>
      </div>
    )
  }

  if (!assessment) {
    return null
  }

  if (result) {
    return (
      <div className="p-8 max-w-md">
        <h1 className="text-2xl font-semibold">Assessment Submitted</h1>
        <div className="mt-6 rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-3xl font-semibold">
            {result.score} / {result.total_questions}
          </p>
          <p className="mt-1 text-gray-600">{result.percentage}% correct</p>
          <p className="mt-1 text-sm text-gray-500">{result.wrong_count} incorrect</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            to={`/results/${result.attempt_id}`}
            className="inline-block rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
          >
            View Full Result
          </Link>
          <Link
            to="/dashboard"
            className="inline-block rounded border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Back to My Courses
          </Link>
        </div>
      </div>
    )
  }

  const question = assessment.questions[currentIndex]
  const isLastQuestion = currentIndex === assessment.questions.length - 1

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold">{assessment.topic_name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Question {currentIndex + 1} of {assessment.total_questions}
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="font-medium">{question.question_text}</p>

        <div className="mt-4 space-y-2">
          {question.options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={selectedByQuestion[question.id] === option.id}
                onChange={() =>
                  setSelectedByQuestion((prev) => ({ ...prev, [question.id]: option.id }))
                }
              />
              <span>
                {option.option_label}. {option.option_text}
              </span>
            </label>
          ))}
        </div>
      </div>

      {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Previous
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
