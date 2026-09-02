import { useEffect, useState } from 'react'

// Which section the reader is actually in, decided by a thin band across the
// middle of the viewport: whatever crosses the band is active. Reading it from
// the DOM rather than from a scroll controller means the rail can never lag or
// disagree with what is on screen.
export function useActiveSection(ids: string[]): string {
  const key = ids.join('|')
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const sections = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))
    if (!sections.length || typeof IntersectionObserver === 'undefined') return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // Document order breaks the tie when a short section and a tall pinned
        // stage both touch the band, so the rail steps forward monotonically.
        const first = sections.find((section) => visible.has(section.id))
        if (first) setActive(first.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [key])

  return active
}
