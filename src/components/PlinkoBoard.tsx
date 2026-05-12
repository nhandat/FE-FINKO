import { useRef, useEffect, useCallback } from 'react'
import { MULTIPLIERS, getMultiplierColor } from '../constants/game'
import type { RiskLevel } from '../types'

interface Props {
  rows: number
  risk: RiskLevel
  activeBucket: number | null
  /** If provided, bias the ball toward this bucket index */
  targetBucket: number | null
  ballPath: boolean[] | null
  onAnimationEnd: (bucketIndex: number) => void
}

// ── Physics constants ──────────────────────────────────────────────
const GRAVITY   = 0.30   // px / frame²
const RESTITUTION = 0.42  // bounciness off pegs
const FRICTION_AIR = 0.003
const SUBSTEPS  = 4      // collision resolution passes per frame
const PEG_R     = 5
const BALL_R    = 8
const BOUNCE_DUR = 380   // ms peg glow duration

interface Vec2 { x: number; y: number }
interface PegBody { x: number; y: number; row: number; col: number }

export default function PlinkoBoard({
  rows, risk, activeBucket, targetBucket, ballPath, onAnimationEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  // mutable physics state – not React state to avoid re-renders
  const ballPos    = useRef<Vec2>({ x: -999, y: -999 })
  const ballVel    = useRef<Vec2>({ x: 0, y: 0 })
  const pegsRef    = useRef<PegBody[]>([])
  const pegHits    = useRef<Map<string, number>>(new Map())
  const activeRef  = useRef<number | null>(null)
  const runningRef = useRef(false)

  /* ── layout ──────────────────────────────────────────────────── */
  const layout = useCallback(() => {
    const c = canvasRef.current
    if (!c) return null
    const W = c.width, H = c.height
    const ps  = (W - 32) / (rows + 1)
    const cx  = W / 2
    const topY = 52
    const rowH = (H - topY - 75) / rows
    return { W, H, ps, cx, topY, rowH }
  }, [rows])

  /* ── build static peg bodies ─────────────────────────────────── */
  const buildPegs = useCallback((): PegBody[] => {
    const l = layout()
    if (!l) return []
    const out: PegBody[] = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c <= r; c++)
        out.push({ x: l.cx + (c - r / 2) * l.ps, y: l.topY + r * l.rowH, row: r, col: c })
    return out
  }, [layout, rows])

  const bucketX = useCallback((idx: number) => {
    const l = layout()!
    return l.cx + (idx - rows / 2) * l.ps
  }, [layout, rows])

  /* ── launch ball ─────────────────────────────────────────────── */
  const launchBall = useCallback(() => {
    const l = layout()
    if (!l) return
    const pegs = buildPegs()
    pegsRef.current = pegs
    pegHits.current.clear()
    activeRef.current = null
    runningRef.current = true

    // Horizontal bias toward target bucket
    const bias = targetBucket !== null
      ? (targetBucket - rows / 2) * l.ps * 0.13
      : (Math.random() - 0.5) * l.ps * 0.6

    ballPos.current = { x: l.cx + bias * 0.4, y: l.topY - l.rowH }
    ballVel.current = {
      x: bias * 0.018 + (Math.random() - 0.5) * 0.4,
      y: 1.2,
    }
  }, [layout, buildPegs, targetBucket, rows])

  /* ── draw ────────────────────────────────────────────────────── */
  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const l = layout()
    if (!l) return
    const { W, H, ps } = l
    const mults   = MULTIPLIERS[risk][rows] ?? []
    const buckets = rows + 1
    const bp      = ballPos.current

    ctx.clearRect(0, 0, W, H)

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#11062b')
    bg.addColorStop(1, '#07020f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    // Ambient glow
    const ag = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H*0.4, W*0.65)
    ag.addColorStop(0, 'rgba(110,35,195,0.09)')
    ag.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = ag
    ctx.fillRect(0, 0, W, H)

    // ── Pegs ──────────────────────────────────────────────────────
    for (const p of pegsRef.current) {
      const key   = `${p.row},${p.col}`
      const hitTs = pegHits.current.get(key) ?? 0
      const t     = hitTs > 0 ? Math.min(1, (now - hitTs) / BOUNCE_DUR) : 1
      const scale = t < 1 ? 1 + Math.sin(t * Math.PI) * 0.7 : 1
      const glowA = t < 1 ? Math.sin(t * Math.PI) : 0
      const r3    = PEG_R * scale

      ctx.save()
      ctx.beginPath()
      ctx.arc(p.x, p.y, r3, 0, Math.PI * 2)
      const gr = ctx.createRadialGradient(p.x - r3*0.3, p.y - r3*0.38, r3*0.05, p.x, p.y, r3)
      if (glowA > 0.04) {
        gr.addColorStop(0, '#fffde0')
        gr.addColorStop(0.35, `rgba(255,205,50,0.9)`)
        gr.addColorStop(0.7,  `rgba(190,90,5,0.75)`)
        gr.addColorStop(1,    `rgba(70,18,0,0.55)`)
        ctx.shadowColor = `rgba(255,175,15,${glowA * 0.9})`
        ctx.shadowBlur  = 22 * glowA
      } else {
        gr.addColorStop(0,   '#ffffff')
        gr.addColorStop(0.28,'rgba(220,195,255,0.95)')
        gr.addColorStop(0.65,'rgba(130,80,200,0.75)')
        gr.addColorStop(1,   'rgba(42,10,82,0.5)')
        ctx.shadowColor = 'rgba(175,135,255,0.3)'
        ctx.shadowBlur  = 5
      }
      ctx.fillStyle = gr
      ctx.fill()
      ctx.restore()
    }

    // ── Buckets ──────────────────────────────────────────────────
    const bw = ps - 4, bh = 28, by = H - bh - 8
    for (let i = 0; i < buckets; i++) {
      const bx   = bucketX(i) - bw / 2
      const mult  = mults[i] ?? 0
      const color = getMultiplierColor(mult)
      const isAct = activeRef.current === i

      ctx.save()
      ctx.beginPath()
      rrect(ctx, bx, by, bw, bh, 5)
      if (isAct) { ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.fillStyle = '#fff' }
      else { ctx.fillStyle = color + 'bb'; ctx.shadowBlur = 0 }
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = isAct ? color : '#fff'
      ctx.font = `bold ${mult >= 100 ? 7 : 9}px Inter,sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(`${mult}x`, bx + bw / 2, by + bh / 2)
    }

    // ── Ball ──────────────────────────────────────────────────────
    if (bp.x > -500) {
      // Motion blur trail
      ctx.save()
      const bv = ballVel.current
      const speed = Math.sqrt(bv.x * bv.x + bv.y * bv.y)
      if (speed > 2) {
        const tx = bp.x - bv.x * 2.5
        const ty = bp.y - bv.y * 2.5
        const trailGr = ctx.createLinearGradient(tx, ty, bp.x, bp.y)
        trailGr.addColorStop(0, 'rgba(255,140,0,0)')
        trailGr.addColorStop(1, `rgba(255,140,0,${Math.min(0.45, speed * 0.04)})`)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(bp.x, bp.y)
        ctx.strokeStyle = trailGr
        ctx.lineWidth   = BALL_R * 1.6
        ctx.lineCap     = 'round'
        ctx.stroke()
      }
      ctx.restore()

      // Ball sphere
      ctx.save()
      ctx.beginPath()
      ctx.arc(bp.x, bp.y, BALL_R, 0, Math.PI * 2)
      const sg = ctx.createRadialGradient(
        bp.x - 2.8, bp.y - 3, 0.8,
        bp.x, bp.y, BALL_R,
      )
      sg.addColorStop(0,    '#FFF9C4')
      sg.addColorStop(0.4,  '#FFAA00')
      sg.addColorStop(0.8,  '#EE6600')
      sg.addColorStop(1,    '#882200')
      ctx.fillStyle = sg
      ctx.shadowColor = '#FF9900'; ctx.shadowBlur = 18
      ctx.fill()
      // Specular highlight
      ctx.beginPath()
      ctx.arc(bp.x - 2.5, bp.y - 2.5, BALL_R * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.shadowBlur = 0
      ctx.fill()
      ctx.restore()
    }
  }, [layout, bucketX, risk, rows])

  /* ── physics tick ─────────────────────────────────────────────── */
  const physicsTick = useCallback((now: number) => {
    const l = layout()
    if (!l) return

    const dt = 1 / SUBSTEPS
    const bp = ballPos.current
    const bv = ballVel.current

    for (let s = 0; s < SUBSTEPS; s++) {
      bv.y += GRAVITY * dt
      bv.x *= (1 - FRICTION_AIR)
      bp.x += bv.x
      bp.y += bv.y

      // Wall collisions
      const minX = 16 + BALL_R, maxX = l.W - 16 - BALL_R
      if (bp.x < minX) { bp.x = minX; bv.x = Math.abs(bv.x) * RESTITUTION }
      if (bp.x > maxX) { bp.x = maxX; bv.x = -Math.abs(bv.x) * RESTITUTION }

      // Peg collisions
      for (const peg of pegsRef.current) {
        const dx   = bp.x - peg.x
        const dy   = bp.y - peg.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const min  = BALL_R + PEG_R + 0.5
        if (dist < min && dist > 0.01) {
          const nx = dx / dist, ny = dy / dist
          // Push out
          bp.x = peg.x + nx * min
          bp.y = peg.y + ny * min
          // Reflect velocity along normal
          const dot = bv.x * nx + bv.y * ny
          if (dot < 0) {
            bv.x -= (1 + RESTITUTION) * dot * nx
            bv.y -= (1 + RESTITUTION) * dot * ny
          }
          // Record hit for visual bounce
          const key = `${peg.row},${peg.col}`
          if (!pegHits.current.has(key) || now - (pegHits.current.get(key)!) > BOUNCE_DUR * 0.8)
            pegHits.current.set(key, now)
        }
      }
    }

    // Detect landing (below bucket row)
    if (bp.y > l.H - 68) {
      const bucket = Math.round((bp.x - l.cx) / l.ps + rows / 2)
      const clamped = Math.max(0, Math.min(rows, bucket))
      activeRef.current = clamped
      runningRef.current = false
      draw(now)
      onAnimationEnd(clamped)
      return
    }

    draw(now)
    rafRef.current = requestAnimationFrame(physicsTick)
  }, [layout, draw, onAnimationEnd, rows])

  /* ── start / stop ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!ballPath) {
      // Static board: no ball, maybe highlight bucket
      ballPos.current = { x: -999, y: -999 }
      activeRef.current = activeBucket
      runningRef.current = false
      pegsRef.current = buildPegs()
      cancelAnimationFrame(rafRef.current)
      draw(performance.now())
      return
    }

    // New drop
    cancelAnimationFrame(rafRef.current)
    launchBall()
    rafRef.current = requestAnimationFrame(physicsTick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [ballPath, activeBucket, buildPegs, launchBall, physicsTick, draw])

  // Static redraw when params change
  useEffect(() => {
    if (!runningRef.current) {
      pegsRef.current = buildPegs()
      activeRef.current = activeBucket
      draw(performance.now())
    }
  }, [risk, rows, activeBucket, buildPegs, draw])

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
