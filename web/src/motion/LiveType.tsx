import { useRef, type ReactNode } from 'react'

// The headline is the moving part.
//
// Inter is a variable font, so pointer position across the block can drive its
// weight axis continuously rather than the type sitting at one fixed choice, and
// a soft warm light tracks the cursor over the letterforms. This writes three
// custom properties and CSS does the rest, so nothing animates in JavaScript and
// there is no work at all until a pointer actually moves.
//
// Touch and keyboard readers get the resting weight, which is the designed one.
export default function LiveType({
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
      className={`livetype ${className}`}
      onPointerMove={(event) => {
        const element = ref.current
        if (!element || event.pointerType !== 'mouse') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const rect = element.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        element.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
        element.style.setProperty('--my', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`)
        element.style.setProperty('--w', Math.min(1, Math.max(0, x)).toFixed(3))
      }}
      onPointerLeave={() => {
        // Back to the resting weight rather than freezing wherever the pointer
        // happened to exit.
        ref.current?.style.setProperty('--w', '0.5')
      }}
    >
      {children}
    </div>
  )
}
