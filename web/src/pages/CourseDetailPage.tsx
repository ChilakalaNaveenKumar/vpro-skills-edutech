import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courseBySlug } from '../content/courses'
import { listBatches } from '../services/batchesService'
import type { Batch } from '../types'
import ModuleExplorer from '../components/ModuleExplorer'
import CtaLink from '../components/CtaLink'
import SplitWords from '../motion/SplitWords'

// One course, in full: what it is, who it is for, the whole curriculum as
// something you can look at, the projects, the outcome, and its real batches.
export default function CourseDetailPage() {
  const { slug = '' } = useParams()
  const course = courseBySlug(slug)
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    let mounted = true
    listBatches()
      .then((data) => {
        if (mounted) setBatches(data)
      })
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  if (!course) {
    return (
      <div className="shell py-32">
        <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)] text-[color:var(--on-ink)]">
          That course does not exist
        </h1>
        <Link
          to="/courses"
          className="mt-6 inline-block text-[0.92rem] text-[color:var(--signal-text)] underline underline-offset-4"
        >
          See all courses
        </Link>
      </div>
    )
  }

  const courseBatches = batches.filter(
    (batch) =>
      batch.status === 'ACTIVE' &&
      batch.course_name.trim().toLowerCase() === course.name.toLowerCase(),
  )

  return (
    <div className="py-28 lg:py-32">
      <div className="shell">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[0.72rem]">
          <Link to="/courses" className="text-[color:var(--on-ink-faint)] hover:text-[color:var(--on-ink)]">
            Courses
          </Link>
          <span className="text-[color:var(--rule)]" aria-hidden="true">/</span>
          <span className="text-[color:var(--on-ink-mute)]">{course.name}</span>
        </nav>

        <h1
          aria-label={course.name}
          className="display mt-7 text-[clamp(2.1rem,5.4vw,3.6rem)] text-[color:var(--on-ink)]"
        >
          <SplitWords text={course.name} />
        </h1>

        <p className="rise mt-4 text-[clamp(1rem,2vw,1.3rem)] text-[color:var(--signal-text)]">
          {course.tagline}
        </p>

        <p className="lede rise mt-7 max-w-3xl">{course.summary}</p>

        <dl className="rise-stagger mt-12 grid gap-x-10 gap-y-6 border-t border-[color:var(--rule)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="eyebrow">Level</dt>
            <dd className="mt-2 text-[0.92rem] text-[color:var(--on-ink)]">{course.level}</dd>
          </div>
          <div>
            <dt className="eyebrow">Prerequisites</dt>
            <dd className="mt-2 text-[0.92rem] text-[color:var(--on-ink)]">{course.prerequisites}</dd>
          </div>
          <div>
            <dt className="eyebrow">Structure</dt>
            <dd className="tnum mt-2 text-[0.92rem] text-[color:var(--on-ink)]">
              {course.modules.length} modules &middot; {course.projects.length} projects
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Format</dt>
            <dd className="mt-2 text-[0.92rem] text-[color:var(--on-ink)]">
              Live batch, fixed time, named trainer
            </dd>
          </div>
        </dl>
      </div>

      {/* The curriculum, as something you look at rather than read. */}
      <ModuleExplorer modules={course.modules} />

      <div className="shell mt-24 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="display text-[clamp(1.4rem,3vw,2rem)] text-[color:var(--on-ink)]">
            What you build
          </h2>
          <ul className="mt-8 space-y-px">
            {course.projects.map((project) => (
              <li key={project.name} className="border-t border-[color:var(--rule)] py-4 last:border-b">
                <h3 className="text-[0.95rem] font-medium text-[color:var(--on-ink)]">{project.name}</h3>
                <p className="mt-1 text-[0.84rem] leading-relaxed text-[color:var(--on-ink-mute)]">
                  {project.description}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="display text-[clamp(1.4rem,3vw,2rem)] text-[color:var(--on-ink)]">
            What you leave with
          </h2>
          <ul className="mt-8 space-y-px">
            {course.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="flex items-baseline gap-3.5 border-t border-[color:var(--rule)] py-4 text-[0.94rem] leading-relaxed text-[color:var(--on-ink)] last:border-b"
              >
                <span className="text-[color:var(--signal)]" aria-hidden="true">&rarr;</span>
                {outcome}
              </li>
            ))}
          </ul>

          <h2 className="display mt-14 text-[clamp(1.4rem,3vw,2rem)] text-[color:var(--on-ink)]">
            Who it is for
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {course.forWhom.map((who) => (
              <li
                key={who}
                className="rounded-full border border-[color:var(--rule)] px-3.5 py-1.5 text-[0.78rem] text-[color:var(--on-ink-mute)]"
              >
                {who}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shell mt-24">
        <h2 className="display text-[clamp(1.4rem,3vw,2rem)] text-[color:var(--on-ink)]">
          Batches for this course
        </h2>
        {courseBatches.length === 0 ? (
          <p className="mt-6 max-w-2xl text-[0.94rem] text-[color:var(--on-ink-mute)]">
            No batch is scheduled for this course yet. Message us and we will tell you when the next
            one opens, and what the timing is likely to be.
          </p>
        ) : (
          <ul className="mt-8 space-y-px">
            {courseBatches.map((batch) => (
              <li key={batch.id} className="border-t border-[color:var(--rule)] py-5 last:border-b">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="text-[0.95rem] font-medium text-[color:var(--on-ink)]">
                      Batch {batch.batch_number}
                    </p>
                    <p className="mt-1 text-[0.8rem] text-[color:var(--on-ink-faint)]">
                      Trainer {batch.trainer_name}
                      {batch.progress_status === 'IN_PROGRESS' ? ' - in progress' : ''}
                    </p>
                  </div>
                  <p className="tnum text-[0.84rem] text-[color:var(--on-ink-mute)]">
                    {batch.start_date} to {batch.end_date} &middot; {batch.start_time.slice(0, 5)}
                    &ndash;{batch.end_time.slice(0, 5)} IST
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-14 flex flex-col gap-4 border-t border-[color:var(--rule)] pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.94rem] text-[color:var(--on-ink-mute)]">
            Sit in on a live session before you decide.
          </p>
          <div className="flex flex-wrap gap-3">
            <CtaLink
              cta="demo_register"
              chapter={`course_${course.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--paper)] px-7 py-3.5 text-sm font-semibold text-[color:var(--ink)] hover:bg-white"
            >
              Book a free demo
            </CtaLink>
            <CtaLink
              cta="talk_to_trainer"
              chapter={`course_${course.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--signal)] px-7 py-3.5 text-sm font-semibold text-[color:var(--signal)] transition-colors hover:bg-[color:var(--signal)] hover:text-[color:var(--ink)]"
            >
              Talk to the trainer
            </CtaLink>
          </div>
        </div>
      </div>
    </div>
  )
}
