import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import CourseCard from './CourseCard'

// Courses arranged on a V and scrolled through it.
//
// The V opens away from the viewer: the card at the front point is closest and
// square-on, and its neighbours step back and away along the two legs, each
// turned to face along its own leg. Side scrolling walks the whole formation
// through the point, so every course arrives at the front in turn.
//
// The strip's own horizontal scroll is the only driver, so the page's vertical
// scroll is never touched. Cards are positioned from a continuous index, so the
// motion is smooth rather than snapping between slots.

const SPREAD_X = 0.62 // horizontal step, in card widths
const DEPTH_Z = 190 // px pushed back per step along a leg
const TURN = 38 // degrees each leg is turned
const VISIBLE = 3 // cards either side of the point

export default function CourseVScroller({ scheduled }: { scheduled: Set<string> }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [centre, setCentre] = useState(0)

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const step = track.scrollWidth / COURSES.length
    track.scrollTo({ left: Math.max(0, index) * step, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return

    const flat = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const apply = () => {
      frame = 0
      const step = track.scrollWidth / COURSES.length
      const position = step > 0 ? track.scrollLeft / step : 0
      setCentre(Math.round(position))

      const cards = stage.querySelectorAll<HTMLElement>('[data-v-card]')
      const width = cards[0]?.offsetWidth ?? 320

      cards.forEach((card, index) => {
        const t = index - position
        const away = Math.abs(t)

        if (away > VISIBLE + 0.5 || flat) {
          card.style.opacity = flat ? '1' : '0'
          card.style.pointerEvents = 'none'
          if (!flat) card.style.transform = 'translateX(-50%)'
          return
        }

        // Along the leg: sideways, back, and turned to face down the leg.
        const x = t * width * SPREAD_X
        const z = -away * DEPTH_Z
        const rotate = -Math.sign(t) * Math.min(away, 1) * TURN
        const lift = away * 10

        card.style.transform =
          `translateX(calc(-50% + ${x.toFixed(1)}px)) ` +
          `translateY(${lift.toFixed(1)}px) ` +
          `translateZ(${z.toFixed(1)}px) ` +
          `rotateY(${rotate.toFixed(2)}deg)`
        // Never below 0.55: a card that cannot be read is not worth a slot.
        card.style.opacity = Math.max(0.55, 1 - away * 0.2).toFixed(3)
        card.style.zIndex = String(100 - Math.round(away * 10))
        card.style.pointerEvents = away < 0.5 ? 'auto' : 'none'
      })
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    track.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(track)
    apply()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      track.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="vflow">
      <div ref={stageRef} className="vflow-stage" aria-hidden="true">
        {COURSES.map((course, index) => (
          <div key={course.slug} data-v-card className="vflow-card">
            <CourseCard
              course={course}
              index={index}
              scheduled={scheduled.has(course.name.toLowerCase())}
            />
          </div>
        ))}
        <span className="vflow-floor" />
      </div>

      {/* The scroll track. It carries the real, ordered list of courses for
          assistive technology and for anyone who scrolls it directly. */}
      <div
        ref={trackRef}
        className="vflow-track"
        role="list"
        aria-label="Courses"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            scrollToIndex(centre + 1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            scrollToIndex(centre - 1)
          }
        }}
      >
        {COURSES.map((course, index) => (
          <div key={course.slug} role="listitem" className="vflow-slot">
            <Link to={`/courses/${course.slug}`} className="sr-only">
              {course.name}: {course.tagline}
            </Link>
            <span aria-hidden="true" data-slot-index={index} />
          </div>
        ))}
      </div>

      <div className="shell mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => scrollToIndex(centre - 1)}
          disabled={centre <= 0}
          aria-label="Previous course"
          className="flow-nav"
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(centre + 1)}
          disabled={centre >= COURSES.length - 1}
          aria-label="Next course"
          className="flow-nav"
        >
          <span aria-hidden="true">&rarr;</span>
        </button>

        <ol className="ml-1 flex items-center gap-2">
          {COURSES.map((course, index) => (
            <li key={course.slug}>
              <button
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-current={index === centre ? 'true' : undefined}
                aria-label={course.name}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === centre
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
