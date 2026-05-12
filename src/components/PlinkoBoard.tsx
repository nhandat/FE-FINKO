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

const PEG_RADIUS = 5
const BALL_RADIUS = 8

// Segment durations simulate gravity (each row faster)
const SEG_DURATIONS = [300, 260, 225, 195, 170, 152, 138, 126, 116, 108, 102, 97, 93, 90, 88, 86]

interface Peg { x: number; y: number }
interface Waypoint { x: number; y: number; cp: { x: number; y: number } }

export default function PlinkoBoard({ rows, risk, activeBucket, ballPath, onAnimationEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef({
    ballX: -999,
    ballY: -999,
    activeBucket: null as number | null,
    flashPeg: null as Peg | null,
    flashAlpha: 0,
    isAnimating: false,
  })

  /* ── layout helpers ───────────────────────────────────────────── */
  const getLayout = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const W = canvas.width
    const H = canvas.height
    const pegSpacing = (W - 32) / (rows + 1)
    const cx = W / 2
    const topY = 55
    const rowH = (H - topY - 72) / rows
    return { W, H, pegSpacing, cx, topY, rowH }
  }, [rows])

  const getPeg = useCallback((row: number, col: number): Peg => {
    const l = getLayout()!
    return {
      x: l.cx + (col - row / 2) * l.pegSpacing,
      y: l.topY + row * l.rowH,
    }
  }, [getLayout])

  const getBucketX = useCallback((idx: number): number => {
    const l = getLayout()!
    return l.cx + (idx - rows / 2) * l.pegSpacing
  }, [getLayout, rows])

  /* ── build bezier waypoints ───────────────────────────────────── */
  const buildWaypoints = useCallback((path: boolean[]): Waypoint[] => {
    const l = getLayout()
    if (!l) return []
    const pts: Waypoint[] = []
    const startX = l.cx
    const startY = l.topY - l.rowH * 0.9

    // entry point (above first peg)
    pts.push({ x: startX, y: startY, cp: { x: startX, y: startY } })

    let col = 0
    for (let r = 0; r < rows; r++) {
      const peg = getPeg(r, col)
      const goRight = path[r]
      // control point: ball rolls off the peg to one side before falling
      const cpX = peg.x + (goRight ? l.pegSpacing * 0.55 : -l.pegSpacing * 0.55)
      const cpY = peg.y + l.rowH * 0.25
      pts.push({ x: peg.x, y: peg.y, cp: { x: cpX, y: cpY } })
      if (goRight) col++
    }

    // bucket entry
    const bx = getBucketX(col)
    const last = pts[pts.length - 1]
    pts.push({ x: bx, y: l.H - 50, cp: { x: (last.x + bx) / 2, y: last.y + l.rowH * 0.4 } })

    return pts
  }, [getLayout, getPeg, getBucketX, rows])

  /* ── draw ─────────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const l = getLayout()
    if (!l) return
    const { W, H, pegSpacing } = l
    const s = stateRef.current
    const mults = MULTIPLIERS[risk][rows] ?? []
    const buckets = rows + 1

    ctx.clearRect(0, 0, W, H)

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#12062a')
    bg.addColorStop(1, '#080212')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle board glow in center
    const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.6)
    glow.addColorStop(0, 'rgba(120,40,200,0.08)')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // ── Draw pegs ──
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= r; c++) {
        const p = getPeg(r, c)
        const isFlash = s.flashPeg && Math.abs(s.flashPeg.x - p.x) < 1 && Math.abs(s.flashPeg.y - p.y) < 1

        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, PEG_RADIUS, 0, Math.PI * 2)

        if (isFlash && s.flashAlpha > 0) {
          const fc = `rgba(255,220,80,${s.flashAlpha})`
          ctx.shadowColor = fc
          ctx.shadowBlur = 18
          ctx.fillStyle = `rgba(255,255,200,${0.6 + s.flashAlpha * 0.4})`
        } else {
          ctx.shadowColor = 'rgba(200,160,255,0.35)'
          ctx.shadowBlur = 6
          ctx.fillStyle = 'rgba(255,255,255,0.82)'
        }
        ctx.fill()
        ctx.restore()
      }
    }

    // ── Draw buckets ──
    const bw = pegSpacing - 4
    const bh = 28
    const by = H - bh - 8
    for (let i = 0; i < buckets; i++) {
      const bx = getBucketX(i) - bw / 2
      const mult = mults[i] ?? 0
      const color = getMultiplierColor(mult)
      const isActive = s.activeBucket === i

      ctx.save()
      ctx.beginPath()
      rrect(ctx, bx, by, bw, bh, 5)

      if (isActive) {
        ctx.shadowColor = color
        ctx.shadowBlur = 22
        ctx.fillStyle = '#ffffff'
      } else {
        ctx.fillStyle = color + 'bb'
        ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = isActive ? color : '#fff'
      ctx.font = `bold ${mult >= 100 ? 7.5 : 9}px Inter,sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${mult}x`, bx + bw / 2, by + bh / 2)
    }

    // ── Draw ball ──
    if (s.ballX > -500) {
      // Trail shadow
      ctx.save()
      ctx.beginPath()
      ctx.arc(s.ballX, s.ballY - 4, BALL_RADIUS * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,150,0,0.18)'
      ctx.filter = 'blur(4px)'
      ctx.fill()
      ctx.filter = 'none'
      ctx.restore()

      // Ball
      ctx.save()
      ctx.beginPath()
      ctx.arc(s.ballX, s.ballY, BALL_RADIUS, 0, Math.PI * 2)
      const gr = ctx.createRadialGradient(
        s.ballX - 2.5, s.ballY - 2.5, 1,
        s.ballX, s.ballY, BALL_RADIUS,
      )
      gr.addColorStop(0, '#FFEE99')
      gr.addColorStop(0.55, '#FF9900')
      gr.addColorStop(1, '#BB4400')
      ctx.fillStyle = gr
      ctx.shadowColor = '#FF9900'
      ctx.shadowBlur = 16
      ctx.fill()
      ctx.restore()
    }
  }, [getLayout, getPeg, getBucketX, risk, rows])

  /* ── animate ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!ballPath) {
      // Static board
      stateRef.current.ballX = -999
      stateRef.current.activeBucket = activeBucket
      draw()
      return
    }

    const waypoints = buildWaypoints(ballPath)
    const s = stateRef.current
    s.isAnimating = true
    s.activeBucket = null
    s.ballX = waypoints[0].x
    s.ballY = waypoints[0].y

    // Build per-segment timeline
    const segs = waypoints.length - 1
    const durations = Array.from({ length: segs }, (_, i) =>
      SEG_DURATIONS[Math.min(i, SEG_DURATIONS.length - 1)],
    )
    const totalDur = durations.reduce((a, b) => a + b, 0)
    const cumulative = durations.reduce<number[]>((acc, d, i) => {
      acc.push((acc[i - 1] ?? 0) + d)
      return acc
    }, [])

    let startTs = 0

    const tick = (ts: number) => {
      if (!startTs) startTs = ts
      const elapsed = ts - startTs

      if (elapsed >= totalDur) {
        const last = waypoints[waypoints.length - 1]
        s.ballX = last.x
        s.ballY = last.y
        s.activeBucket = ballPath.filter(Boolean).length
        s.isAnimating = false
        s.flashPeg = null
        draw()
        onAnimationEnd()
        return
      }

      // Find current segment
      const segIdx = cumulative.findIndex((c) => elapsed < c)
      const segStart = segIdx === 0 ? 0 : cumulative[segIdx - 1]
      const segDur = durations[segIdx]
      const rawT = (elapsed - segStart) / segDur

      // Ease: ease-in for gravity feel
      const t = rawT < 0.5
        ? 2 * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 2) / 2

      const from = waypoints[segIdx]
      const to = waypoints[segIdx + 1]
      const cp = from.cp

      // Quadratic bezier: from → cp → to
      const mt = 1 - t
      s.ballX = mt * mt * from.x + 2 * mt * t * cp.x + t * t * to.x
      s.ballY = mt * mt * from.y + 2 * mt * t * cp.y + t * t * to.y

      // Peg flash at the moment of impact (t ≈ 0)
      if (rawT < 0.12 && segIdx > 0 && segIdx <= rows) {
        s.flashPeg = waypoints[segIdx]
        s.flashAlpha = 1 - rawT / 0.12
      } else {
        s.flashAlpha = Math.max(0, s.flashAlpha - 0.06)
      }

      draw()
      rafRef.current = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ballPath, activeBucket, buildWaypoints, draw, onAnimationEnd, rows])

  // Redraw on risk/rows change (static)
  useEffect(() => {
    if (!stateRef.current.isAnimating) {
      stateRef.current.activeBucket = activeBucket
      draw()
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
