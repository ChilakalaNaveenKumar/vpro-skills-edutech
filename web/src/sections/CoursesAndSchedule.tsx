import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import LiveClassesPanel from '../components/LiveClassesPanel'
import SplitWords from '../motion/SplitWords'
import Section, { SectionLabel } from './Section'

// What is teaching right now, and the courses it belongs to.
//
// The full curriculum deliberately does not live here. A home page that unrolls
// six syllabi is a page nobody finishes; each course owns its own page, and this
// section's job is to say what exists and what is running.
export default function CoursesAndSchedule() {
  return (
    <Section id="courses" className="border-y border-[color:var(--rule)]">
      <div className="shell py-24 lg:py-32">
        <SectionLabel id="courses" title="Courses and schedule" />

        <div className="mt-8 grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <h2
              aria-label={`${COURSES.length} courses, taught live`}
              className="display max-w-[18ch] text-[clamp(1.9rem,4.6vw,3.2rem)] text-[color:var(--on-ink)]"
            >
              <SplitWords text={`${COURSES.length} courses, taught live`} />
            </h2>

            <p className="lede rise mt-6 max-w-lg">
              Every course runs as a live batch with a named trainer. Open one to see its full
              curriculum, its projects, and the batches scheduled for it.
            </p>

            <ul className="rise-stagger mt-10 space-y-px">
              {COURSES.map((course) => (
                <li key={course.slug} className="border-t border-[color:var(--rule)] last:border-b">
                  <Link
                    to={`/courses/${course.slug}`}
                    className="group flex items-baseline justify-between gap-4 py-3.5 outline-offset-2 focus-visible:outline-2 focus-visible:outline-[color:var(--signal)]"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="text-[0.95rem] font-medium text-[color:var(--on-ink)]">
                        {course.name}
                      </span>
                      {course.flagship && (
                        <span className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-[color:var(--signal-text)]">
                          Flagship
                        </span>
                      )}
                    </span>
                    <span className="tnum flex shrink-0 items-baseline gap-4 text-[0.74rem] text-[color:var(--on-ink-faint)]">
                      {course.modules.length} modules
                      <span
                        className="inline-block transition-transform duration-300 group-hover:translate-x-1 text-[color:var(--signal-text)]"
                        aria-hidden="true"
                      >
                        &rarr;
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              to="/courses"
              className="rise mt-8 inline-flex items-center gap-2 text-[0.86rem] font-medium text-[color:var(--signal-text)] underline decoration-[color:var(--rule)] underline-offset-4 hover:decoration-[color:var(--signal)]"
            >
              Compare all {COURSES.length} courses
            </Link>
          </div>

          <div className="rise lg:sticky lg:top-28">
            <LiveClassesPanel />
          </div>
        </div>
      </div>
    </Section>
  )
}
