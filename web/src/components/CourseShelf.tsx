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
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const { rows } = useSchedule()
  const open = focused ?? hovered ?? selected

  return (
    <>
      {/* Desktop: spines. A row of six vertical spines is unusable on a phone,
          so below md the same data renders as a plain stack (further down). */}
      <div className="hidden h-[560px] gap-1 md:flex">
        {COURSES.map((course, index) => {
          const isOpen = index === open
          const state = courseStateFor(course.name, rows)
          const note = courseStateNote(course.name, rows)
          const inSession = state === 'In session'

          return (
            <div
              key={course.slug}
              className="relative overflow-hidden transition-[flex-grow] duration-700 ease-[var(--ease-reveal)]"
              style={{
                flexGrow: isOpen ? 7.2 : 1,
                flexBasis: 0,
                background: isOpen ? openBg(course.hue) : closedBg(course.hue),
                boxShadow: `inset 0 0 0 1px rgb(237 231 222 / ${isOpen ? 0.28 : 0.12})`,
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocusCapture={() => setFocused(index)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setFocused(null)
                }
              }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={course.name}
                onClick={() => setSelected(index)}
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

              {isOpen && (
                <div className="flex h-full flex-col justify-end p-10">
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
              )}
            </div>
          )
        })}
      </div>

      {/* Phone: a stack. */}
      <div className="space-y-3 md:hidden">
        {COURSES.map((course) => {
          const state = courseStateFor(course.name, rows)
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
              <p className="mono text-[color:var(--on-ink-faint)]">{state}</p>
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
