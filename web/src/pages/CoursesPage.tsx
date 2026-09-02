import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { listBatches } from '../services/batchesService'
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
        aria-label={`${COURSES.length} courses, every one taught live`}
        className="display mt-6 max-w-[24ch] text-[clamp(2rem,5vw,3.4rem)] text-[color:var(--on-ink)]"
      >
        <SplitWords text={`${COURSES.length} courses, every one taught live`} />
      </h1>

      <p className="lede rise mt-6 max-w-2xl">
        Each course runs as a live batch with a named trainer at a fixed time, topics in order, and
        an assessment after each one. Open a course to see its full curriculum.
      </p>

      <div className="mt-14">
        <LiveClassesPanel />
      </div>

      <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course) => {
          const scheduled = liveCourseNames.has(course.name.toLowerCase())
          return (
            <li key={course.slug} className="bg-[color:var(--ink-2)]">
              <Link
                to={`/courses/${course.slug}`}
                className="group flex h-full flex-col p-7 outline-offset-2 transition-colors duration-300 hover:bg-[color:var(--ink-3)] focus-visible:outline-2 focus-visible:outline-[color:var(--signal)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="display text-[1.15rem] text-[color:var(--on-ink)]">{course.name}</h2>
                  {course.flagship && (
                    <span className="shrink-0 rounded-full bg-[color:var(--signal)] px-2 py-0.5 text-[0.52rem] font-bold uppercase tracking-[0.1em] text-[color:var(--ink)]">
                      Flagship
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[0.86rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                  {course.tagline}
                </p>

                <dl className="tnum mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[0.72rem] text-[color:var(--on-ink-faint)]">
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Modules</dt>
                    <dd>{course.modules.length} modules</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="sr-only">Projects</dt>
                    <dd>{course.projects.length} projects</dd>
                  </div>
                </dl>

                <p className="mt-4 text-[0.72rem] text-[color:var(--on-ink-faint)]">{course.level}</p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-7">
                  <span className="text-[0.78rem] font-medium text-[color:var(--signal-text)]">
                    See the curriculum
                    <span
                      className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </span>
                  {scheduled && (
                    <span className="text-[0.62rem] uppercase tracking-[0.12em] text-[color:var(--on-ink-faint)]">
                      Batch scheduled
                    </span>
                  )}
                </div>
              </Link>
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
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[color:var(--paper)] px-7 py-3.5 text-sm font-semibold text-[color:var(--ink)] hover:bg-white"
        >
          Ask on WhatsApp
        </CtaLink>
      </div>
    </div>
  )
}
