import { useEffect, useState } from 'react'
import { COURSES } from '../content/courses'
import { listBatches } from '../services/batchesService'
import CourseCard from '../components/CourseCard'
import LiveClassesPanel from '../components/LiveClassesPanel'
import CtaLink from '../components/CtaLink'
import SplitWords from '../motion/SplitWords'

// Every course, each linking to its own page. The home page names the flagship
// and sends people here; the detail belongs on the course, not on the home page.
export default function CoursesPage() {
  const [liveCourseNames, setLiveCourseNames] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    listBatches()
      .then((batches) => {
        if (!mounted) return
        setLiveCourseNames(
          new Set(
            batches
              .filter((batch) => batch.status === 'ACTIVE')
              .map((batch) => batch.course_name.trim().toLowerCase()),
          ),
        )
      })
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="shell py-28 lg:py-36">
      <p className="eyebrow">Courses</p>

      <h1
        aria-label={'Every course, taught live'}
        className="display mt-6 max-w-[24ch] text-[clamp(2rem,5vw,3.4rem)] text-[color:var(--on-ink)]"
      >
        <SplitWords text={'Every course, taught live'} />
      </h1>

      <p className="lede rise mt-6 max-w-2xl">
        Each course runs as a live batch with a named trainer at a fixed time, topics in order, and
        an assessment after each one. Open a course to see its full curriculum.
      </p>

      <div className="mt-14">
        <LiveClassesPanel />
      </div>

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course) => (
          <li key={course.slug} className="h-full">
            <CourseCard
              course={course}
              scheduled={liveCourseNames.has(course.name.toLowerCase())}
            />
          </li>
        ))}
      </ul>

      <div className="mt-16 flex flex-col gap-4 border-t border-[color:var(--rule)] pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.92rem] text-[color:var(--on-ink-mute)]">
          Not sure which one fits? Tell us where you are now and we will say so plainly.
        </p>
        <CtaLink
          cta="course_interest"
          chapter="courses_index"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[color:var(--paper)] px-7 py-3.5 text-sm font-semibold text-[color:var(--ink)] hover:bg-white"
        >
          Ask on WhatsApp
        </CtaLink>
      </div>
    </div>
  )
}
