import { Link } from 'react-router-dom'
import type { CourseContent } from '../content/courses'
import { TECH_LABELS } from '../content/techMarks'
import TechMarks from './TechMarks'

// A panel, not a list item.
//
// The old card was a flat dark box with small type - it read as a table row.
// This is built like a stand: a vivid accent head carrying the course number and
// the technologies, then a dark body with the name set large enough to be read
// across a room.
export default function CourseCard({
  course,
  index,
  scheduled = false,
}: {
  course: CourseContent
  /** Position in the catalogue, printed on the panel. */
  index: number
  scheduled?: boolean
}) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="course-card group flex h-full flex-col overflow-hidden rounded-[1.25rem]"
      style={{ ['--hue' as string]: course.hue }}
    >
      <div className="card-head relative flex flex-col justify-between px-6 pb-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <TechMarks techs={course.techs} className="relative max-w-[11rem]" />
          <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
        </div>

        <p className="card-techline mt-6">
          {course.techs
            .slice(0, 3)
            .map((tech) => TECH_LABELS[tech] ?? tech)
            .join(' · ')}
          {course.techs.length > 3 ? ` +${course.techs.length - 3}` : ''}
        </p>
      </div>

      <div className="card-body flex flex-1 flex-col px-6 pb-6 pt-5">
        {course.flagship && <span className="card-flag">Flagship</span>}

        <h3 className="card-title">{course.name}</h3>
        <p className="card-tagline">{course.tagline}</p>

        <dl className="card-stats">
          <div>
            <dt>Modules</dt>
            <dd>{course.modules.length}</dd>
          </div>
          <div>
            <dt>Projects</dt>
            <dd>{course.projects.length}</dd>
          </div>
          <div>
            <dt>Batch</dt>
            <dd>{scheduled ? 'Scheduled' : 'On request'}</dd>
          </div>
        </dl>

        <span className="card-cta">
          See the curriculum
          <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </Link>
  )
}
