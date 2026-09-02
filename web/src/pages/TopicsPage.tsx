import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../services/coursesService'
import { listCourseTopics } from '../services/topicsService'
import { getMyResults } from '../services/resultsService'
import type { Course, Topic } from '../types'

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Course -> topic navigation (Phase 6), reached from a "Start Learning"
// link on a Dashboard course card. Backend already enforces enrollment for
// a non-admin caller (Phase 4) - this page just renders what it's given.
//
// Since students only get one assessment attempt per topic (see
// AssessmentPage.tsx's alreadyAttemptedId handling), this page fetches the
// student's own results alongside the topic list and swaps "Start
// Assessment" for "View Result" on any topic already completed - so the
// "blocked and redirected" experience on the assessment page itself is a
// rare fallback, not how students normally discover they're done.
export default function TopicsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const courseIdNum = Number(courseId)

  const [course, setCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [attemptIdByTopic, setAttemptIdByTopic] = useState<Map<number, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([getCourse(courseIdNum), listCourseTopics(courseIdNum), getMyResults()])
      .then(([courseData, topicsData, results]) => {
        if (!isMounted) return
        setCourse(courseData)
        setTopics(topicsData)
        const lookup = new Map<number, number>()
        for (const result of results) {
          // A student gets at most one attempt per topic, so the first
          // (newest, since getMyResults() is newest-first) match wins.
          if (!lookup.has(result.topic_id)) {
            lookup.set(result.topic_id, result.attempt_id)
          }
        }
        setAttemptIdByTopic(lookup)
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('Could not load this course’s topics right now. Please try again later.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [courseIdNum])

  return (
    <div className="p-8">
      <Link to="/dashboard" className="text-sm text-gray-600 hover:text-ink">
        &larr; Back to My Courses
      </Link>

      {isLoading && <p className="mt-4 text-gray-500">Loading...</p>}

      {loadError && <p className="mt-4 text-red-600">{loadError}</p>}

      {!isLoading && !loadError && (
        <>
          <h1 className="mt-4 text-2xl font-semibold">{course?.name}</h1>

          {topics.length === 0 ? (
            <p className="mt-4 text-gray-600">No topics have been added to this course yet.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {topics.map((topic) => {
                const attemptId = attemptIdByTopic.get(topic.id)
                const isCompleted = attemptId != null

                return (
                  <div
                    key={topic.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{topic.name}</span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckIcon />
                          Completed
                        </span>
                      )}
                    </div>

                    {isCompleted ? (
                      <Link
                        to={`/results/${attemptId}`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        View Result
                      </Link>
                    ) : (
                      <Link
                        to={`/topics/${topic.id}/assessment`}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                      >
                        Start Assessment
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
