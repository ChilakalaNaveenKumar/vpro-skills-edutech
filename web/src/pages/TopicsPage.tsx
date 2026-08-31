import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../services/coursesService'
import { listCourseTopics } from '../services/topicsService'
import type { Course, Topic } from '../types'

// Course -> topic navigation (Phase 6), reached from a "View Topics" link
// on a Dashboard course card. Backend already enforces enrollment for a
// non-admin caller (Phase 4) - this page just renders what it's given.
export default function TopicsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const courseIdNum = Number(courseId)

  const [course, setCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([getCourse(courseIdNum), listCourseTopics(courseIdNum)])
      .then(([courseData, topicsData]) => {
        if (!isMounted) return
        setCourse(courseData)
        setTopics(topicsData)
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
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <span className="font-medium">{topic.name}</span>
                  <Link
                    to={`/topics/${topic.id}/assessment`}
                    className="rounded-lg bg-brand-600 shadow-sm transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Start Assessment
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
