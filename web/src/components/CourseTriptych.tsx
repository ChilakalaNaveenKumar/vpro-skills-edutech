import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import CourseCard from './CourseCard'

// A hinged triptych, not a carousel.
//
// Three panels stand on a plinth: the centre one flat and facing you, the two
// wings hinged forward from their inner edges like a real trifold display. All
// three are fully readable at once - nothing is scrolled, faded out or blurred.
//
// The wings are the previous and next course. Clicking a wing swings it to the
// centre; the arrows and the left/right keys do the same. There is no scroll
// hijacking of any kind: the page scrolls past this at its normal speed.

const COUNT = COURSES.length

export default function CourseTriptych({ scheduled }: { scheduled: Set<string> }) {
  const [active, setActive] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)

  const move = useCallback((direction: 1 | -1) => {
    setActive((current) => (current + direction + COUNT) % COUNT)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        move(1)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        move(-1)
      }
    }
    stage.addEventListener('keydown', onKey)
    return () => stage.removeEventListener('keydown', onKey)
  }, [move])

  const leftIndex = (active - 1 + COUNT) % COUNT
  const rightIndex = (active + 1) % COUNT

  const slots = [
    { slot: 'left' as const, index: leftIndex },
    { slot: 'centre' as const, index: active },
    { slot: 'right' as const, index: rightIndex },
  ]

  return (
    <div className="triptych-wrap">
      <div
        ref={stageRef}
        className="triptych"
        tabIndex={0}
        role="group"
        aria-label="Courses"
        aria-roledescription="Three-panel course display"
      >
        {slots.map(({ slot, index }) => {
          const course = COURSES[index]
          const isCentre = slot === 'centre'
          return (
            <div key={slot} className="panel" data-slot={slot}>
              <span className="panel-index" aria-hidden="true">
                #{index + 1}
              </span>

              {isCentre ? (
                <CourseCard course={course} scheduled={scheduled.has(course.name.toLowerCase())} />
              ) : (
                // A wing is a control first: pressing it brings that course to
                // the centre rather than navigating away from the page.
                <button
                  type="button"
                  className="panel-button"
                  onClick={() => setActive(index)}
                  aria-label={`Bring ${course.name} to the centre`}
                >
                  <CourseCard course={course} scheduled={scheduled.has(course.name.toLowerCase())} />
                </button>
              )}
            </div>
          )
        })}

        <span className="plinth" aria-hidden="true" />
      </div>

      <div className="shell mt-10 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => move(-1)} aria-label="Previous course" className="flow-nav">
          <span aria-hidden="true">&larr;</span>
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next course" className="flow-nav">
          <span aria-hidden="true">&rarr;</span>
        </button>

        <ol className="ml-2 flex items-center gap-2" aria-label="Course position">
          {COURSES.map((course, index) => (
            <li key={course.slug}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-current={index === active ? 'true' : undefined}
                aria-label={course.name}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === active
                    ? 'w-7 bg-[color:var(--signal)]'
                    : 'w-1.5 bg-[color:var(--rule)] hover:bg-[color:var(--on-ink-faint)]'
                }`}
              />
            </li>
          ))}
        </ol>

        <Link
          to="/courses"
          className="ml-auto text-[0.84rem] font-medium text-[color:var(--signal-text)] underline decoration-[color:var(--rule)] underline-offset-4 hover:decoration-[color:var(--signal)]"
        >
          See all courses &rarr;
        </Link>
      </div>
    </div>
  )
}
