import { COURSES } from '../content/courses'
import CourseCard from '../components/CourseCard'
import LiveClassesPanel from '../components/LiveClassesPanel'
import CtaLink from '../components/CtaLink'
import { courseStateFor } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'

// Every course, each linking to its own page. The home page names the flagship
// and sends people here; the detail belongs on the course, not on the home page.
export default function CoursesPage() {
  const { rows } = useSchedule()

  return (
    <div className="shell py-28 lg:py-36">
      <p className="eyebrow">Courses</p>

      <h1
        aria-label={'Every course, taught live'}
        className="display mt-6 max-w-[24ch] text-[clamp(2rem,5vw,3.4rem)] text-[color:var(--on-ink)]"
      >
        Every course, taught live
      </h1>

      <p className="lede rise mt-6 max-w-2xl">
        Each course runs as a live batch with a named trainer at a fixed time, topics in order, and
        an assessment after each one. Open a course to see its full curriculum.
      </p>

      <div className="mt-14">
        <LiveClassesPanel />
      </div>

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course, index) => {
          // Missing schedule data is unknown, not evidence that a course is gathering interest.
          const state = rows ? courseStateFor(course.name, rows) : null
          return (
            <li key={course.slug} className="h-full">
              <CourseCard course={course} index={index} state={state} />
            </li>
          )
        })}
      </ul>

      <div className="mt-16 flex flex-col gap-4 border-t border-[color:var(--rule)] pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.92rem] text-[color:var(--on-ink-mute)]">
          Not sure which one fits? Tell us where you are now and we will say so plainly.
        </p>
        <CtaLink
          cta="course_interest"
          chapter="courses_index"
          className="btn-primary shrink-0"
        >
          Ask on WhatsApp
        </CtaLink>
      </div>
    </div>
  )
}
