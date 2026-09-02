import { useEffect, useRef, useState } from 'react'
import { createScrollConductor, type ScrollConductor } from './conductor'
import { createDawnWorld, qualityFor, type DawnWorld } from './scene'
import { CHAPTERS } from './chapters'

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

interface Props {
  /** Reports the exact active chapter index - never the damped value. */
  onChapterChange?: (index: number) => void
}

// Fixed full-viewport world behind the whole document. The DOM carries meaning;
// this carries place. Falls back to a composed CSS dawn when WebGL is absent.
export default function DawnAscent({ onChapterChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [supported, setSupported] = useState(() => webglAvailable())

  useEffect(() => {
    if (!supported) return
    const canvas = canvasRef.current
    if (!canvas) return

    const sections = document.querySelectorAll<HTMLElement>('[data-cam]')
    if (sections.length !== CHAPTERS.length) {
      // The ledger and the DOM must agree; a mismatch means the page changed
      // without the ledger, so fail visibly in development rather than drift.
      console.warn(`DawnAscent: ${sections.length} [data-cam] sections for ${CHAPTERS.length} chapters`)
    }
    if (!sections.length) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let world: DawnWorld | null = null
    let conductor: ScrollConductor | null = null
    let lastTime = 0

    try {
      let quality = qualityFor(window.innerWidth, window.innerHeight)
      world = createDawnWorld(canvas, quality)
      world.resize(window.innerWidth, window.innerHeight)

      conductor = createScrollConductor({
        sections,
        damping: 5.2,
        reducedMotion: motionQuery.matches,
        alwaysUpdate: true,
        onUpdate(state) {
          const now = performance.now()
          const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60
          lastTime = now
          world?.update(state, dt)
        },
        onChapterChange(index) {
          onChapterChange?.(index)
        },
      })
      conductor.start()

      // Dev-only handle so the journey can be asserted without relying on
      // screenshots (the camera path is verified numerically against the ledger).
      if (import.meta.env.DEV) {
        ;(window as unknown as Record<string, unknown>).__dawn = { conductor, world }
      }

      const onResize = () => {
        quality = qualityFor(window.innerWidth, window.innerHeight)
        world?.resize(window.innerWidth, window.innerHeight, quality)
      }
      const onMotionChange = () => conductor?.setReducedMotion(motionQuery.matches)

      window.addEventListener('resize', onResize, { passive: true })
      motionQuery.addEventListener('change', onMotionChange)

      return () => {
        window.removeEventListener('resize', onResize)
        motionQuery.removeEventListener('change', onMotionChange)
        conductor?.destroy()
        world?.dispose()
      }
    } catch (error) {
      console.warn('DawnAscent: WebGL world failed, using static fallback', error)
      conductor?.destroy()
      world?.dispose()
      setSupported(false)
      return
    }
  }, [onChapterChange, supported])

  if (!supported) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, #05070c 0%, #131a24 42%, #7a4a34 74%, #ffb765 100%)' }}
      />
    )
  }

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 -z-10 block h-full w-full" />
}
