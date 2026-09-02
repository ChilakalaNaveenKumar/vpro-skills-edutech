import { useEffect, useRef, type ReactNode } from 'react'

// A scroll-scrubbed image sequence on a sticky canvas stage.
//
// Native scroll position is the only source of truth: the same scroll offset
// always produces the same frame, forwards, backwards, after a flick or after a
// reload at depth. Nothing here is a video and nothing autoplays.
//
// Progress is published as `--p` on the stage element once per frame, so overlay
// copy can be revealed with CSS arithmetic instead of re-rendering React 60
// times a second.

export interface SequenceConfig {
  frameCount: number
  /** 1-based frame index to URL. */
  frameUrl: (index: number) => string
  /** Total scroll distance for the sequence, in viewport heights. */
  scrollVh: number
  /** Shown until real frames decode. */
  posterFrame: number
  /** The single frame rendered under prefers-reduced-motion. */
  reducedMotionFrame: number
  fit?: 'cover' | 'contain'
  /** Load every Nth frame on narrow viewports. */
  mobileStride?: number
  /**
   * The box the frame is fitted into, in fractions of the stage. Keeps the
   * subject out of the copy's column instead of filling the whole viewport.
   */
  region?: { x: number; y: number; w: number; h: number }
  /** Region used at 768px and below, where copy sits below the subject. */
  mobileRegion?: { x: number; y: number; w: number; h: number }
}

interface Props {
  config: SequenceConfig
  className?: string
  children?: ReactNode
}

export default function ScrollSequence({ config, className = '', children }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!section || !stage || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { frameCount, frameUrl, posterFrame, reducedMotionFrame, fit = 'contain' } = config
    const FULL = { x: 0, y: 0, w: 1, h: 1 }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduce = motion.matches
    const stride = window.innerWidth <= 768 ? Math.max(1, config.mobileStride ?? 2) : 1

    const frames = new Map<number, HTMLImageElement>()
    const pending = new Set<number>()
    let width = 0
    let height = 0
    let frame = 0
    let onScreen = true
    let progress = 0
    let lastDrawn = -1

    const clampIndex = (i: number) => Math.min(frameCount, Math.max(1, i))

    /** Snap to the stride grid so we only ever request frames we intend to load. */
    const onGrid = (i: number) => clampIndex(Math.round((i - 1) / stride) * stride + 1)

    const request = (index: number, priority = false) => {
      const i = onGrid(index)
      if (frames.has(i) || pending.has(i)) return
      pending.add(i)
      const image = new Image()
      image.decoding = 'async'
      if (priority) image.fetchPriority = 'high'
      image.onload = () => {
        pending.delete(i)
        frames.set(i, image)
        if (lastDrawn === -1) draw()
      }
      image.onerror = () => pending.delete(i)
      image.src = frameUrl(i)
    }

    /** The nearest already-decoded frame, so fast scrolling never shows a gap. */
    const nearest = (index: number): HTMLImageElement | null => {
      const target = onGrid(index)
      if (frames.has(target)) return frames.get(target) ?? null
      for (let offset = stride; offset <= frameCount; offset += stride) {
        const before = frames.get(onGrid(target - offset))
        if (before) return before
        const after = frames.get(onGrid(target + offset))
        if (after) return after
      }
      return null
    }

    const resize = () => {
      const rect = stage.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      lastDrawn = -1
    }

    const draw = () => {
      const index = reduce
        ? reducedMotionFrame
        : clampIndex(Math.round(progress * (frameCount - 1)) + 1)
      const image = nearest(index)
      ctx.clearRect(0, 0, width, height)
      if (!image) return

      const narrow = width <= 768
      const region =
        (narrow ? config.mobileRegion ?? config.region : config.region) ?? FULL
      const bx = region.x * width
      const by = region.y * height
      const bw = Math.max(1, region.w * width)
      const bh = Math.max(1, region.h * height)

      const scale =
        fit === 'cover'
          ? Math.max(bw / image.width, bh / image.height)
          : Math.min(bw / image.width, bh / image.height)
      const w = image.width * scale
      const h = image.height * scale
      ctx.drawImage(image, bx + (bw - w) / 2, by + (bh - h) / 2, w, h)
      lastDrawn = onGrid(index)
    }

    const readProgress = () => {
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, section.offsetHeight - window.innerHeight)
      progress = Math.min(1, Math.max(0, -rect.top / travel))
      stage.style.setProperty('--p', progress.toFixed(4))
    }

    const tick = () => {
      frame = 0
      readProgress()
      const index = reduce
        ? reducedMotionFrame
        : clampIndex(Math.round(progress * (frameCount - 1)) + 1)
      if (onGrid(index) !== lastDrawn) draw()
      // A window around the current frame, both directions, so scrubbing back
      // is as smooth as scrubbing forward without loading everything.
      if (!reduce) {
        for (let ahead = 1; ahead <= 6; ahead += 1) {
          request(index + stride * ahead)
          request(index - stride * ahead)
        }
      }
    }

    const schedule = () => {
      if (!onScreen || document.hidden) return
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
      if (onScreen) schedule()
    })
    const resizeObserver = new ResizeObserver(() => {
      resize()
      schedule()
    })
    const onVisibility = () => {
      if (!document.hidden) schedule()
    }
    const onMotion = () => {
      reduce = motion.matches
      lastDrawn = -1
      request(reduce ? reducedMotionFrame : posterFrame, true)
      schedule()
    }

    resize()
    readProgress()

    // Poster first, then the reduced-motion resting frame, then a coarse spread
    // so a fast scroll always has something to show before the rest arrive.
    request(reduce ? reducedMotionFrame : posterFrame, true)
    request(reducedMotionFrame)
    if (!reduce) {
      // A coarse spread only - twelve frames, so a fast scroll always has
      // something to show. The rest are fetched in a window around the reader
      // as they move, rather than pulling the whole sequence up front.
      const coarse = Math.max(stride, Math.floor(frameCount / 12))
      for (let i = 1; i <= frameCount; i += coarse) request(i)
    }

    intersection.observe(section)
    resizeObserver.observe(stage)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotion)
    schedule()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      intersection.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
      frames.clear()
      pending.clear()
    }
  }, [config])

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{ height: `${config.scrollVh}vh` }}
    >
      <div ref={stageRef} className="sticky top-0 flex h-svh w-full flex-col justify-center">
        <canvas ref={canvasRef} className="block" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
