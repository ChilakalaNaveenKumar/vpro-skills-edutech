import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../services/coursesService'
import { listCourseTopics } from '../services/topicsService'
import { listUsers } from '../services/usersService'
import { getAllResults } from '../services/resultsService'
import type { AdminResult, Course, Topic, User } from '../types'

// Admin Results (Phase 8): every attempt across every student, filterable
// by student and/or topic. Reuses the existing /results/:attemptId detail
// page (Phase 7 already allows admin viewing of any attempt) rather than
// building a second detail view. The topic dropdown is built by fetching
// every course's topics up front - admin-scale data, no pagination
// concerns, same assumption AdminStudentEnrollmentsPage makes about
// listUsers().
export default function AdminResultsPage() {
  const [students, setStudents] = useState<User[]>([])
  const [topicsByCourse, setTopicsByCourse] = useState<{ course: Course; topics: Topic[] }[]>([])
  const [results, setResults] = useState<AdminResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [studentFilter, setStudentFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')

  useEffect(() => {
    let isMounted = true

    listUsers('STUDENT')
      .then((studentsData) => {
        if (!isMounted) return
        setStudents(studentsData)
        return listCourses()
      })
      .then((coursesData) => {
        if (!isMounted || !coursesData) return
        return Promise.all(
          coursesData.map((course) =>
            listCourseTopics(course.id).then((topics) => ({ course, topics })),
          ),
        )
      })
      .then((grouped) => {
        if (isMounted && grouped) setTopicsByCourse(grouped)
      })
      .catch(() => {
        if (isMounted) setLoadError(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function loadResults() {
    getAllResults({
      studentId: studentFilter ? Number(studentFilter) : undefined,
      topicId: topicFilter ? Number(topicFilter) : undefined,
    })
      .then((data) => {
        setResults(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadResults, [studentFilter, topicFilter])

  return (
    <div>
      <h2 className="text-xl font-semibold">Results</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          aria-label="Filter by student"
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by topic"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All topics</option>
          {topicsByCourse.map(({ course, topics }) => (
            <optgroup key={course.id} label={course.name}>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {isLoading && <p className="mt-6 text-gray-500">Loading...</p>}
      {loadError && <p className="mt-6 text-red-600">Could not load results right now.</p>}
      {!isLoading && !loadError && results.length === 0 && (
        <p className="mt-6 text-gray-600">No results match these filters.</p>
      )}

      {!isLoading && !loadError && results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Link
              key={result.attempt_id}
              to={`/results/${result.attempt_id}`}
              className="rounded-xl border border-gray-200 p-4 shadow-sm transition-colors hover:border-brand-200"
            >
              <h3 className="font-medium">{result.student_name}</h3>
              <p className="mt-1 text-sm text-gray-600">
                {result.course_name} - {result.topic_name}
              </p>
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
