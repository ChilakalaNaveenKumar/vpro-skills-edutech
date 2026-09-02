import { caption, clamp, dot, halo, label, line, seeded } from './draw'
import type { DrawFn } from './types'

const LAYERS = [4, 6, 6, 3]
const CYCLE = 6

const weights = (() => {
  const rand = seeded(70117)
  return LAYERS.slice(0, -1).map((count, l) =>
    Array.from({ length: count * LAYERS[l + 1] }, () => rand() * 0.9 + 0.1),
  )
})()

// Deep Learning: a forward pass. Signal enters, travels layer by layer, and the
// edges it uses brighten - which is the whole idea of a weighted network.
export const drawDeep: DrawFn = ({ ctx, w, h, t, p }) => {
  const cycle = t % CYCLE
  const padX = w * 0.12
  const spanX = w - padX * 2
  const top = 62
  const spanY = h - top - 58

  const nodeXY = (l: number, i: number) => {
    const count = LAYERS[l]
    const x = padX + (spanX * l) / (LAYERS.length - 1)
    const gap = spanY / Math.max(1, count - 1)
    const y = count === 1 ? top + spanY / 2 : top + gap * i
    return { x, y }
  }

  // The pulse front, sweeping left to right across the layer gaps.
  const front = clamp(cycle / 3.6) * (LAYERS.length - 1)

  LAYERS.slice(0, -1).forEach((count, l) => {
    for (let i = 0; i < count; i += 1) {
      for (let j = 0; j < LAYERS[l + 1]; j += 1) {
        const a = nodeXY(l, i)
        const b = nodeXY(l + 1, j)
        const weight = weights[l][i * LAYERS[l + 1] + j]
        const local = clamp(front - l)
        const lit = local > 0.02 ? weight : 0
        line(ctx, a.x, a.y, b.x, b.y, lit > 0 ? p.signal : p.rule, 0.6 + weight * 1.5, lit > 0 ? 0.1 + lit * weight * 0.55 : 0.16)

        // A travelling packet on the strongest edges only, so it stays readable.
        if (local > 0 && local < 1 && weight > 0.66) {
          const px = a.x + (b.x - a.x) * local
          const py = a.y + (b.y - a.y) * local
          dot(ctx, px, py, 2.2, p.signal, 0.9)
        }
      }
    }
  })

  LAYERS.forEach((count, l) => {
    for (let i = 0; i < count; i += 1) {
      const { x, y } = nodeXY(l, i)
      const activation = clamp(front - l + 0.35)
      if (activation > 0.05) halo(ctx, x, y, 16, p.signal, activation * 0.45)
      dot(ctx, x, y, 6.5, activation > 0.5 ? p.signal : p.surfaceAlt)
      ctx.save()
      ctx.strokeStyle = activation > 0.5 ? p.signal : p.rule
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(x, y, 6.5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  })

  const names = ['input', 'hidden', 'hidden', 'output']
  LAYERS.forEach((_, l) => {
    const { x } = nodeXY(l, 0)
    label(ctx, names[l], x, top - 26, { size: 10, align: 'center', color: p.faint })
  })

  label(ctx, 'forward pass', padX, 30, { size: 12, weight: 600, color: p.text })
  if (front >= LAYERS.length - 1.02) {
    label(ctx, 'prediction', w - padX, 30, { size: 11, mono: true, align: 'right', color: p.signal })
  }

  caption(ctx, 'Neural networks, CNNs and transfer learning in TensorFlow and Keras', w, h, p)
}
