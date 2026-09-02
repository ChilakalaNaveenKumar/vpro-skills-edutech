import { caption, clamp, label, roundRect } from './draw'
import type { DrawFn } from './types'

const PROMPT = ['Write', ' a', ' product', ' description', ' for']
const OUTPUT = ['a', 'noise', '-', 'cancel', 'ling', ' head', 'phone']
const CANDIDATES = [
  ['head', 0.71], ['ear', 0.18], ['speak', 0.07],
] as const
const CYCLE = 11

// Generative AI: text becomes tokens, then the model emits one token at a time
// with a probability over what comes next. The actual mechanism of an LLM.
export const drawGenai: DrawFn = ({ ctx, w, h, t, p }) => {
  const cycle = t % CYCLE
  const padX = w * 0.08
  let x = padX
  const promptY = 74

  label(ctx, 'prompt, split into tokens', padX, 34, { size: 12, weight: 600, color: p.text })

  ctx.font = '500 13px "Poppins", ui-sans-serif, system-ui, sans-serif'
  PROMPT.forEach((token, i) => {
    const tw = ctx.measureText(token.trim()).width + 20
    const appear = clamp((cycle - i * 0.16) / 0.34)
    ctx.save()
    ctx.globalAlpha = appear
    roundRect(ctx, x, promptY - 15, tw, 30, 6)
    ctx.fillStyle = p.surfaceAlt
    ctx.fill()
    ctx.strokeStyle = p.rule
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
    label(ctx, token.trim(), x + tw / 2, promptY, { size: 12, align: 'center', color: p.mute, alpha: appear })
    x += tw + 6
    if (x > w - padX - 90) { x = padX; }
  })

  // Autoregressive generation: one token per beat.
  const genStart = 1.5
  const perToken = 0.72
  const emitted = clamp((cycle - genStart) / perToken, 0, OUTPUT.length)
  const outY = promptY + 78

  label(ctx, 'generated, one token at a time', padX, outY - 40, { size: 12, weight: 600, color: p.text })

  x = padX
  OUTPUT.forEach((token, i) => {
    if (i >= Math.floor(emitted) + 1) return
    const local = clamp(emitted - i)
    const tw = ctx.measureText(token).width + 18
    ctx.save()
    ctx.globalAlpha = local
    roundRect(ctx, x, outY - 15, tw, 30, 6)
    ctx.fillStyle = i === Math.floor(emitted) ? p.signal : p.surfaceAlt
    ctx.fill()
    if (i !== Math.floor(emitted)) {
      ctx.strokeStyle = p.rule
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.restore()
    label(ctx, token, x + tw / 2, outY, {
      size: 12, align: 'center', color: i === Math.floor(emitted) ? p.surface : p.text, alpha: local,
    })
    x += tw + 5
  })

  // The distribution over the next token, while it is being chosen.
  const showDist = emitted > 3.1 && emitted < 4.9
  if (showDist) {
    const baseY = outY + 62
    label(ctx, 'next token', padX, baseY - 18, { size: 10, color: p.faint })
    CANDIDATES.forEach(([token, prob], i) => {
      const y = baseY + i * 24
      const barW = (w - padX * 2 - 120) * prob
      roundRect(ctx, padX + 92, y - 7, barW, 14, 4)
      ctx.fillStyle = i === 0 ? p.signal : p.rule
      ctx.fill()
      label(ctx, token, padX + 84, y, { size: 11, mono: true, align: 'right', color: i === 0 ? p.text : p.faint })
      label(ctx, prob.toFixed(2), padX + 100 + barW, y, { size: 10, mono: true, color: p.faint })
    })
  }

  caption(ctx, 'LLMs, prompt engineering, LangChain and fine tuning', w, h, p)
}
