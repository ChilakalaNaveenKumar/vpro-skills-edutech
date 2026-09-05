import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './prefersReducedMotion'

interface Trace {
  amp: number
  freq: number
  speed: number
  colour: string
  width: number
}

const TRACES: Trace[] = [
  { amp: 0.16, freq: 1.5, speed: 0.00042, colour: 'rgba(200,112,70,0.62)', width: 1.4 },
  { amp: 0.11, freq: 2.6, speed: 0.00061, colour: 'rgba(195,164,123,0.36)', width: 1 },
  { amp: 0.07, freq: 4.1, speed: 0.00088, colour: 'rgba(237,231,222,0.16)', width: 1 },
]

// A live audio scope. It reads as sound in a room rather than as decoration,
// which is the whole argument the page is making: a class is a voice, live, at
// a fixed hour.
export default function HeroScope({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      const mid = height * 0.52
      TRACES.forEach((trace, i) => {
        ctx.beginPath()
        ctx.lineWidth = trace.width
        ctx.strokeStyle = trace.colour
        const phase = t * trace.speed + i * 1.7
        for (let x = 0; x <= width; x += 3) {
          const u = x / Math.max(width, 1)
          // Envelope: both ends fall to zero, so the traces never clip an edge.
          const env = Math.sin(u * Math.PI)
          const y =
            mid +
            Math.sin(u * Math.PI * 2 * trace.freq + phase) * height * trace.amp * env +
            Math.sin(u * Math.PI * 2 * (trace.freq * 2.3) - phase * 1.4) *
              height *
              trace.amp *
              0.3 *
              env
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
    }

    if (prefersReducedMotion()) {
      draw(0)
      return () => window.removeEventListener('resize', size)
    }

    let frame = 0
    const tick = (ts: number) => {
      draw(ts)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', size)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
