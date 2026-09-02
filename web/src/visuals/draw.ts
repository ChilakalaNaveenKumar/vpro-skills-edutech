import type { Palette } from './types'

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Ramp that holds at 1 - phase transitions that stay put once reached. */
export function phase(t: number, start: number, duration: number): number {
  return easeOut(clamp((t - start) / duration))
}

/** Deterministic PRNG so scatter layouts never jitter between frames. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

interface LabelOptions {
  size?: number
  weight?: number
  color?: string
  align?: CanvasTextAlign
  mono?: boolean
  alpha?: number
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, o: LabelOptions = {}) {
  const { size = 12, weight = 500, color = '#fff', align = 'left', mono = false, alpha = 1 } = o
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `${weight} ${size}px ${mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : '"Poppins", ui-sans-serif, system-ui, sans-serif'}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
  ctx.restore()
}

export function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 1, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Soft additive halo, used sparingly to mark the element under attention. */
export function halo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 0.5) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Caption strip every visual shares, so the six read as one system. */
export function caption(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, p: Palette) {
  label(ctx, text, w / 2, h - 14, { size: 11, weight: 500, color: p.faint, align: 'center' })
}
