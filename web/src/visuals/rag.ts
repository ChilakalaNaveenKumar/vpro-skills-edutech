import { caption, clamp, dot, halo, label, line, phase, roundRect, seeded } from './draw'
import type { DrawFn } from './types'

const CHUNKS = 7
const CYCLE = 13

const cloud = (() => {
  const rand = seeded(4242)
  return Array.from({ length: 26 }, () => ({ x: rand(), y: rand() }))
})()

// RAG + MCP: a document chunked, embedded into a vector space, then the nearest
// chunks to a query retrieved by distance. Cosine similarity made physical.
export const drawRag: DrawFn = ({ ctx, w, h, t, p }) => {
  const cycle = t % CYCLE
  const padX = w * 0.07
  const docW = Math.min(120, w * 0.19)
  const docX = padX
  const docTop = 66
  const docH = h - docTop - 62

  const spaceX = docX + docW + Math.max(48, w * 0.09)
  const spaceW = w - spaceX - padX
  const spaceH = docH

  const chunked = phase(cycle, 0.3, 1.2)
  const embedded = phase(cycle, 1.8, 1.8)
  const queried = phase(cycle, 4.2, 1)
  const answered = phase(cycle, 6.4, 1.2)

  label(ctx, 'document', docX, 34, { size: 11, weight: 600, color: p.text })
  label(ctx, 'vector space', spaceX, 34, { size: 11, weight: 600, color: p.text })

  // The document splitting into chunks.
  const chunkH = (docH - (CHUNKS - 1) * 5) / CHUNKS
  const chunkPositions: Array<{ x: number; y: number }> = []
  for (let i = 0; i < CHUNKS; i += 1) {
    const spread = chunked * 5
    const y = docTop + i * (chunkH + spread * 0.9)
    roundRect(ctx, docX, y, docW, chunkH, 4)
    ctx.fillStyle = p.surfaceAlt
    ctx.globalAlpha = 0.5 + chunked * 0.5
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = p.rule
    ctx.lineWidth = 1
    ctx.stroke()
    for (let l = 0; l < 2; l += 1) {
      line(ctx, docX + 8, y + chunkH * (0.35 + l * 0.3), docX + docW - (l ? 22 : 8), y + chunkH * (0.35 + l * 0.3), p.faint, 1, 0.35)
    }
    chunkPositions.push({ x: docX + docW, y: y + chunkH / 2 })
  }

  // Space frame.
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = p.rule
  ctx.setLineDash([3, 5])
  ctx.strokeRect(spaceX, docTop, spaceW, spaceH)
  ctx.restore()

  const sx = (x: number) => spaceX + 18 + x * (spaceW - 36)
  const sy = (y: number) => docTop + 18 + y * (spaceH - 36)

  // Background corpus.
  cloud.forEach((c) => dot(ctx, sx(c.x), sy(c.y), 2, p.faint, 0.3 * embedded))

  // The seven chunks become seven points, flying from the document.
  const targets = [
    { x: 0.62, y: 0.3 }, { x: 0.7, y: 0.42 }, { x: 0.56, y: 0.48 },
    { x: 0.22, y: 0.68 }, { x: 0.36, y: 0.2 }, { x: 0.84, y: 0.72 }, { x: 0.14, y: 0.36 },
  ]
  const query = { x: 0.63, y: 0.4 }
  const nearest = [0, 1, 2]

  targets.forEach((target, i) => {
    const fly = clamp((embedded - i * 0.06) / 0.7)
    const from = chunkPositions[i]
    const x = from.x + (sx(target.x) - from.x) * fly
    const y = from.y + (sy(target.y) - from.y) * fly
    const hit = nearest.includes(i) && queried > 0.4
    if (fly > 0.02) {
      if (hit) halo(ctx, x, y, 13, p.signal, 0.55 * queried)
      dot(ctx, x, y, hit ? 4 : 3, hit ? p.signal : p.text, fly * (hit ? 1 : 0.75))
    }
  })

  // The query vector lands, and distance decides what comes back.
  if (queried > 0.02) {
    const qx = sx(query.x)
    const qy = sy(query.y)
    nearest.forEach((i) => {
      const target = targets[i]
      const reach = clamp((queried - 0.2) / 0.8)
      line(ctx, qx, qy, qx + (sx(target.x) - qx) * reach, qy + (sy(target.y) - qy) * reach, p.signal, 1, 0.45)
    })
    ctx.save()
    ctx.globalAlpha = queried
    ctx.strokeStyle = p.signal
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(qx, qy, 7, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    label(ctx, 'query', qx + 12, qy - 12, { size: 10, mono: true, color: p.signal, alpha: queried })
  }

  if (answered > 0.02) {
    const barY = h - 44
    label(ctx, 'answer, grounded in 3 retrieved chunks', spaceX, barY, {
      size: 11, color: p.signal, alpha: answered,
    })
  }

  caption(ctx, 'Vector databases, retrieval and MCP tool access for enterprise AI', w, h, p)
}
