import { useRef } from 'react'
import { useScrollDriver } from './useScrollDriver'

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null)

  useScrollDriver((scrollY, maxScroll) => {
    if (ref.current) ref.current.style.width = `${(scrollY / maxScroll) * 100}%`
  })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5"
    >
      <div ref={ref} className="h-full bg-[color:var(--signal)]" style={{ width: '0%' }} />
    </div>
  )
}
