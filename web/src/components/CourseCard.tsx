import { Link } from 'react-router-dom'
import { COURSE_IMAGE_ALT, courseImage, type CourseContent } from '../content/courses'

// One course, as a card. The object image sits on the same black void the card
// does, so there is no visible image edge - the object simply floats in it.
export default function CourseCard({
  course,
  scheduled = false,
  priority = false,
}: {
  course: CourseContent
  scheduled?: boolean
  priority?: boolean
}) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--rule)] bg-[color:var(--ink-2)] outline-offset-2 transition-colors duration-300 hover:border-[color:var(--on-ink-faint)] focus-visible:outline-2 focus-visible:outline-[color:var(--signal)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-black">
        <img
          src={courseImage(course.slug)}
          alt={COURSE_IMAGE_ALT[course.slug] ?? ''}
          width={1200}
          height={750}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {course.flagship && (
          <span className="absolute left-4 top-4 rounded-full bg-[color:var(--signal)] px-2.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-[color:var(--ink)]">
            Flagship
          </span>
        )}
        {scheduled && (
          <span className="absolute right-4 top-4 rounded-full border border-[color:var(--rule)] bg-[color:var(--ink)]/80 px-2.5 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--on-ink-mute)] backdrop-blur">
            Batch scheduled
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="display text-[1.1rem] text-[color:var(--on-ink)]">{course.name}</h3>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-[color:var(--on-ink-mute)]">
          {course.tagline}
        </p>

        <div className="tnum mt-5 flex flex-wrap gap-x-4 text-[0.7rem] text-[color:var(--on-ink-faint)]">
          <span>{course.modules.length} modules</span>
          <span>{course.projects.length} projects</span>
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
