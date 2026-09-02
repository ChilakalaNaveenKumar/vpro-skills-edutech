import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseByName } from '../content/courses'
import { minutesOfDay, nowInIst, type ScheduleRow } from '../utils/schedule'

// The real teaching week, as an interactive 3D calendar.
//
// Every block is an actual batch from the schedule, placed on the day and at the
// hour it really runs. The block teaching at this moment glows. Hovering names
// it; clicking opens its course. Nothing here is decorative filler - if the
// schedule is empty, the grid is empty, and it says so.
//
// Drawn with Canvas 2D and an explicit projection rather than WebGL, because
// blocks need hit-testing for hover and click, which is far simpler against
// projected polygons than against a depth buffer.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_W = 1.32
const HOUR_D = 0.62


interface Vec3 {
  x: number
  y: number
  z: number
}

interface Projected {
  sx: number
  sy: number
  depth: number
  scale: number
}

interface Block {
  /** 0 = Monday. */
  day: number
  startHour: number
  endHour: number
  row: ScheduleRow
  live: boolean
  /** Set while this block is under the pointer. */
  poly?: Array<[number, number]>
}

interface Camera {
  yaw: number
  pitch: number
  dist: number
}

function project(p: Vec3, cam: Camera, cx: number, cy: number, focal: number): Projected {
  const cosY = Math.cos(cam.yaw)
  const sinY = Math.sin(cam.yaw)
  const x1 = p.x * cosY - p.z * sinY
  const z1 = p.x * sinY + p.z * cosY

  const cosX = Math.cos(cam.pitch)
  const sinX = Math.sin(cam.pitch)
  const y2 = p.y * cosX - z1 * sinX
  const z2 = p.y * sinX + z1 * cosX

  const zc = z2 + cam.dist
  const safe = Math.max(0.35, zc)
  const scale = focal / safe
  return { sx: cx + x1 * scale, sy: cy - y2 * scale, depth: safe, scale }
}

function inPolygon(x: number, y: number, poly: Array<[number, number]>): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Monday of the current IST week, at midnight. */
function weekStart(): Date {
  const { date } = nowInIst()
  const day = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - day)
  return monday
}

function buildBlocks(rows: ScheduleRow[]): Block[] {
  const monday = weekStart()
  const blocks: Block[] = []

  for (const row of rows) {
    const from = minutesOfDay(row.batch.start_time)
    const to = minutesOfDay(row.batch.end_time)
    if (from === null || to === null || to <= from) continue

    const runStart = new Date(`${row.batch.start_date}T00:00:00`)
    const runEnd = new Date(`${row.batch.end_date}T00:00:00`)
    if (Number.isNaN(runStart.getTime()) || Number.isNaN(runEnd.getTime())) continue

    // The data carries a date range and a daily time, not weekdays - so a batch
    // occupies its slot on each day of this week that falls inside its run.
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + day)
      if (date < runStart || date > runEnd) continue
      const { date: today } = nowInIst()
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      blocks.push({
        day,
        startHour: from / 60,
        endHour: to / 60,
        row,
        live: row.state === 'live' && isToday,
      })
    }
  }
  return blocks
}

interface Props {
  rows: ScheduleRow[] | null
  failed: boolean
}

export default function WeekCalendar3D({ rows, failed }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<Block | null>(null)

  const blocks = useMemo(() => (rows ? buildBlocks(rows) : []), [rows])

  const hours = useMemo(() => {
    if (!blocks.length) return { from: 8, to: 21 }
    const from = Math.max(0, Math.floor(Math.min(...blocks.map((b) => b.startHour)) - 1))
    const to = Math.min(24, Math.ceil(Math.max(...blocks.map((b) => b.endHour)) + 1))
    return { from, to: Math.max(to, from + 6) }
  }, [blocks])

  const blocksRef = useRef(blocks)
  const hoursRef = useRef(hours)
  const hoveredRef = useRef<Block | null>(null)

  useEffect(() => {
    blocksRef.current = blocks
    hoursRef.current = hours
  }, [blocks, hours])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    let reduce = motion.matches
    let width = 0
    let height = 0
    let frame = 0
    let onScreen = true
    let start = 0

    let scrollTarget = 0
    let scroll = 0
    const aimTarget = { x: 0, y: 0 }
    const aim = { x: 0, y: 0 }
    const mouse = { x: -1, y: -1, inside: false }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, reduce ? 1 : 2)
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const readScroll = () => {
      const rect = host.getBoundingClientRect()
      scrollTarget = Math.min(1, Math.max(0, -rect.top / Math.max(1, window.innerHeight)))
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = event.clientX - rect.left
      mouse.y = event.clientY - rect.top
      mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= rect.width && mouse.y <= rect.height
      if (event.pointerType === 'mouse' && fine.matches) {
        aimTarget.x = (event.clientX / window.innerWidth) * 2 - 1
        aimTarget.y = (event.clientY / window.innerHeight) * 2 - 1
      }
    }

    const onLeave = () => {
      mouse.inside = false
      hoveredRef.current = null
      setHovered(null)
    }

    const onClick = () => {
      const target = hoveredRef.current
      if (!target) return
      const slug = courseByName(target.row.batch.course_name)?.slug
      if (slug) navigate(`/courses/${slug}`)
    }

    const paint = (t: number) => {
      const list = blocksRef.current
      const { from: hourFrom, to: hourTo } = hoursRef.current
      const span = hourTo - hourFrom

      const cam: Camera = {
        yaw: (reduce ? -0.52 : -0.52 + aim.x * 0.14 + Math.sin(t * 0.09) * 0.03),
        pitch: (reduce ? 0.92 : 0.92 - aim.y * 0.07 - scroll * 0.22),
        dist: (reduce ? 12.4 : 12.4 - scroll * 2.6),
      }
      // On wide viewports the copy owns the left half, so the calendar sits right.
      const halfDaysFit = (DAYS.length * DAY_W) / 2
      const spanFit = hourTo - hourFrom
      const zFrom = -(spanFit * HOUR_D) / 2
      const zTo = (spanFit * HOUR_D) / 2

      // Project the scene's corners at focal 1, then choose the focal length and
      // centre that fit those bounds inside this container with a small margin.
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
      for (const cornerX of [-halfDaysFit, halfDaysFit]) {
        for (const cornerZ of [zFrom - 0.6, zTo]) {
          for (const cornerY of [0, 0.45]) {
            const unit = project({ x: cornerX, y: cornerY, z: cornerZ }, cam, 0, 0, 1)
            minU = Math.min(minU, unit.sx)
            maxU = Math.max(maxU, unit.sx)
            minV = Math.min(minV, unit.sy)
            maxV = Math.max(maxV, unit.sy)
          }
        }
      }
      const spreadU = Math.max(0.001, maxU - minU)
      const spreadV = Math.max(0.001, maxV - minV)
      // Leave room on the left for the hour labels drawn outside the grid.
      const focal = Math.min((width * 0.82) / spreadU, (height * 0.84) / spreadV)
      const cx = width / 2 - focal * ((minU + maxU) / 2) + width * 0.05
      const cy = height / 2 - focal * ((minV + maxV) / 2)

      ctx.clearRect(0, 0, width, height)

      const halfDays = (DAYS.length * DAY_W) / 2
      const zOf = (hour: number) => (hour - hourFrom) * HOUR_D - (span * HOUR_D) / 2
      const xOf = (day: number) => day * DAY_W - halfDays + DAY_W / 2

      const p = (x: number, y: number, z: number) => project({ x, y, z }, cam, cx, cy, focal)

      // Grid: hour rings and day rails on the floor plane.
      for (let hour = hourFrom; hour <= hourTo; hour += 1) {
        const a = p(-halfDays, 0, zOf(hour))
        const b = p(halfDays, 0, zOf(hour))
        const major = hour % 3 === 0
        ctx.strokeStyle = major ? 'rgba(255,236,214,0.16)' : 'rgba(255,236,214,0.07)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
        if (major) {
          ctx.font = '500 10px "Poppins", ui-sans-serif, system-ui, sans-serif'
          ctx.fillStyle = 'rgba(255,236,214,0.34)'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${String(hour).padStart(2, '0')}:00`, a.sx - 10, a.sy)
        }
      }

      for (let day = 0; day <= DAYS.length; day += 1) {
        const x = day * DAY_W - halfDays
        const a = p(x, 0, zOf(hourFrom))
        const b = p(x, 0, zOf(hourTo))
        ctx.strokeStyle = 'rgba(255,236,214,0.09)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.sx, a.sy)
        ctx.lineTo(b.sx, b.sy)
        ctx.stroke()
      }

      // Day names along the near edge.
      const { date: todayIst } = nowInIst()
      const todayIndex = (todayIst.getDay() + 6) % 7
      DAYS.forEach((name, day) => {
        const a = p(xOf(day), 0, zOf(hourFrom) - 0.45)
        ctx.font = `${day === todayIndex ? 700 : 500} 11px "Poppins", ui-sans-serif, system-ui, sans-serif`
        ctx.fillStyle = day === todayIndex ? 'rgba(255,150,54,0.95)' : 'rgba(255,236,214,0.4)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(name.toUpperCase(), a.sx, a.sy)
      })

      // Blocks, far to near so nearer ones overlap correctly.
      let hoveredNow: Block | null = null
      const drawable = list
        .map((block) => {
          const top = p(xOf(block.day), 0.001, (zOf(block.startHour) + zOf(block.endHour)) / 2)
          return { block, depth: top.depth }
        })
        .sort((a, b) => b.depth - a.depth)

      for (const { block } of drawable) {
        const x0 = block.day * DAY_W - halfDays + 0.1
        const x1 = x0 + DAY_W - 0.2
        const z0 = zOf(block.startHour)
        const z1 = zOf(block.endHour)
        const lift = block.live ? 0.4 + Math.sin(t * 2.1) * 0.03 : 0.2

        const corners = {
          t00: p(x0, lift, z0), t10: p(x1, lift, z0), t11: p(x1, lift, z1), t01: p(x0, lift, z1),
          b00: p(x0, 0, z0), b10: p(x1, 0, z0), b11: p(x1, 0, z1), b01: p(x0, 0, z1),
        }

        const topPoly: Array<[number, number]> = [
          [corners.t00.sx, corners.t00.sy],
          [corners.t10.sx, corners.t10.sy],
          [corners.t11.sx, corners.t11.sy],
          [corners.t01.sx, corners.t01.sy],
        ]
        block.poly = topPoly

        const isHover = mouse.inside && inPolygon(mouse.x, mouse.y, topPoly)
        if (isHover) hoveredNow = block

        const fill = (poly: Array<[number, number]>, style: string) => {
          ctx.fillStyle = style
          ctx.beginPath()
          ctx.moveTo(poly[0][0], poly[0][1])
          for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i][0], poly[i][1])
          ctx.closePath()
          ctx.fill()
        }

        // Extruded sides, shaded so the box reads as a solid.
        fill(
          [
            [corners.t01.sx, corners.t01.sy], [corners.t11.sx, corners.t11.sy],
            [corners.b11.sx, corners.b11.sy], [corners.b01.sx, corners.b01.sy],
          ],
          block.live ? 'rgba(150,64,10,0.95)' : 'rgba(48,40,34,0.9)',
        )
        fill(
          [
            [corners.t11.sx, corners.t11.sy], [corners.t10.sx, corners.t10.sy],
            [corners.b10.sx, corners.b10.sy], [corners.b11.sx, corners.b11.sy],
          ],
          block.live ? 'rgba(112,46,6,0.95)' : 'rgba(34,29,25,0.9)',
        )

        if (block.live) {
          const glow = ctx.createRadialGradient(
            corners.t00.sx, corners.t00.sy, 0, corners.t00.sx, corners.t00.sy, 120,
          )
          glow.addColorStop(0, 'rgba(255,150,54,0.30)')
          glow.addColorStop(1, 'rgba(255,150,54,0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(corners.t00.sx, corners.t00.sy, 120, 0, Math.PI * 2)
          ctx.fill()
        }

        fill(
          topPoly,
          block.live
            ? 'rgba(255,150,54,0.96)'
            : isHover
              ? 'rgba(255,236,214,0.34)'
              : 'rgba(255,236,214,0.16)',
        )

        ctx.strokeStyle = block.live ? 'rgba(255,214,160,0.9)' : 'rgba(255,236,214,0.26)'
        ctx.lineWidth = isHover || block.live ? 1.4 : 0.8
        ctx.beginPath()
        ctx.moveTo(topPoly[0][0], topPoly[0][1])
        for (let i = 1; i < topPoly.length; i += 1) ctx.lineTo(topPoly[i][0], topPoly[i][1])
        ctx.closePath()
        ctx.stroke()
      }

      if (hoveredNow !== hoveredRef.current) {
        hoveredRef.current = hoveredNow
        setHovered(hoveredNow)
      }
      canvas.style.cursor = hoveredNow ? 'pointer' : 'default'
    }

    const render = (now: number) => {
      if (!start) start = now
      const t = (now - start) / 1000
      scroll += (scrollTarget - scroll) * (reduce ? 1 : 0.08)
      aim.x += (aimTarget.x - aim.x) * (reduce ? 1 : 0.06)
      aim.y += (aimTarget.y - aim.y) * (reduce ? 1 : 0.06)
      paint(reduce ? 3 : t)
      frame = onScreen && !document.hidden ? requestAnimationFrame(render) : 0
    }

    const run = () => {
      if (reduce) {
        paint(3)
        return
      }
      if (onScreen && !document.hidden && !frame) frame = requestAnimationFrame(render)
    }
    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (reduce || !frame) run()
    })
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
      if (onScreen) run()
      else stop()
    })
    const onVisibility = () => (document.hidden ? stop() : run())
    const onMotion = () => {
      reduce = motion.matches
      resize()
      run()
    }

    resize()
    readScroll()
    paint(reduce ? 3 : 0)
    resizeObserver.observe(host)
    intersection.observe(host)
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('click', onClick)
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotion)
    run()

    return () => {
      stop()
      resizeObserver.disconnect()
      intersection.disconnect()
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
    }
  }, [navigate])

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden bg-[color:var(--ink)]">
      <canvas ref={canvasRef} className="block" aria-hidden="true" />

      {hovered && (
        <div className="pointer-events-none absolute bottom-6 right-6 max-w-xs rounded-xl border border-[color:var(--rule)] bg-[color:var(--ink-2)]/95 p-4 backdrop-blur">
          <p className="text-[0.9rem] font-medium text-[color:var(--on-ink)]">
            {hovered.row.batch.course_name}
          </p>
          <p className="tnum mt-1 text-[0.76rem] text-[color:var(--on-ink-mute)]">
            {DAYS[hovered.day]} &middot; {hovered.row.batch.start_time.slice(0, 5)}&ndash;
            {hovered.row.batch.end_time.slice(0, 5)} IST
          </p>
          <p className="mt-1 text-[0.72rem] text-[color:var(--on-ink-faint)]">
            {hovered.row.batch.trainer_name}
            {hovered.live ? ' - teaching now' : ''}
          </p>
        </div>
      )}

      {/* Truthful empty and error states: no invented week. */}
      {rows !== null && blocks.length === 0 && (
        <p className="absolute bottom-6 left-6 text-[0.78rem] text-[color:var(--on-ink-faint)]">
          No batches scheduled this week
        </p>
      )}
      {failed && (
        <p className="absolute bottom-6 left-6 text-[0.78rem] text-[color:var(--on-ink-faint)]">
          Schedule unavailable right now
        </p>
      )}
    </div>
  )
}
