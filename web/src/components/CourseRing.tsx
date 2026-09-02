import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import CourseCard from './CourseCard'

// A turntable of courses.
//
// The cards stand on a ring in real 3D. Page scroll spins the ring, so each
// course arrives at the front centre in turn, and only the card at the front is
// interactive - the ones facing away are dimmed, blurred and click-through.
//
// Native scroll is the only driver, so the same offset always produces the same
// rotation, in both directions. Focusing a card with the keyboard spins the ring
// to it, and under reduced motion the ring is not used at all: the cards fall
// back to a plain readable column.

const STOPS = COURSES.length + 1 // the six courses, then the catalogue panel
const STEP = 360 / STOPS

export default function CourseRing({ scheduled }: { scheduled: Set<string> }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const ring = ringRef.current
    if (!section || !ring) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return

    let frame = 0
    let focusBias: number | null = null

    const apply = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -rect.top / travel))

      // Scroll walks the ring from the first stop to the last, not a full turn,
      // so the sequence has a real beginning and end.
      const index = focusBias ?? progress * (STOPS - 1)
      const spin = -index * STEP
      ring.style.setProperty('--spin', `${spin.toFixed(2)}deg`)

      for (const item of ring.querySelectorAll<HTMLElement>('[data-ring-item]')) {
        const position = Number(item.dataset.index ?? 0)
        // Angular distance from the front, normalised so 0 is facing us and 1 is
        // directly behind.
        let delta = Math.abs(((position - index) % STOPS) * STEP)
        if (delta > 180) delta = 360 - delta
        item.style.setProperty('--d', (delta / 180).toFixed(3))
        item.dataset.front = delta < STEP * 0.5 ? 'true' : 'false'
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const onFocusIn = (event: FocusEvent) => {
      const item = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-ring-item]')
      if (!item) return
      focusBias = Number(item.dataset.index ?? 0)
      schedule()
    }
    const onFocusOut = () => {
      focusBias = null
      schedule()
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    ring.addEventListener('focusin', onFocusIn)
    ring.addEventListener('focusout', onFocusOut)
    apply()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ring.removeEventListener('focusin', onFocusIn)
      ring.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const items = [
    ...COURSES.map((course) => ({
      key: course.slug,
      node: <CourseCard course={course} scheduled={scheduled.has(course.name.toLowerCase())} />,
    })),
    {
      key: 'catalogue',
      node: (
        <Link
          to="/courses"
          className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-[color:var(--rule)] bg-[color:var(--ink-2)] p-7 outline-offset-2 transition-colors duration-300 hover:border-[color:var(--signal)] focus-visible:outline-2 focus-visible:outline-[color:var(--signal)]"
        >
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[color:var(--on-ink-faint)]">
            Catalogue
          </p>
          <p className="display mt-6 text-[1.3rem] leading-tight text-[color:var(--on-ink)]">
            See all courses side by side
          </p>
          <span className="mt-8 text-[0.82rem] font-medium text-[color:var(--signal-text)]">
            Compare them
            <span
              className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </span>
        </Link>
      ),
    },
  ]

  return (
    <div ref={sectionRef} className="ring-section">
      <div className="ring-stage">
        <div
          ref={ringRef}
          className="ring"
          role="list"
          aria-label="Courses"
          style={{ ['--stops' as string]: STOPS }}
        >
          {items.map((item, index) => (
            <div
              key={item.key}
              data-ring-item
              data-index={index}
              role="listitem"
              className="ring-item"
              style={{ ['--slot' as string]: index }}
            >
              {item.node}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
