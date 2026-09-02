import { Link } from 'react-router-dom'
import type { CourseContent } from '../content/courses'
import { TECH_LABELS } from '../content/techMarks'
import TechMarks from './TechMarks'

// One course, said with the technologies it teaches.
//
// Arbitrary art objects meant nothing for a programming course - a stack of
// slabs does not tell anybody what Python Full Stack is. The real marks do, and
// every one of them appears in that course's own modules. Hovering brings them
// up in sequence into full colour and sweeps a light across the panel.
export default function CourseCard({
  course,
  scheduled = false,
}: {
  course: CourseContent
  scheduled?: boolean
}) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="course-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)] outline-offset-2 transition-colors duration-300 hover:border-[color:var(--on-ink-faint)] focus-visible:outline-2 focus-visible:outline-[color:var(--signal)]"
    >
      <div className="relative overflow-hidden border-b border-[color:var(--rule)] bg-black px-6 py-8">
        <span className="card-sweep pointer-events-none absolute inset-0" aria-hidden="true" />

        <TechMarks techs={course.techs} className="relative" />

        <p className="relative mt-5 text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--on-ink-faint)]">
          {course.techs
            .slice(0, 3)
            .map((tech) => TECH_LABELS[tech] ?? tech)
            .join(' · ')}
          {course.techs.length > 3 ? ` +${course.techs.length - 3}` : ''}
        </p>

        {course.flagship && (
          <span className="absolute right-5 top-5 rounded-full bg-[color:var(--signal)] px-2.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-[color:var(--ink)]">
            Flagship
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="display text-[1.1rem] text-[color:var(--on-ink)]">{course.name}</h3>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-[color:var(--on-ink-mute)]">
          {course.tagline}
        </p>

        <div className="tnum mt-5 flex flex-wrap items-center gap-x-4 text-[0.7rem] text-[color:var(--on-ink-faint)]">
          <span>{course.modules.length} modules</span>
          <span>{course.projects.length} projects</span>
          {scheduled && <span className="text-[color:var(--signal-text)]">Batch scheduled</span>}
        </div>

        <span className="mt-auto pt-6 text-[0.78rem] font-medium text-[color:var(--signal-text)]">
          See the curriculum
          <span
            className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  )
}
