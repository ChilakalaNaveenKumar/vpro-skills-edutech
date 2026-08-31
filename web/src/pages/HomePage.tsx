import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../services/coursesService'
import { listBatches } from '../services/batchesService'
import type { Course, Batch } from '../types'
import Logo from '../components/Logo'

const VALUE_PROPS = [
  {
    title: 'Instructor-led, hands-on training',
    description: 'Practical, instructor-led sessions - not pre-recorded videos you watch alone.',
  },
  {
    title: 'Structured, topic-wise learning path',
    description: 'Every course is broken into clear topics, so you always know what comes next.',
  },
  {
    title: 'Instant results after every assessment',
    description: 'Take a topic-wise MCQ assessment and see exactly what you got right and wrong, right away.',
  },
]

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'

// Public home page (Phase 9 redesign): a real hero + value-prop marketing
// section, on top of the courses/batches sections built in Phase 4, which
// keep their original fetch logic unchanged - only the presentation
// changed. No invented stats or testimonials - the value props below
// describe features this app actually has.
export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loadError, setLoadError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.all([listCourses(), listBatches()])
      .then(([coursesData, batchesData]) => {
        if (!isMounted) return
        setCourses(coursesData)
        setBatches(batchesData)
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Practical, instructor-led tech training
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 sm:text-lg">
            Learn job-ready skills with structured courses, hands-on topics, and assessments that show
            you exactly where you stand.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#courses"
              className={`rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md ${FOCUS_RING}`}
            >
              Browse Courses
            </a>
            <Link
              to="/login"
              className={`rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md ${FOCUS_RING}`}
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-display text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {isLoading && <p className="px-4 text-center text-gray-500">Loading...</p>}

      {loadError && (
        <p className="px-4 text-center text-red-600">
          Could not load courses and batches right now. Please try again later.
        </p>
      )}

      {!isLoading && !loadError && (
        <>
          <section id="courses" className="px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <h2 className="font-display text-2xl font-semibold text-ink">Courses</h2>
              {courses.length === 0 ? (
                <p className="mt-2 text-gray-600">No courses are available right now.</p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-xl border border-gray-200 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                    >
                      <h3 className="font-medium text-ink">{course.name}</h3>
                      {course.description && (
                        <p className="mt-1 text-sm text-gray-600">{course.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-brand-50 px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <h2 className="font-display text-2xl font-semibold text-ink">Upcoming Batches</h2>
              {batches.length === 0 ? (
                <p className="mt-2 text-gray-600">No upcoming batches are scheduled right now.</p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {batches.map((batch) => (
                    <div key={batch.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      <h3 className="font-medium text-ink">{batch.course_name}</h3>
                      <p className="mt-1 text-sm text-gray-600">Batch {batch.batch_number}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {batch.start_date} to {batch.end_date}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {batch.start_time} - {batch.end_time}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">Trainer: {batch.trainer_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
