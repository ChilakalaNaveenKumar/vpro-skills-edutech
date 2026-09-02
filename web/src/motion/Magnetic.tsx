import { useRef, type ReactNode } from 'react'

// Button that leans toward the pointer. Additive only - fully usable without it.
export default function Magnetic({
  children,
  className = '',
  radius = 70,
}: {
  children: ReactNode
  className?: string
  radius?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span
      ref={ref}
      className={`inline-block ${className}`}
      onPointerMove={(event) => {
        const el = ref.current
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        if (event.pointerType !== 'mouse') return
        const rect = el.getBoundingClientRect()
        const dx = event.clientX - (rect.left + rect.width / 2)
        const dy = event.clientY - (rect.top + rect.height / 2)
        el.style.transform = `translate(${(dx / rect.width) * radius * 0.32}px, ${(dy / rect.height) * radius * 0.32}px)`
      }}
      onPointerLeave={() => {
        const el = ref.current
        if (el) el.style.transform = ''
      }}
    >
      {children}
    </span>
  )
}
