import { caption, dot, label, line, roundRect } from './draw'
import type { DrawFn } from './types'

const ITEMS = [4, 9, 2, 7, 5]
const CYCLE = 7

// Python Fundamentals: a loop walking a list, an accumulator updating, output
// appearing. Variables, loops and functions shown doing their actual job.
export const drawPython: DrawFn = ({ ctx, w, h, t, p }) => {
  const cycle = t % CYCLE
  const cellH = Math.min(34, (h - 150) / ITEMS.length)
  const cellW = Math.min(190, w * 0.34)
  const left = w * 0.08
  const top = 66

  label(ctx, 'numbers = [4, 9, 2, 7, 5]', left, 32, { size: 12, color: p.mute, mono: true })

  // One list item per step, plus a settle step at the end.
  const step = Math.min(ITEMS.length, Math.floor(cycle / 1.1))
  const within = (cycle / 1.1) % 1
  let total = 0
  for (let i = 0; i < step; i += 1) total += ITEMS[i]

  ITEMS.forEach((value, i) => {
    const y = top + i * (cellH + 8)
    const active = i === step
    const done = i < step
    ctx.save()
    ctx.globalAlpha = done || active ? 1 : 0.4
    roundRect(ctx, left, y, cellW, cellH, 8)
    ctx.fillStyle = active ? p.signal : p.surfaceAlt
    ctx.fill()
    if (!active) {
      ctx.strokeStyle = p.rule
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.restore()

    label(ctx, `numbers[${i}]`, left + 14, y + cellH / 2, {
      size: 11, mono: true, color: active ? p.surface : p.faint,
    })
    label(ctx, String(value), left + cellW - 16, y + cellH / 2, {
      size: 13, weight: 600, align: 'right', color: active ? p.surface : p.text,
    })

    if (active) {
      // Pointer travelling with the loop index.
      const px = left - 18
      dot(ctx, px, y + cellH / 2, 3.5, p.signal)
      line(ctx, px + 6, y + cellH / 2, left - 4, y + cellH / 2, p.signal, 1.5, 0.8)
    }
  })

  // The accumulator, updating as the loop runs.
  const boxW = Math.min(180, w * 0.3)
  const boxX = left + cellW + Math.max(40, w * 0.1)
  roundRect(ctx, boxX, top, boxW, 62, 10)
  ctx.strokeStyle = p.signal
  ctx.lineWidth = 1.5
  ctx.stroke()
  label(ctx, 'total', boxX + 14, top + 20, { size: 10, color: p.faint, mono: true })
  label(ctx, String(total), boxX + 14, top + 42, { size: 22, weight: 600, color: p.text })

  if (step < ITEMS.length) {
    label(ctx, `+ ${ITEMS[step]}`, boxX + boxW - 14, top + 42, {
      size: 13, weight: 600, align: 'right', color: p.signal, alpha: 0.4 + within * 0.6,
    })
  }

  label(ctx, 'for n in numbers:', boxX, top + 96, { size: 12, mono: true, color: p.mute })
  label(ctx, '    total = total + n', boxX, top + 116, { size: 12, mono: true, color: p.mute })

  if (step >= ITEMS.length) {
    label(ctx, `print(total)  # ${total}`, boxX, top + 146, { size: 12, mono: true, color: p.signal })
  }

  caption(ctx, 'Variables, loops and functions - doing the work, not described', w, h, p)
}
