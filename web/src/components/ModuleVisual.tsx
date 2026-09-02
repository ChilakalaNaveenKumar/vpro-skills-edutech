import { useEffect, useRef } from 'react'
import { STILL_AT, VISUALS, type VisualKey } from '../visuals/registry'
import type { Palette } from '../visuals/types'

const FALLBACK: Palette = {
  text: '#f7f4ee', mute: '#c8c2b8', faint: '#9b958c',
  signal: '#ff8111', rule: '#3f3a34', surface: '#100a06', surfaceAlt: '#241f1a',
}

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el)
  const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    text: read('--on-ink', FALLBACK.text),
    mute: read('--on-ink-mute', FALLBACK.mute),
    faint: read('--on-ink-faint', FALLBACK.faint),
    signal: read('--signal', FALLBACK.signal),
    rule: read('--rule', FALLBACK.rule),
    surface: read('--ink', FALLBACK.surface),
    surfaceAlt: read('--ink-2', FALLBACK.surfaceAlt),
  }
}

interface Props {
  visual: VisualKey
  /** Only the selected module animates; the rest are unmounted. */
  label: string
}

// Canvas host for one module explainer. Animates only while on screen and while
// the document is visible, and renders a single representative frame under
// reduced motion.
export default function ModuleVisual({ visual, label }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = VISUALS[visual]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let palette = readPalette(host)
    let width = 0
    let height = 0
    let frame = 0
    let onScreen = false
    let start = 0

    const resize = () => {
      const rect = host.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      palette = readPalette(host)
    }

    const paint = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      draw({ ctx, w: width, h: height, t, p: palette })
    }

    const tick = (now: number) => {
      if (!start) start = now - STILL_AT[visual] * 1000
      paint((now - start) / 1000)
      frame = onScreen && !document.hidden ? requestAnimationFrame(tick) : 0
    }

    const run = () => {
      if (reduce) {
        paint(STILL_AT[visual])
        return
      }
      if (onScreen && !document.hidden && !frame) frame = requestAnimationFrame(tick)
    }

    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (reduce || !frame) paint(reduce ? STILL_AT[visual] : 0)
    })
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
      if (onScreen) run()
      else stop()
    })
    const onVisibility = () => (document.hidden ? stop() : run())

    resize()
    paint(STILL_AT[visual])
    resizeObserver.observe(host)
    intersection.observe(host)
    document.addEventListener('visibilitychange', onVisibility)
    run()

    return () => {
      stop()
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [visual])

  return (
    <div ref={hostRef} className="relative h-full w-full" role="img" aria-label={label}>
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
