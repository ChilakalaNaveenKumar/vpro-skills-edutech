import { caption, dot, label, line, seeded } from './draw'
import { clamp, easeInOut } from './draw'
import type { DrawFn } from './types'

const CYCLE = 12
const N = 34

// Cached so the scatter never jitters between frames.
const points = (() => {
  const rand = seeded(20260902)
  return Array.from({ length: N }, () => {
    const x = rand()
    const noise = (rand() - 0.5) * 0.34
    return { x, y: clamp(0.16 + x * 0.66 + noise, 0.02, 0.98), cluster: rand() }
  })
})()

// Machine Learning: a line fitting itself to data, then the same points
// resolving into clusters. Supervised then unsupervised, in one frame.
export const drawMl: DrawFn = ({ ctx, w, h, t, p }) => {
  const cycle = t % CYCLE
  const padX = w * 0.1
  const padY = 58
  const plotW = w - padX * 2
  const plotH = h - padY - 56
  const px = (x: number) => padX + x * plotW
  const py = (y: number) => padY + (1 - y) * plotH

  // Axes.
  line(ctx, padX, padY, padX, padY + plotH, p.rule, 1, 0.8)
  line(ctx, padX, padY + plotH, padX + plotW, padY + plotH, p.rule, 1, 0.8)

  const fitting = cycle < 6
  const fitT = easeInOut(clamp(cycle / 4.4))
  const clusterT = easeInOut(clamp((cycle - 6.6) / 3.4))

  label(ctx, fitting ? 'Regression - fitting a line' : 'Clustering - finding groups', padX, 30, {
    size: 12, weight: 600, color: p.text,
  })

  if (fitting) {
    // Slope and intercept converge from a deliberately wrong start.
    const m = -0.35 + (0.66 - -0.35) * fitT
    const b = 0.72 + (0.16 - 0.72) * fitT
    line(ctx, px(0), py(b), px(1), py(m + b), p.signal, 2)

    points.forEach((pt) => {
      const predicted = m * pt.x + b
      // Residual ticks shrink as the fit improves.
      line(ctx, px(pt.x), py(pt.y), px(pt.x), py(predicted), p.signal, 1, 0.28 * (1 - fitT * 0.7))
      dot(ctx, px(pt.x), py(pt.y), 3.2, p.text, 0.85)
    })

    const error = (1 - fitT) * 0.42 + 0.03
    label(ctx, `loss ${error.toFixed(3)}`, padX + plotW, 30, {
      size: 11, mono: true, align: 'right', color: p.faint,
    })
  } else {
    // Three centroids drift to the middle of their own group.
    const centres = [
      { x: 0.2, y: 0.28 },
      { x: 0.52, y: 0.55 },
      { x: 0.84, y: 0.8 },
    ]
    points.forEach((pt) => {
      let best = 0
      let bestD = Infinity
      centres.forEach((c, i) => {
        const d = (c.x - pt.x) ** 2 + (c.y - pt.y) ** 2
        if (d < bestD) { bestD = d; best = i }
      })
      const colour = best === 1 ? p.signal : best === 0 ? p.text : p.mute
      dot(ctx, px(pt.x), py(pt.y), 3.2, clusterT > 0.15 ? colour : p.text, 0.9)
    })
    centres.forEach((c) => {
      const r = 6 + Math.sin(t * 2) * 0.6
      ctx.save()
      ctx.globalAlpha = clusterT
      ctx.strokeStyle = p.signal
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px(c.x), py(c.y), r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    })
    label(ctx, 'k = 3', padX + plotW, 30, { size: 11, mono: true, align: 'right', color: p.faint })
  }

  caption(ctx, 'Regression, classification, clustering - on the same 34 points', w, h, p)
}
