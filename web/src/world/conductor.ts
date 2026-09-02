// Native-scroll conductor: turns scrollY into exact + damped chapter progress.
// Ported from the build-threejs-scroll-worlds reference implementation.

export interface ConductorState {
  /** Exact chapter progress from the document, e.g. 2.35. Drives UI and gating. */
  exact: number
  /** Damped progress. Camera and visual interpolation only. */
  smooth: number
  index: number
  next: number
  localExact: number
  smoothIndex: number
  smoothNext: number
  localSmooth: number
  direction: number
}

export interface ConductorOptions {
  sections: ArrayLike<HTMLElement>
  damping?: number
  reducedMotion?: boolean
  onUpdate?: (state: ConductorState) => void
  onChapterChange?: (index: number, state: ConductorState) => void
  /** Fire onUpdate every frame, so a continuously animating world keeps rendering. */
  alwaysUpdate?: boolean
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export function createScrollConductor(options: ConductorOptions) {
  const sections = Array.from(options.sections)
  if (!sections.length) throw new Error('createScrollConductor requires sections')

  const damping = Number.isFinite(options.damping) ? (options.damping as number) : 5.2
  const onUpdate = options.onUpdate ?? (() => {})
  const onChapterChange = options.onChapterChange ?? (() => {})

  let reduce = Boolean(options.reducedMotion)
  let anchors: number[] = []
  let exact = 0
  let smooth = 0
  let direction = 0
  let previousY = 0
  let active = -1
  let running = false
  let frame = 0
  let lastTime = 0
  let dirty = true
  let widthAtMeasure = 0
  let resizeObserver: ResizeObserver | null = null

  const maxScroll = () =>
    Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

  function measure(): number[] {
    const max = maxScroll()
    widthAtMeasure = window.innerWidth
    anchors = sections.map((element, index) => {
      if (index === 0) return 0
      if (index === sections.length - 1) return max
      const value = element.offsetTop + element.offsetHeight * 0.5 - window.innerHeight * 0.5
      return clamp(value, 0, max)
    })
    for (let i = 1; i < anchors.length; i += 1) {
      anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1)
    }
    dirty = true
    return anchors.slice()
  }

  function progressAt(y: number): number {
    if (!anchors.length) measure()
    y = clamp(y, 0, maxScroll())
    if (y <= anchors[0]) return 0
    for (let i = 0; i < anchors.length - 1; i += 1) {
      if (y <= anchors[i + 1]) {
        const span = Math.max(1, anchors[i + 1] - anchors[i])
        return i + clamp((y - anchors[i]) / span, 0, 1)
      }
    }
    return anchors.length - 1
  }

  function segment(progress: number) {
    const last = sections.length - 1
    const index = clamp(Math.floor(progress), 0, last)
    const next = Math.min(last, index + 1)
    return { index, next, local: next === index ? 0 : clamp(progress - index, 0, 1) }
  }

  function state(): ConductorState {
    const e = segment(exact)
    const s = segment(smooth)
    return {
      exact, smooth,
      index: e.index, next: e.next, localExact: e.local,
      smoothIndex: s.index, smoothNext: s.next, localSmooth: s.local,
      direction,
    }
  }

  function readScroll() {
    const y = window.scrollY || window.pageYOffset || 0
    const delta = y - previousY
    if (Math.abs(delta) > 0.25) direction = delta > 0 ? 1 : -1
    previousY = y
    exact = progressAt(y)
    dirty = true
  }

  function tick(now: number) {
    if (!running) return
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60
    lastTime = now

    const previousSmooth = smooth
    smooth = reduce ? exact : damp(smooth, exact, damping, dt)
    if (Math.abs(smooth - exact) < 0.0001) smooth = exact

    const next = state()
    if (next.index !== active) {
      active = next.index
      onChapterChange(active, next)
    }
    if (options.alwaysUpdate || dirty || smooth !== previousSmooth) {
      dirty = false
      onUpdate(next)
    }
    frame = requestAnimationFrame(tick)
  }

  const onScroll = () => readScroll()

  function onResize() {
    const widthChanged = window.innerWidth !== widthAtMeasure
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    // Mobile browsers fire resize on URL-bar collapse; only remeasure on real width changes.
    if (coarse && !widthChanged) return
    measure()
    readScroll()
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
      lastTime = 0
      return
    }
    if (running && !frame) frame = requestAnimationFrame(tick)
    readScroll()
  }

  function start() {
    if (running) return api
    running = true
    measure()
    previousY = window.scrollY || 0
    exact = progressAt(previousY)
    smooth = exact

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onResize, { passive: true })
    window.addEventListener('pageshow', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measure()
        readScroll()
      })
      sections.forEach((s) => resizeObserver?.observe(s))
    }

    active = -1
    lastTime = 0
    frame = requestAnimationFrame(tick)
    return api
  }

  function stop() {
    if (!running) return
    running = false
    cancelAnimationFrame(frame)
    frame = 0
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    window.removeEventListener('pageshow', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  function goTo(index: number, behavior: ScrollBehavior = 'smooth') {
    const i = clamp(Math.round(index), 0, anchors.length - 1)
    window.scrollTo({ top: anchors[i], behavior: reduce ? 'auto' : behavior })
  }

  function setReducedMotion(value: boolean) {
    reduce = Boolean(value)
    if (reduce) smooth = exact
    dirty = true
  }

  const api = { start, stop, destroy: stop, measure, read: readScroll, getState: state, progressAt, goTo, setReducedMotion }
  return api
}

export type ScrollConductor = ReturnType<typeof createScrollConductor>
