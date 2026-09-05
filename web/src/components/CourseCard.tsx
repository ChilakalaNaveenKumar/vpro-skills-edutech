import { Link } from 'react-router-dom'
import type { CourseContent } from '../content/courses'
import { TECH_LABELS } from '../content/techMarks'
import type { CourseState } from '../utils/courseState'
import TechMarks from './TechMarks'

// Course state stays optional because missing schedule data is unknown; the card
// must not turn an unavailable fetch into a "Gathering interest" claim.
export default function CourseCard({
  course,
  index,
  state,
}: {
  course: CourseContent
  /** Position in the catalogue, printed on the panel. */
  index: number
  state?: CourseState | null
}) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden bg-[color:var(--ink-2)] shadow-[inset_0_0_0_1px_var(--rule)] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="relative flex flex-col justify-between border-b border-[color:var(--rule)] px-6 pb-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <TechMarks techs={course.techs} className="relative max-w-[11rem]" />
          <span className="mono text-[color:var(--on-ink-faint)]">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <p className="mono mt-6 text-[color:var(--on-ink-faint)]">
          {course.techs
            .slice(0, 3)
            .map((tech) => TECH_LABELS[tech] ?? tech)
            .join(' · ')}
          {course.techs.length > 3 ? ` +${course.techs.length - 3}` : ''}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        {course.flagship && <span className="mono text-[color:var(--signal)]">Flagship</span>}

        <h3 className="display mt-3 text-[clamp(1.5rem,2.5vw,2rem)] text-[color:var(--on-ink)]">
          {course.name}
        </h3>
        <p className="mt-3 leading-relaxed text-[color:var(--on-ink-mute)]">{course.tagline}</p>

        <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-[color:var(--rule)] pt-5">
          <div className="min-w-0">
            <dt className="mono text-[color:var(--on-ink-faint)]">Modules</dt>
            <dd className="mt-2 text-[color:var(--on-ink)]">{course.modules.length}</dd>
          </div>
          <div className="min-w-0">
            <dt className="mono text-[color:var(--on-ink-faint)]">Projects</dt>
            <dd className="mt-2 text-[color:var(--on-ink)]">{course.projects.length}</dd>
          </div>
          {state && (
            <div className="col-span-2 min-w-0 border-t border-[color:var(--rule)] pt-4">
              <dt className="mono text-[color:var(--on-ink-faint)]">State</dt>
              <dd className="mt-2 text-[color:var(--on-ink)]">{state}</dd>
            </div>
          )}
        </dl>

        <span className="btn-secondary mt-7 self-start">
          See the curriculum
          <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </Link>
  )
}
