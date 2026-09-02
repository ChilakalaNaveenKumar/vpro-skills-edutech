import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '../content/courses'
import CourseCard from './CourseCard'

// Cover flow: the card at the centre stands straight, the ones either side
// rotate away and recede.
//
// Driven by the strip's own horizontal scroll, so it never touches the page's
// vertical scroll - the previous turntable consumed three screens of it. Side
// scroll, a swipe, the arrow buttons, the arrow keys and the scrollbar all move
// it, and the same scroll offset always produces the same arrangement.

const ROTATE = 34 // degrees at one card away
const DEPTH = 150 // px pushed back at one card away
const DIM = 0.42 // opacity removed at one card away

export default function CourseCoverflow({ scheduled }: { scheduled: Set<string> }) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const step = useCallback((direction: 1 | -1) => {
    const strip = stripRef.current
    if (!strip) return
    const item = strip.querySelector<HTMLElement>('[data-flow-item]')
    const width = item ? item.offsetWidth + 24 : strip.clientWidth * 0.6
    strip.scrollBy({ left: direction * width, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return

    const flat = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const apply = () => {
      frame = 0
      const bounds = strip.getBoundingClientRect()
      const centre = bounds.left + bounds.width / 2

      for (const item of strip.querySelectorAll<HTMLElement>('[data-flow-item]')) {
        const box = item.getBoundingClientRect()
        // Distance from centre measured in card widths, so the effect is the
        // same at every card size and viewport.
        const offset = (box.left + box.width / 2 - centre) / Math.max(1, box.width + 24)
        const clamped = Math.max(-2.2, Math.min(2.2, offset))
        const away = Math.abs(clamped)

        if (flat) {
          item.style.transform = ''
          item.style.opacity = ''
        } else {
          item.style.transform =
            `rotateY(${(-clamped * ROTATE).toFixed(2)}deg) ` +
            `translateZ(${(-away * DEPTH).toFixed(1)}px) ` +
            `scale(${(1 - away * 0.055).toFixed(3)})`
          // Never below half: a card you cannot read is not worth showing.
          item.style.opacity = Math.max(0.5, 1 - away * DIM).toFixed(3)
        }
        item.dataset.centred = away < 0.5 ? 'true' : 'false'
      }

      setAtStart(strip.scrollLeft <= 2)
      setAtEnd(strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 2)
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    strip.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(strip)
    apply()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      strip.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={stripRef}
        className="flow"
        role="list"
        aria-label="Courses"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            step(1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            step(-1)
          }
        }}
      >
        {COURSES.map((course) => (
          <div key={course.slug} data-flow-item role="listitem" className="flow-item">
            <CourseCard course={course} scheduled={scheduled.has(course.name.toLowerCase())} />
          </div>
        ))}

        {/* The strip ends on the catalogue, so the link needs no heading. */}
        <div data-flow-item role="listitem" className="flow-item">
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
        </div>
      </div>

      <div className="shell mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atStart}
          aria-label="Previous course"
          className="flow-nav"
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={atEnd}
          aria-label="Next course"
          className="flow-nav"
        >
          <span aria-hidden="true">&rarr;</span>
        </button>
        <p className="ml-2 text-[0.72rem] text-[color:var(--on-ink-faint)]">
          Scroll sideways, or use the arrows
        </p>
      </div>
    </div>
  )
}
