import { useRef, type ReactNode } from 'react'

// Cursor-follow highlight for panels and grids. Writes --mx/--my; the .spotlight
// rule paints the gradient. Additive: the panel is complete without it.
export default function Spotlight({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className={`spotlight ${className}`}
      onPointerMove={(event) => {
        const element = ref.current
        if (!element || event.pointerType !== 'mouse') return
        const rect = element.getBoundingClientRect()
        element.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        element.style.setProperty('--my', `${event.clientY - rect.top}px`)
      }}
    >
      {children}
    </div>
  )
}
