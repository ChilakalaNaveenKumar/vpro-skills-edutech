import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import { courseStateFor, courseStateNote } from '../utils/courseState'
import { useSchedule } from '../utils/schedule'
import CtaLink from './CtaLink'

// One lightness family across all six, so the shelf reads as one object rather
// than six unrelated colours. Hue comes from each course's own `hue` field.
const openBg = (hue: number) => `oklch(0.44 0.086 ${hue})`
const closedBg = (hue: number) => `oklch(0.288 0.045 ${hue})`

export default function CourseShelf() {
  // A single index, so exactly one spine is open at any time and hover, focus
  // and click cannot disagree about which one it is.
  const [open, setOpen] = useState(0)
  const { rows } = useSchedule()

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .course-shelf-spine,
          .course-shelf-label {
            transition: none !important;
          }

          .course-shelf-panel {
            animation: none !important;
          }
        }
      `}</style>
      {/* Desktop: spines. A row of six vertical spines is unusable on a phone,
          so below md the same data renders as a plain stack (further down). */}
      <div className="hidden h-[560px] items-stretch gap-[6px] md:flex">
        {COURSES.map((course, index) => {
          const isOpen = index === open
          // Null while loading and when the fetch fails. Claiming "Gathering
          // interest" on absent data would state as fact something we do not know.
          const state = rows ? courseStateFor(course.name, rows) : null
          const note = courseStateNote(course.name, rows)
          const inSession = state === 'In session'

          return (
            <div
              key={course.slug}
              className="course-shelf-spine relative min-w-0 cursor-pointer overflow-hidden"
              style={{
                flexGrow: isOpen ? 7.2 : 1,
                flexBasis: 0,
                background: isOpen ? openBg(course.hue) : closedBg(course.hue),
                boxShadow: `inset 0 0 0 1px rgb(237 231 222 / ${isOpen ? 0.28 : 0.12})`,
                transition:
                  'flex-grow 780ms var(--ease-open), background 500ms var(--ease-state), box-shadow 400ms',
              }}
              onMouseEnter={() => setOpen(index)}
              onFocusCapture={() => setOpen(index)}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`shelf-panel-${course.slug}`}
                aria-label={state ? `${course.name}, ${state}` : course.name}
                onClick={() => setOpen(index)}
                className={`absolute inset-0 z-10 ${isOpen ? 'pointer-events-none' : ''}`}
              >
                <span
                  className="course-shelf-label absolute inset-0 flex items-end justify-center py-7"
                  style={{
                    opacity: isOpen ? 0 : 1,
                    transition: 'opacity 340ms var(--ease-state)',
                  }}
                >
                  <span
                    className="display-sm whitespace-nowrap text-[25px] tracking-[-0.015em] text-[color:var(--on-ink)]"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', rotate: '180deg' }}
                  >
                    {course.name}
                  </span>
                </span>
              </button>

              <div
                id={`shelf-panel-${course.slug}`}
                aria-hidden={!isOpen}
                className={`course-shelf-panel absolute inset-0 flex flex-col justify-end px-[42px] py-10 ${
                  isOpen ? 'visible' : 'pointer-events-none invisible'
                }`}
                style={{
                  animation: isOpen
                    ? 'fadeIn 520ms var(--ease-state) 200ms both'
                    : 'none',
                }}
              >
                {state && (
                  <p className="mono mb-auto whitespace-nowrap text-[10.5px] text-[color:var(--on-ink)]">
                    {state}
                  </p>
                )}
                <h3 className="display max-w-[20ch] text-[clamp(30px,3.6vw,54px)] leading-[1.02] tracking-[-0.035em]">
                  {course.name}
                </h3>
                <p className="mt-4 max-w-[46ch] text-base leading-[1.55] text-[color:rgb(237_231_222_/_0.88)]">
                  {course.tagline}
                </p>
                <p className="mono mt-[18px] max-w-[56ch] text-[11px] tracking-[0.06em] text-[color:rgb(237_231_222_/_0.8)] normal-case">
                  {course.modules.map((module) => module.name).join(' · ')}
                </p>
                {note && (
                  <p className="mt-4 text-sm text-[color:var(--on-ink-mute)]">{note}</p>
                )}
                <div className="mt-7 flex flex-wrap gap-[10px]">
                  <Link to={`/courses/${course.slug}`} className="btn-secondary">
                    View curriculum
                  </Link>
                  <CtaLink
                    cta={inSession ? 'reserve_seat' : 'course_waitlist'}
                    chapter="shelf"
                    course={course.name}
                    className="btn-primary"
                  >
                    {inSession ? 'Reserve my seat' : 'Register interest'}
                  </CtaLink>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Phone: a stack. */}
      <div className="space-y-3 md:hidden">
        {COURSES.map((course) => {
          // Null while loading and when the fetch fails. Claiming "Gathering
          // interest" on absent data would state as fact something we do not know.
          const state = rows ? courseStateFor(course.name, rows) : null
          const inSession = state === 'In session'
          return (
            <div
              key={course.slug}
              className="p-7"
              style={{
                background: closedBg(course.hue),
                boxShadow: 'inset 0 0 0 1px rgb(237 231 222 / 0.12)',
              }}
            >
              {state && <p className="mono text-[color:var(--on-ink-faint)]">{state}</p>}
              <h3 className="display mt-3 text-[1.6rem]">{course.name}</h3>
              <p className="lede mt-3 text-[1rem]">{course.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/courses/${course.slug}`} className="btn-secondary">
                  View curriculum
                </Link>
                <CtaLink
                  cta={inSession ? 'reserve_seat' : 'course_waitlist'}
                  chapter="shelf"
                  course={course.name}
                  className="btn-primary"
                >
                  {inSession ? 'Reserve my seat' : 'Register interest'}
                </CtaLink>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
