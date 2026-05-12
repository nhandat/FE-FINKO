import { useRef, useEffect, useCallback } from 'react'
import { MULTIPLIERS, getMultiplierColor } from '../constants/game'
import type { RiskLevel } from '../types'

interface Props {
  rows: number
  risk: RiskLevel
  activeBucket: number | null
  ballPath: boolean[] | null
  onAnimationEnd: () => void
}

const PEG_RADIUS = 6
const BALL_RADIUS = 8
// Each row the ball falls faster (gravity)
const SEG_DURATIONS = [290, 250, 215, 185, 162, 144, 130, 118, 109, 102, 96, 91, 87, 84, 82, 80]
const BOUNCE_DUR = 340 // ms — how long a peg bounce animation lasts

interface WPt { x: number; y: number; cp: { x: number; y: number } }

export default function PlinkoBoard({ rows, risk, activeBucket, ballPath, onAnimationEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  // Ball + bucket state
  const ballRef = useRef({ x: -999, y: -999 })
  const activeBucketRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  // Per-peg bounce: key = "row,col", value = timestamp of hit
  const pegHitsRef = useRef<Map<string, number>>(new Map())

  /* ── layout ───────────────────────────────────────────────────── */
  const layout = useCallback(() => {
    const c = canvasRef.current
    if (!c) return null
    const W = c.width, H = c.height
    const ps = (W - 32) / (rows + 1)   // peg spacing
    const cx = W / 2
    const topY = 55
    const rowH = (H - topY - 75) / rows
    return { W, H, ps, cx, topY, rowH }
  }, [rows])

  const pegXY = useCallback((row: number, col: number) => {
    const l = layout()!
    return { x: l.cx + (col - row / 2) * l.ps, y: l.topY + row * l.rowH }
  }, [layout])

  const bucketX = useCallback((idx: number) => {
    const l = layout()!
    return l.cx + (idx - rows / 2) * l.ps
  }, [layout, rows])

  /* ── waypoints with bezier control points ─────────────────────── */
  const buildWaypoints = useCallback((path: boolean[]): WPt[] => {
    const l = layout()
    if (!l) return []
    const pts: WPt[] = []
    pts.push({ x: l.cx, y: l.topY - l.rowH * 0.85, cp: { x: l.cx, y: l.topY - l.rowH * 0.85 } })

    let col = 0
    for (let r = 0; r < rows; r++) {
      const p = pegXY(r, col)
      const right = path[r]
      // CP: shoot sideways past the peg shoulder before dropping to next
      const cpX = p.x + (right ? l.ps * 0.7 : -l.ps * 0.7)
      const cpY = p.y + l.rowH * 0.18
      pts.push({ x: p.x, y: p.y, cp: { x: cpX, y: cpY } })
      if (right) col++
    }

    const bx = bucketX(col)
    const last = pts[pts.length - 1]
    pts.push({ x: bx, y: l.H - 52, cp: { x: (last.x + bx) / 2, y: last.y + l.rowH * 0.35 } })
    return pts
  }, [layout, pegXY, bucketX, rows])

  /* ── draw one frame ───────────────────────────────────────────── */
  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const l = layout()
    if (!l) return
    const { W, H, ps } = l
    const mults = MULTIPLIERS[risk][rows] ?? []
    const buckets = rows + 1
    const ball = ballRef.current

    ctx.clearRect(0, 0, W, H)

    // ── Background ──
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#11062b')
    bg.addColorStop(1, '#07020f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Ambient glow
    const ag = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.65)
    ag.addColorStop(0, 'rgba(110,35,195,0.1)')
    ag.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = ag
    ctx.fillRect(0, 0, W, H)

    // ── Pegs as 3-D spheres ──
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= r; c++) {
        const p = pegXY(r, c)
        const hitTs = pegHitsRef.current.get(`${r},${c}`) ?? 0
        const elapsed = now - hitTs
        const t = hitTs > 0 ? Math.min(1, elapsed / BOUNCE_DUR) : 1

        // Spring: expand then spring back (single hump)
        const scale = t < 1 ? 1 + Math.sin(t * Math.PI) * 0.65 : 1
        const glowA = t < 1 ? Math.sin(t * Math.PI) : 0
        const r3 = PEG_RADIUS * scale

        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, r3, 0, Math.PI * 2)

        // 3-D radial gradient (top-left highlight)
        const gr = ctx.createRadialGradient(
          p.x - r3 * 0.32, p.y - r3 * 0.38, r3 * 0.06,
          p.x, p.y, r3,
        )
        if (glowA > 0.05) {
          gr.addColorStop(0, '#fffde0')
          gr.addColorStop(0.3, `rgba(255,210,60,${0.9})`)
          gr.addColorStop(0.7, `rgba(200,100,10,${0.75})`)
          gr.addColorStop(1, `rgba(80,20,0,0.6)`)
          ctx.shadowColor = `rgba(255,180,20,${glowA * 0.9})`
          ctx.shadowBlur = 22 * glowA
        } else {
          gr.addColorStop(0, '#ffffff')
          gr.addColorStop(0.28, 'rgba(220,195,255,0.95)')
          gr.addColorStop(0.65, 'rgba(130,80,205,0.75)')
          gr.addColorStop(1, 'rgba(45,12,85,0.55)')
          ctx.shadowColor = 'rgba(180,140,255,0.3)'
          ctx.shadowBlur = 5
        }
        ctx.fillStyle = gr
        ctx.fill()
        ctx.restore()
      }
    }

    // ── Buckets ──
    const bw = ps - 4, bh = 28, by = H - bh - 8
    for (let i = 0; i < buckets; i++) {
      const bx = bucketX(i) - bw / 2
      const mult = mults[i] ?? 0
      const color = getMultiplierColor(mult)
      const isActive = activeBucketRef.current === i

      ctx.save()
      ctx.beginPath()
      rrect(ctx, bx, by, bw, bh, 5)
      if (isActive) {
        ctx.shadowColor = color; ctx.shadowBlur = 24
        ctx.fillStyle = '#ffffff'
      } else {
        ctx.fillStyle = color + 'bb'; ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = isActive ? color : '#fff'
      ctx.font = `bold ${mult >= 100 ? 7 : 9}px Inter,sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(`${mult}x`, bx + bw / 2, by + bh / 2)
    }

    // ── Ball ──
    if (ball.x > -500) {
      // Soft trail
      ctx.save()
      ctx.beginPath()
      ctx.arc(ball.x, ball.y - 5, BALL_RADIUS * 0.65, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,140,0,0.15)'
      ctx.filter = 'blur(5px)'
      ctx.fill()
      ctx.filter = 'none'
      ctx.restore()

      // Ball sphere
      ctx.save()
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      const bg2 = ctx.createRadialGradient(
        ball.x - 2.5, ball.y - 2.8, 0.8,
        ball.x, ball.y, BALL_RADIUS,
      )
      bg2.addColorStop(0, '#FFF5AA')
      bg2.addColorStop(0.45, '#FF9900')
      bg2.addColorStop(1, '#AA3300')
      ctx.fillStyle = bg2
      ctx.shadowColor = '#FF9900'; ctx.shadowBlur = 18
      ctx.fill()
      ctx.restore()
    }
  }, [layout, pegXY, bucketX, risk, rows])

  /* ── animation loop ───────────────────────────────────────────── */
  useEffect(() => {
    if (!ballPath) {
      ballRef.current = { x: -999, y: -999 }
      activeBucketRef.current = activeBucket
      pegHitsRef.current.clear()
      draw(performance.now())
      return
    }

    const waypoints = buildWaypoints(ballPath)
    isAnimatingRef.current = true
    activeBucketRef.current = null
    pegHitsRef.current.clear()
    ballRef.current = { x: waypoints[0].x, y: waypoints[0].y }

    const segs = waypoints.length - 1
    const durations = Array.from({ length: segs }, (_, i) =>
      SEG_DURATIONS[Math.min(i, SEG_DURATIONS.length - 1)],
    )
    const totalDur = durations.reduce((a, b) => a + b, 0)
    const cumulative = durations.reduce<number[]>((acc, d, i) => {
      acc.push((acc[i - 1] ?? 0) + d); return acc
    }, [])

    // Which segment index triggered a peg hit (avoid double-recording)
    let lastHitSeg = -1

    let startTs = 0
    const tick = (ts: number) => {
      if (!startTs) startTs = ts
      const elapsed = ts - startTs

      if (elapsed >= totalDur) {
        const last = waypoints[waypoints.length - 1]
        ballRef.current = { x: last.x, y: last.y }
        activeBucketRef.current = ballPath.filter(Boolean).length
        isAnimatingRef.current = false
        draw(ts)
        onAnimationEnd()
        return
      }

      // Current segment
      const segIdx = cumulative.findIndex((c) => elapsed < c)
      const segStart = segIdx === 0 ? 0 : (cumulative[segIdx - 1] ?? 0)
      const rawT = (elapsed - segStart) / durations[segIdx]

      // Record peg hit once per segment (at very start of segment)
      if (segIdx > 0 && segIdx <= rows && segIdx !== lastHitSeg && rawT < 0.15) {
        // Find which peg this waypoint corresponds to (row = segIdx-1)
        const hitRow = segIdx - 1
        let hitCol = 0
        for (let i = 0; i < hitRow; i++) if (ballPath[i]) hitCol++
        pegHitsRef.current.set(`${hitRow},${hitCol}`, ts)
        lastHitSeg = segIdx
      }

      // Ease-in (gravity)
      const t = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2
      const from = waypoints[segIdx], to = waypoints[segIdx + 1], cp = from.cp
      const mt = 1 - t
      ballRef.current = {
        x: mt * mt * from.x + 2 * mt * t * cp.x + t * t * to.x,
        y: mt * mt * from.y + 2 * mt * t * cp.y + t * t * to.y,
      }

      draw(ts)
      rafRef.current = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ballPath, activeBucket, buildWaypoints, draw, onAnimationEnd, rows])

  // Static redraw when settings change
  useEffect(() => {
    if (!isAnimatingRef.current) {
      activeBucketRef.current = activeBucket
      draw(performance.now())
    }
  }, [risk, rows, activeBucket, draw])

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={430}
      className="w-full rounded-xl"
      style={{ maxWidth: 340 }}
    />
  )
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
