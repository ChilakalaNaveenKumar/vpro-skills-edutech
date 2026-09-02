import { caption, clamp, dot, halo, label, line, roundRect } from './draw'
import type { DrawFn } from './types'

const AGENTS = ['Planner', 'Researcher', 'Writer', 'Reviewer']
// Planner -> Researcher -> (tool) -> Writer -> Reviewer -> Planner
const HOPS: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 0]]
const CYCLE = 12
const HOP = 2.4

// Agentic AI: a task handed between agents, one of them reaching out to a tool.
// Delegation and tool use are what separate an agent from a chat completion.
export const drawAgentic: DrawFn = ({ ctx, w, h, t, p }) => {
  const cycle = t % CYCLE
  const cx = w / 2
  const cy = (h - 30) / 2 + 10
  const radius = Math.min(w, h - 90) * 0.31

  const nodeAt = (i: number) => {
    const angle = -Math.PI / 2 + (i / AGENTS.length) * Math.PI * 2
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  }

  // Idle ring.
  HOPS.forEach(([from, to]) => {
    const a = nodeAt(from)
    const b = nodeAt(to)
    line(ctx, a.x, a.y, b.x, b.y, p.rule, 1, 0.4)
  })

  const hopIndex = Math.min(HOPS.length - 1, Math.floor(cycle / HOP))
  const local = clamp((cycle - hopIndex * HOP) / HOP)
  const [from, to] = HOPS[hopIndex]

  // Active edge and the task packet travelling along it.
  const a = nodeAt(from)
  const b = nodeAt(to)
  line(ctx, a.x, a.y, b.x, b.y, p.signal, 1.6, 0.55)
  const travel = clamp((local - 0.35) / 0.5)
  if (travel > 0 && travel < 1) {
    const tx = a.x + (b.x - a.x) * travel
    const ty = a.y + (b.y - a.y) * travel
    halo(ctx, tx, ty, 14, p.signal, 0.6)
    dot(ctx, tx, ty, 4, p.signal)
  }

  // The Researcher calls an external tool mid-hop.
  if (from === 1 || to === 1) {
    const tool = { x: cx + radius * 1.62, y: cy - radius * 0.1 }
    const r = nodeAt(1)
    const out = clamp((local - 0.1) / 0.3)
    line(ctx, r.x, r.y, r.x + (tool.x - r.x) * out, r.y + (tool.y - r.y) * out, p.signal, 1.2, 0.5)
    roundRect(ctx, tool.x - 34, tool.y - 15, 68, 30, 8)
    ctx.strokeStyle = out > 0.9 ? p.signal : p.rule
    ctx.lineWidth = 1.2
    ctx.stroke()
    label(ctx, 'tool', tool.x, tool.y, { size: 10, align: 'center', color: out > 0.9 ? p.signal : p.faint })
  }

  AGENTS.forEach((name, i) => {
    const { x, y } = nodeAt(i)
    const working = i === from && local < 0.4
    const holds = i === to && local > 0.85
    const active = working || holds
    if (active) halo(ctx, x, y, 34, p.signal, 0.4)
    roundRect(ctx, x - 46, y - 17, 92, 34, 10)
    ctx.fillStyle = active ? p.signal : p.surfaceAlt
    ctx.fill()
    if (!active) {
      ctx.strokeStyle = p.rule
      ctx.lineWidth = 1
      ctx.stroke()
    }
    label(ctx, name, x, y, { size: 11, weight: 600, align: 'center', color: active ? p.surface : p.text })
    if (working) {
      // Three dots: this agent is thinking.
      for (let d = 0; d < 3; d += 1) {
        const bounce = Math.sin(t * 6 - d * 0.7) * 0.5 + 0.5
        dot(ctx, x - 8 + d * 8, y + 26, 1.8, p.signal, 0.3 + bounce * 0.7)
      }
    }
  })

  label(ctx, 'a task, delegated', w * 0.08, 30, { size: 12, weight: 600, color: p.text })
  caption(ctx, 'CrewAI, AutoGen and multi-agent systems that hand work along', w, h, p)
}
