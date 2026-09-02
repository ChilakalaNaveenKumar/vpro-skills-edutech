import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CHAPTERS } from '../world/chapters'

interface Props {
  index: number
  activeChapter: number
  children: ReactNode
  className?: string
}

// One [data-cam] anchor per ledger chapter. scrollWeight becomes real document
// height, so dwell is measured from the DOM and the conductor stays pure.
//
// Reveals run on their own IntersectionObserver, never on the world's chapter
// state, so the page reads completely even when WebGL is unavailable.
export default function Chapter({ index, children, className = '' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === 'undefined')
  const chapter = CHAPTERS[index]

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-12% 0px -12% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      data-cam={chapter.id}
      id={chapter.id}
      style={{ minHeight: `${100 * chapter.scrollWeight}svh` }}
      className={`chapter ${revealed ? 'is-active' : ''} ${className}`}
    >
      <div className="scrim pointer-events-none absolute inset-0 z-0" aria-hidden="true" />
      <div className="relative z-10 w-full">{children}</div>
    </section>
  )
}

export function ChapterLabel({ index, title }: { index: number; title: string }) {
  return (
    <div className="beat flex items-center gap-4" style={{ ['--d' as string]: 0 }}>
      <span className="font-editorial text-xs font-medium tracking-[0.3em] text-ember">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="h-px w-10 bg-bone/25" aria-hidden="true" />
      <span className="text-[0.7rem] uppercase tracking-[0.28em] text-bone/60">{title}</span>
    </div>
  )
}
