import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import CourseCard from '../components/CourseCard'
import LiveClassesPanel from '../components/LiveClassesPanel'
import WeekCalendar3D from '../components/WeekCalendar3D'
import SplitWords from '../motion/SplitWords'
import { useSchedule } from '../utils/schedule'
import Section, { SectionLabel } from './Section'

// What exists, and what is running.
//
// The courses are a horizontal rail rather than a six-card grid: six cards
// stacked vertically pushed everything below off the screen, and a rail is
// navigable by swipe, wheel, keyboard and scrollbar without leaving the section.
// The full curriculum lives on each course's own page.
export default function CoursesAndSchedule() {
  const { rows, failed } = useSchedule()
  const scheduled = new Set(
    (rows ?? []).map((row) => row.batch.course_name.trim().toLowerCase()),
  )

  return (
    <Section id="courses" className="border-y border-[color:var(--rule)]">
      <div className="py-20 lg:py-28">
        <div className="shell">
          <SectionLabel id="courses" title="Courses and schedule" />

          <h2
            aria-label="Every course, taught live"
            className="display mt-7 max-w-[20ch] text-[clamp(1.8rem,4vw,2.9rem)] text-[color:var(--on-ink)]"
          >
            <SplitWords text="Every course, taught live" />
          </h2>

          <p className="lede rise mt-5 max-w-2xl">
            Each one runs as a live batch with a named trainer. Open a course for its full
            curriculum and its scheduled batches.
          </p>

          <Link
            to="/courses"
            className="rise mt-6 inline-flex items-center gap-2 text-[0.86rem] font-medium text-[color:var(--signal-text)] underline decoration-[color:var(--rule)] underline-offset-4 hover:decoration-[color:var(--signal)]"
          >
            See all courses
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Rail. Bleeds to the viewport edge so it reads as continuing past it. */}
        <div
          className="rail mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
          role="list"
          aria-label="Courses"
        >
          <span aria-hidden="true" className="shrink-0 basis-[max(1.25rem,calc((100vw-78rem)/2+5rem))]" />
          {COURSES.map((course) => (
            <div
              key={course.slug}
              role="listitem"
              className="w-[19rem] shrink-0 snap-start sm:w-[21rem]"
            >
              <CourseCard
                course={course}
                scheduled={scheduled.has(course.name.toLowerCase())}
              />
            </div>
          ))}
          <span aria-hidden="true" className="shrink-0 basis-6" />
        </div>

        {/* The week, then the same information as a list underneath it. */}
        <div className="shell mt-20 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)] sm:aspect-[16/9]">
            <WeekCalendar3D rows={rows} failed={failed} />
            <p className="pointer-events-none absolute left-5 top-4 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--on-ink-faint)]">
              This week
            </p>
          </div>
          <LiveClassesPanel />
        </div>
      </div>
    </Section>
  )
}
