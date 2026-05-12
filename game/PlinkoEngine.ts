import Matter from 'matter-js'
import type { RowCount, RiskLevel, WinRecord } from '@/types/plinko'
import { binPayouts, frictionAirByRowCount } from '@/lib/constants/game'
import { binColorsByRowCount } from '@/lib/utils/colors'

// Fixed design dimensions — CSS scales the canvas to fit the screen
const W          = 760
const H          = 570
const PADDING_X  = 52
const PADDING_TOP    = 36
const PADDING_BOTTOM = 28

export type WinCallback = (record: Omit<WinRecord, 'id'>) => void

export class PlinkoEngine {
  static readonly WIDTH  = W
  static readonly HEIGHT = H

  readonly canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: Matter.Engine
  private runner: Matter.Runner
  private animFrame = 0

  private pins: Matter.Body[]  = []
  private walls: Matter.Body[] = []
  private sensor!: Matter.Body
  // ball id → bet amount
  private balls = new Map<number, { body: Matter.Body; bet: number }>()

  rowCount:  RowCount
  riskLevel: RiskLevel
  private onWin: WinCallback

  // Fraction of canvas width occupied by the bins row (used to align React bins)
  get binsWidthFraction() { return (W - PADDING_X * 2) / W }

  constructor(
    canvas: HTMLCanvasElement,
    rowCount: RowCount,
    riskLevel: RiskLevel,
    onWin: WinCallback,
  ) {
    this.canvas    = canvas
    this.ctx       = canvas.getContext('2d')!
    this.rowCount  = rowCount
    this.riskLevel = riskLevel
    this.onWin     = onWin

    this.engine = Matter.Engine.create({ gravity: { x: 0, y: 1.5 } })
    this.runner = Matter.Runner.create()

    this.buildWorld()
    this.setupEvents()
    this.startLoop()
  }

  // ─── Geometry helpers ────────────────────────────────────────────────────────

  private get pinR() { return (24 - this.rowCount) / 2 }

  // Horizontal distance between adjacent pins in the same row
  private get dx() { return (W - PADDING_X * 2) / (this.rowCount + 1) }

  // Vertical distance between consecutive rows
  private get dy() { return (H - PADDING_TOP - PADDING_BOTTOM) / (this.rowCount + 1) }

  // ─── World setup ─────────────────────────────────────────────────────────────

  private buildWorld() {
    Matter.Composite.clear(this.engine.world, false)
    this.pins  = []
    this.walls = []
    this.balls.clear()

    const { pinR, dx, dy } = this

    // Pins: row i (0-indexed) has i+3 pins
    for (let row = 0; row < this.rowCount; row++) {
      const count = row + 3
      const y     = PADDING_TOP + (row + 1) * dy
      for (let col = 0; col < count; col++) {
        const x   = W / 2 - ((count - 1) / 2) * dx + col * dx
        const pin = Matter.Bodies.circle(x, y, pinR, {
          isStatic:  true,
          restitution: 0.3,
          friction:  0.5,
          label:     'pin',
          collisionFilter: { category: 0x0002, mask: 0x0001 },
        })
        this.pins.push(pin)
      }
    }

    // Bottom sensor — detects which bin the ball enters
    this.sensor = Matter.Bodies.rectangle(W / 2, H + 25, W * 2, 50, {
      isStatic: true,
      isSensor: true,
      label:    'sensor',
      collisionFilter: { category: 0x0002, mask: 0x0001 },
    })

    // Invisible side walls
    const wallOpts = {
      isStatic:    true,
      friction:    0.3,
      restitution: 0.4,
      label:       'wall',
      collisionFilter: { category: 0x0004, mask: 0x0001 },
    }
    const left  = Matter.Bodies.rectangle(-10, H / 2, 20, H * 2, wallOpts)
    const right = Matter.Bodies.rectangle(W + 10, H / 2, 20, H * 2, wallOpts)

    Matter.Composite.add(this.engine.world, [
      ...this.pins, this.sensor, left, right,
    ])
    this.walls = [left, right]
  }

  // ─── Collision events ────────────────────────────────────────────────────────

  private setupEvents() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const { bodyA, bodyB } of event.pairs) {
        let ball:  Matter.Body | null = null
        let other: Matter.Body | null = null

        if (this.balls.has(bodyA.id)) { ball = bodyA; other = bodyB }
        else if (this.balls.has(bodyB.id)) { ball = bodyB; other = bodyA }

        if (!ball || other?.label !== 'sensor') continue

        const entry      = this.balls.get(ball.id)
        if (!entry) continue

        const binIndex   = this.getBinIndex(ball.position.x)
        const multiplier = binPayouts[this.rowCount][this.riskLevel][binIndex] ?? 0

        this.onWin({
          binIndex,
          multiplier,
          betAmount: entry.bet,
          profit:    entry.bet * multiplier - entry.bet,
          rowCount:  this.rowCount,
          riskLevel: this.riskLevel,
        })

        // Remove ball after a short delay so the collision fully resolves
        const b = ball
        setTimeout(() => {
          Matter.Composite.remove(this.engine.world, b)
          this.balls.delete(b.id)
        }, 80)
      }
    })
  }

  // ─── Bin index from X position ───────────────────────────────────────────────

  private getBinIndex(x: number): number {
    // Last row pins span from PADDING_X to W-PADDING_X with spacing dx
    const idx = Math.floor((x - PADDING_X) / this.dx)
    return Math.max(0, Math.min(this.rowCount, idx))
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  dropBall(bet: number) {
    const ballR  = this.pinR * 2
    const offset = (Math.random() - 0.5) * 1.6 * this.dx

    const ball = Matter.Bodies.circle(
      W / 2 + offset,
      PADDING_TOP - ballR * 2,
      ballR,
      {
        restitution: 0.8,
        friction:    0.5,
        frictionAir: frictionAirByRowCount[this.rowCount],
        label:       'ball',
        collisionFilter: { category: 0x0001, mask: 0x0002 | 0x0004 },
      },
    )

    Matter.Composite.add(this.engine.world, ball)
    this.balls.set(ball.id, { body: ball, bet })
  }

  setRowCount(rc: RowCount) {
    this.rowCount = rc
    this.buildWorld()
  }

  setRiskLevel(rl: RiskLevel) { this.riskLevel = rl }

  stop() {
    Matter.Runner.stop(this.runner)
    cancelAnimationFrame(this.animFrame)
  }

  // ─── Render loop ─────────────────────────────────────────────────────────────

  private startLoop() {
    Matter.Runner.run(this.runner, this.engine)
    const loop = () => {
      this.draw()
      this.animFrame = requestAnimationFrame(loop)
    }
    loop()
  }

  private draw() {
    const ctx  = this.ctx
    const { pinR } = this

    ctx.clearRect(0, 0, W, H)

    // ── Background ──────────────────────────────────────────────────────────
    const bg = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H / 2, W * 0.78)
    bg.addColorStop(0, '#1e1040')
    bg.addColorStop(1, '#080318')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(120,80,200,0.07)'
    ctx.lineWidth   = 1
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // ── Bins preview strip at bottom ────────────────────────────────────────
    const colors   = binColorsByRowCount[this.rowCount]
    const binCount = this.rowCount + 1
    const { dx }   = this
    const binH     = 28
    const binY     = H - PADDING_BOTTOM - binH
    const startX   = PADDING_X

    for (let i = 0; i < binCount; i++) {
      const bx = startX + i * dx
      const bw = dx - 2
      ctx.fillStyle = colors.background[i]
      this.roundRect(ctx, bx - bw / 2, binY, bw, binH, 4)
      ctx.fill()
    }

    // ── Pins ────────────────────────────────────────────────────────────────
    for (const pin of this.pins) {
      const { x, y } = pin.position
      // Glow
      ctx.save()
      ctx.shadowBlur  = 10
      ctx.shadowColor = 'rgba(160,110,255,0.8)'
      ctx.beginPath()
      ctx.arc(x, y, pinR + 1, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(130,90,220,0.35)'
      ctx.fill()
      ctx.restore()
      // Core
      ctx.beginPath()
      ctx.arc(x, y, pinR, 0, Math.PI * 2)
      const pinGrad = ctx.createRadialGradient(x - pinR * 0.3, y - pinR * 0.35, 0, x, y, pinR)
      pinGrad.addColorStop(0, '#e8d8ff')
      pinGrad.addColorStop(0.5, '#c0a0ff')
      pinGrad.addColorStop(1, '#8060cc')
      ctx.fillStyle = pinGrad
      ctx.fill()
    }

    // ── Balls ────────────────────────────────────────────────────────────────
    const ballR = pinR * 2
    for (const [, { body }] of this.balls) {
      const { x, y } = body.position
      const grd = ctx.createRadialGradient(
        x - ballR * 0.35, y - ballR * 0.35, 0,
        x, y, ballR,
      )
      grd.addColorStop(0, '#FFF5C0')
      grd.addColorStop(0.45, '#FFD700')
      grd.addColorStop(1, '#B8860B')
      ctx.save()
      ctx.shadowBlur  = 18
      ctx.shadowColor = 'rgba(255,210,0,0.75)'
      ctx.beginPath()
      ctx.arc(x, y, ballR, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
      // Shine
      ctx.beginPath()
      ctx.arc(x - ballR * 0.3, y - ballR * 0.32, ballR * 0.22, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fill()
      ctx.restore()
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}
