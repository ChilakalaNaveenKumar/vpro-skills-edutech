export interface Palette {
  text: string
  mute: string
  faint: string
  signal: string
  rule: string
  surface: string
  surfaceAlt: string
}

export interface Frame {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  /** Seconds since the visual became visible. */
  t: number
  p: Palette
}

/** Each module visual is a pure function of time - no internal state, so a
 *  reduced-motion render is just a call at a fixed, representative t. */
export type DrawFn = (frame: Frame) => void
