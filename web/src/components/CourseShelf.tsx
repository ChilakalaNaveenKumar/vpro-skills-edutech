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
      {/* Desktop: spines. A row of six vertical spines is unusable on a phone,
          so below md the same data renders as a plain stack (further down). */}
      <div className="hidden h-[560px] gap-1 md:flex">
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
              className="relative overflow-hidden transition-[flex-grow] duration-700 ease-[var(--ease-reveal)] motion-reduce:transition-none"
              style={{
                flexGrow: isOpen ? 7.2 : 1,
                flexBasis: 0,
                background: isOpen ? openBg(course.hue) : closedBg(course.hue),
                boxShadow: `inset 0 0 0 1px rgb(237 231 222 / ${isOpen ? 0.28 : 0.12})`,
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
                className={
                  isOpen
                    ? 'mono absolute left-10 top-10 z-10 text-[color:var(--on-ink)]'
                    : 'flex h-full w-full items-end justify-center pb-8'
                }
              >
                {isOpen ? (
                  state
                ) : (
                  <span
                    className="display whitespace-nowrap text-[1.4rem] text-[color:var(--on-ink)]"
                    style={{ writingMode: 'vertical-rl', rotate: '180deg' }}
                  >
                    {course.name}
                  </span>
                )}
              </button>

              <div
                id={`shelf-panel-${course.slug}`}
                className={isOpen ? 'flex h-full flex-col justify-end p-10' : 'hidden'}
              >
                <div>
                  <h3 className="display text-[clamp(1.8rem,3vw,2.6rem)]">{course.name}</h3>
                  <p className="lede mt-4 max-w-[46ch]">{course.tagline}</p>
                  <p className="mono mt-5 text-[color:var(--on-ink-mute)]">
                    {course.modules.map((module) => module.name).join(' · ')}
                  </p>
                  {note && (
                    <p className="mt-4 text-sm text-[color:var(--on-ink-mute)]">{note}</p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
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
