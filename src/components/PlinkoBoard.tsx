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

const PEG_RADIUS = 4
const BALL_RADIUS = 7
const SEGMENT_MS = 160

export default function PlinkoBoard({ rows, risk, activeBucket, ballPath, onAnimationEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const waypointsRef = useRef<{ x: number; y: number }[]>([])
  const activeRef = useRef<number | null>(null)

  const getLayout = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const W = canvas.width
    const H = canvas.height
    const buckets = rows + 1
    const pegSpacing = (W - 40) / (rows + 1)
    const centerX = W / 2
    const topY = 50
    const rowSpacing = (H - topY - 70) / rows
    return { W, H, buckets, pegSpacing, centerX, topY, rowSpacing }
  }, [rows])

  const getPegXY = useCallback(
    (row: number, col: number) => {
      const layout = getLayout()
      if (!layout) return { x: 0, y: 0 }
      const { centerX, topY, pegSpacing, rowSpacing } = layout
      return {
        x: centerX + (col - row / 2) * pegSpacing,
        y: topY + row * rowSpacing,
      }
    },
    [getLayout],
  )

  const getBucketXY = useCallback(
    (bucketIndex: number) => {
      const layout = getLayout()
      if (!layout) return { x: 0, y: 0 }
      const { centerX, pegSpacing, H, rows: _rows } = { ...layout, rows }
      return {
        x: centerX + (bucketIndex - rows / 2) * pegSpacing,
        y: H - 45,
      }
    },
    [getLayout, rows],
  )

  const buildWaypoints = useCallback(
    (path: boolean[]) => {
      const layout = getLayout()
      if (!layout) return []
      const { centerX } = layout
      const pts: { x: number; y: number }[] = []
      pts.push({ x: centerX, y: 15 })

      let col = 0
      for (let r = 0; r < rows; r++) {
        const { x, y } = getPegXY(r, col)
        pts.push({ x, y })
        if (path[r]) col++
      }
      pts.push(getBucketXY(col))
      return pts
    },
    [getLayout, getPegXY, getBucketXY, rows],
  )

  const drawFrame = useCallback(
    (ballX: number | null, ballY: number | null, highlightBucket: number | null) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const layout = getLayout()
      if (!layout) return
      const { W, H, buckets, pegSpacing, centerX } = layout
      const mults = MULTIPLIERS[risk][rows] ?? []

      ctx.clearRect(0, 0, W, H)

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#100622')
      bg.addColorStop(1, '#0a0415')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Draw pegs
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= r; c++) {
          const { x, y } = getPegXY(r, c)
          ctx.beginPath()
          ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          ctx.shadowColor = 'rgba(255,255,255,0.4)'
          ctx.shadowBlur = 4
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      // Draw buckets
      const bucketW = pegSpacing - 3
      const bucketH = 26
      const bucketY = H - bucketH - 10
      for (let i = 0; i < buckets; i++) {
        const bx = centerX + (i - rows / 2) * pegSpacing - bucketW / 2
        const mult = mults[i] ?? 0
        const color = getMultiplierColor(mult)
        const isActive = highlightBucket === i

        ctx.save()
        ctx.beginPath()
        roundRectPath(ctx, bx, bucketY, bucketW, bucketH, 5)
        if (isActive) {
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = color
          ctx.shadowBlur = 18
        } else {
          ctx.fillStyle = color + 'cc'
          ctx.shadowBlur = 0
        }
        ctx.fill()
        ctx.restore()

        // Bucket label
        ctx.fillStyle = isActive ? color : '#fff'
        ctx.font = `bold ${mult >= 100 ? 8 : 9}px Inter,sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = mult >= 10 ? `${mult}x` : `${mult}x`
        ctx.fillText(label, bx + bucketW / 2, bucketY + bucketH / 2)
      }

      // Draw ball
      if (ballX !== null && ballY !== null) {
        ctx.beginPath()
        ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(
          ballX - 2, ballY - 2, 1,
          ballX, ballY, BALL_RADIUS,
        )
        grad.addColorStop(0, '#FFEE88')
        grad.addColorStop(0.6, '#FF9900')
        grad.addColorStop(1, '#CC5500')
        ctx.fillStyle = grad
        ctx.shadowColor = '#FF9900'
        ctx.shadowBlur = 14
        ctx.fill()
        ctx.shadowBlur = 0
      }
    },
    [getLayout, getPegXY, risk, rows],
  )

  // Initial static draw
  useEffect(() => {
    drawFrame(null, null, activeRef.current)
  }, [drawFrame, rows, risk])

  // Animate when ballPath changes
  useEffect(() => {
    if (!ballPath) return
    const waypoints = buildWaypoints(ballPath)
    waypointsRef.current = waypoints

    cancelAnimationFrame(animFrameRef.current)

    const animate = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current
      const totalSegments = waypoints.length - 1
      const totalDur = totalSegments * SEGMENT_MS

      if (elapsed >= totalDur) {
        const last = waypoints[waypoints.length - 1]
        const bucket = ballPath.filter(Boolean).length
        activeRef.current = bucket
        drawFrame(last.x, last.y, bucket)
        onAnimationEnd()
        return
      }

      const seg = Math.min(Math.floor(elapsed / SEGMENT_MS), totalSegments - 1)
      const t = (elapsed % SEGMENT_MS) / SEGMENT_MS
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      const from = waypoints[seg]
      const to = waypoints[seg + 1]
      const bx = from.x + (to.x - from.x) * ease
      const by = from.y + (to.y - from.y) * ease

      drawFrame(bx, by, null)
      animFrameRef.current = requestAnimationFrame(animate)
    }

    startTimeRef.current = 0
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [ballPath, buildWaypoints, drawFrame, onAnimationEnd])

  // Re-draw when active bucket changes externally
  useEffect(() => {
    if (activeBucket === null) {
      activeRef.current = null
      drawFrame(null, null, null)
    }
  }, [activeBucket, drawFrame])

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

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
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
