import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import type { Direction } from '@/types/plinko'
import type { PegBoard } from './PegBoard'
import type { MultiplierBar } from './MultiplierBar'

const BALL_R = 9

export function makeBall(): PIXI.Container {
  const c = new PIXI.Container()

  // Outer glow
  const og = new PIXI.Graphics()
  og.beginFill(0xFF9900, 0.18); og.drawCircle(0, 0, BALL_R * 2.4); og.endFill()
  og.beginFill(0xFF9900, 0.28); og.drawCircle(0, 0, BALL_R * 1.6); og.endFill()
  c.addChild(og)

  // Sphere layers
  const g = new PIXI.Graphics()
  g.beginFill(0xAA2200); g.drawCircle(0, 0, BALL_R); g.endFill()
  g.beginFill(0xFF8800, 0.92); g.drawCircle(-0.5, -0.5, BALL_R * 0.82); g.endFill()
  g.beginFill(0xFFCC44, 0.80); g.drawCircle(-BALL_R * 0.28, -BALL_R * 0.3, BALL_R * 0.46); g.endFill()
  g.beginFill(0xFFFFFF, 0.60); g.drawCircle(-BALL_R * 0.28, -BALL_R * 0.35, BALL_R * 0.20); g.endFill()
  c.addChild(g)

  c.alpha = 0
  return c
}

export class BallController {
  private ball: PIXI.Container
  private board: PegBoard
  private bar: MultiplierBar

  constructor(ball: PIXI.Container, board: PegBoard, bar: MultiplierBar) {
    this.ball = ball
    this.board = board
    this.bar = bar
  }

  drop(path: Direction[], targetSlot: number): Promise<void> {
    return new Promise((resolve) => {
      const ball = this.ball
      const board = this.board
      const bar = this.bar
      const tl = gsap.timeline({ onComplete: resolve })
      const rows = path.length

      // Reset ball
      const start = board.ballStart()
      ball.x = start.x
      ball.y = start.y
      ball.alpha = 1
      ball.scale.set(1)

      let col = 0
      let prevX = start.x
      let prevY = start.y

      for (let r = 0; r < rows; r++) {
        const goRight = path[r] === 'R'
        const to = board.xy(r, col)
        const fromX = prevX, fromY = prevY, toX = to.x, toY = to.y
        const cpX = fromX + (goRight ? board.pegSpacing * 0.62 : -board.pegSpacing * 0.62)
        const cpY = fromY + (toY - fromY) * 0.30

        // Gravity: each successive row is 14% faster
        const dur = Math.max(0.09, 0.27 * Math.pow(0.87, r))
        const captR = r, captC = col
        const t = { v: 0 }

        tl.to(t, {
          v: 1,
          duration: dur,
          ease: 'power2.in',
          onUpdate: () => {
            const k = t.v, mk = 1 - k
            ball.x = mk * mk * fromX + 2 * mk * k * cpX + k * k * toX
            ball.y = mk * mk * fromY + 2 * mk * k * cpY + k * k * toY
          },
          onComplete: () => board.flash(captR, captC),
        })

        prevX = toX; prevY = toY
        if (goRight) col++
      }

      // Drop into multiplier slot
      const fX = prevX, fY = prevY
      const sX = bar.centerX(targetSlot), sY = bar.y
      const cpX2 = (fX + sX) / 2
      const cpY2 = fY + (sY - fY) * 0.35
      const t2 = { v: 0 }

      tl.to(t2, {
        v: 1,
        duration: 0.15,
        ease: 'power2.in',
        onUpdate: () => {
          const k = t2.v, mk = 1 - k
          ball.x = mk * mk * fX + 2 * mk * k * cpX2 + k * k * sX
          ball.y = mk * mk * fY + 2 * mk * k * cpY2 + k * k * sY
        },
        onComplete: () => {
          bar.highlight(targetSlot)
          // Landing bounce then fade
          gsap.timeline()
            .to(ball.scale, { x: 1.35, y: 0.7, duration: 0.07 })
            .to(ball.scale, { x: 0.8, y: 1.2, duration: 0.08 })
            .to(ball.scale, { x: 1, y: 1, duration: 0.12, ease: 'elastic.out(1, 0.4)' })
            .to(ball, { alpha: 0, duration: 0.30, delay: 0.25 })
        },
      })
    })
  }
}
