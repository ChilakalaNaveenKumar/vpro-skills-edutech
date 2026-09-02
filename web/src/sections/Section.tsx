import { useEffect, useRef, useState, type ReactNode } from 'react'
import { sectionNumber } from '../content/sections'

interface Props {
  id: string
  children: ReactNode
  className?: string
}

// A section in normal document flow, with its own reveal observer. Reveals are
// never driven by a shared scroll controller, so every section reads completely
// even if JavaScript for the scrub stages never runs.
export default function Section({ id, children, className = '' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-8% 0px -8% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      data-section={id}
      className={`section ${revealed ? 'is-active' : ''} ${className}`}
    >
      {children}
    </section>
  )
}

// The printed section number and name. Numbers come from the running order, so
// inserting or removing a section renumbers the whole page automatically.
export function SectionLabel({ id, title }: { id: string; title: string }) {
  return (
    <div className="rise flex items-center gap-4">
      <span className="tnum text-xs font-semibold tracking-[0.18em] text-[color:var(--signal-text)]">
        {sectionNumber(id)}
      </span>
      <span className="h-px w-10 bg-[color:var(--rule)]" aria-hidden="true" />
      <span className="eyebrow">{title}</span>
    </div>
  )
}
