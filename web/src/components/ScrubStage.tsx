import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  /** Number of discrete states the stage steps through. */
  steps: number
  /** Scroll distance granted per step, as a fraction of viewport height. */
  vhPerStep?: number
  render: (state: { step: number; progress: number }) => ReactNode
  /** Rendered instead of the pinned stage under prefers-reduced-motion. */
  fallback: ReactNode
  className?: string
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// A pinned, scroll-scrubbed stage.
//
// Scroll position is the only input: no timers, no scroll hijacking, no
// animation that continues after the reader stops. Scrubbing backwards lands on
// exactly the state that forward scrolling showed, because `step` is a pure
// function of the section's position in the viewport.
//
// The document owns the scroll distance (the outer wrapper's height) and the
// stage sticks inside it, so the browser's own scrollbar stays truthful about
// how much page is left.
export default function ScrubStage({ steps, vhPerStep = 0.9, render, fallback, className = '' }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (reduce) return
    const element = wrapperRef.current
    if (!element) return

    let frame = 0
    let onScreen = true

    const read = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const travel = element.offsetHeight - window.innerHeight
      // A stage shorter than the viewport has no scrub distance; showing the
      // last state is the honest resting position rather than a stuck first one.
      setProgress(travel <= 0 ? 1 : clamp(-rect.top / travel, 0, 1))
    }

    // Coalesce to one read per frame, and stop reading entirely once the stage
    // is off screen - scroll listeners that keep measuring cost every section
    // below this one.
    const schedule = () => {
      if (!frame && onScreen) frame = requestAnimationFrame(read)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        if (onScreen) schedule()
      },
      { rootMargin: '20% 0px 20% 0px' },
    )
    observer.observe(element)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    read()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [reduce])

  if (reduce) return <>{fallback}</>

  const step = clamp(Math.floor(progress * steps), 0, steps - 1)

  return (
    <div ref={wrapperRef} style={{ height: `${100 + steps * vhPerStep * 100}svh` }}>
      <div className={`stage ${className}`}>{render({ step, progress })}</div>
    </div>
  )
}
