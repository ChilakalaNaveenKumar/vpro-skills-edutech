import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { prefersReducedMotion } from './prefersReducedMotion'

interface Props {
  as?: ElementType
  /** Stagger position. Delay is (delayIndex % 3) * 80ms, matching the comp. */
  delayIndex?: number
  className?: string
  children: ReactNode
}

export default function Reveal({ as, delayIndex = 0, className = '', children }: Props) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  // Read once, during the first render: a second render just to reveal content
  // that was never going to animate is forty wasted renders on the home page.
  const [instant] = useState(() => prefersReducedMotion())
  const [shown, setShown] = useState(instant)

  useEffect(() => {
    if (instant) return

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    observer.observe(node)

    // If the observer never fires - a layout quirk, a zero-height parent - the
    // page must not stay blank.
    const failsafe = window.setTimeout(() => setShown(true), 2800)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [instant])

  const delay = (delayIndex % 3) * 80

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(20px)',
        transition: instant
          ? undefined
          : `opacity 720ms var(--ease-reveal) ${delay}ms, transform 720ms var(--ease-reveal) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  )
}
