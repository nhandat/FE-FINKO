import * as PIXI from 'pixi.js'
import { GlowFilter } from 'pixi-filters'
import gsap from 'gsap'
import type { Direction } from '@/types/plinko'
import type { PegBoard } from './PegBoard'
import type { MultiplierBar } from './MultiplierBar'
import { soundManager } from './SoundManager'

const BALL_R = 9

export function makeBall(): PIXI.Container {
  const c = new PIXI.Container()

  // Outer glow ring
  const og = new PIXI.Graphics()
  og.beginFill(0xFF8800, 0.14); og.drawCircle(0, 0, BALL_R * 2.5); og.endFill()
  og.beginFill(0xFF9900, 0.22); og.drawCircle(0, 0, BALL_R * 1.65); og.endFill()
  c.addChild(og)

  // Sphere layers
  const g = new PIXI.Graphics()
  g.beginFill(0xAA2200); g.drawCircle(0, 0, BALL_R); g.endFill()
  g.beginFill(0xFF8800, 0.92); g.drawCircle(-0.5, -0.5, BALL_R * 0.82); g.endFill()
  g.beginFill(0xFFCC44, 0.78); g.drawCircle(-BALL_R * 0.28, -BALL_R * 0.30, BALL_R * 0.46); g.endFill()
  g.beginFill(0xFFFFFF, 0.62); g.drawCircle(-BALL_R * 0.28, -BALL_R * 0.34, BALL_R * 0.20); g.endFill()
  c.addChild(g)

  // Persistent glow filter
  const gf = new GlowFilter({ distance: 18, outerStrength: 2.5, color: 0xFF9900, quality: 0.25 })
  c.filters = [gf]

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
      const ball  = this.ball
      const board = this.board
      const bar   = this.bar
      const rows  = path.length
      const tl    = gsap.timeline({ onComplete: resolve })

      const start = board.ballStart()
      ball.x = start.x; ball.y = start.y
      ball.alpha = 1; ball.scale.set(1)

      // Fade in
      gsap.fromTo(ball, { alpha: 0 }, { alpha: 1, duration: 0.12 })

      let col = 0
      let px = start.x, py = start.y

      for (let r = 0; r < rows; r++) {
        const goRight = path[r] === 'R'
        const to   = board.xy(r, col)
        const fX = px, fY = py, tX = to.x, tY = to.y

        // Bezier CP: swing to side before dropping — more visible on first rows
        const cpX = fX + (goRight ? board.pegSpacing * 0.65 : -board.pegSpacing * 0.65)
        const cpY = fY + (tY - fY) * 0.28

        // Gravity: each row ~13% faster, min 90ms
        const dur = Math.max(0.09, 0.27 * Math.pow(0.87, r))

        const captR = r, captC = col
        const t = { v: 0 }

        tl.to(t, {
          v: 1, duration: dur, ease: 'power2.in',
          onUpdate: () => {
            const k = t.v, mk = 1 - k
            ball.x = mk * mk * fX + 2 * mk * k * cpX + k * k * tX
            ball.y = mk * mk * fY + 2 * mk * k * cpY + k * k * tY
            // Squish toward peg (slight scale)
            const speed = 1 - k * 0.18
            ball.scale.set(1 / speed, speed)
          },
          onComplete: () => {
            board.flash(captR, captC)
            soundManager.ballHit(captR)
          },
        })

        px = tX; py = tY
        if (goRight) col++
      }

      // Final drop to multiplier slot
      const fX2 = px, fY2 = py
      const sX = bar.centerX(targetSlot), sY = bar.y - 2
      const cpX2 = (fX2 + sX) / 2
      const cpY2 = fY2 + (sY - fY2) * 0.35
      const t2 = { v: 0 }

      tl.to(t2, {
        v: 1, duration: 0.15, ease: 'power2.in',
        onUpdate: () => {
          const k = t2.v, mk = 1 - k
          ball.x = mk * mk * fX2 + 2 * mk * k * cpX2 + k * k * sX
          ball.y = mk * mk * fY2 + 2 * mk * k * cpY2 + k * k * sY
        },
        onComplete: () => {
          bar.highlight(targetSlot)
          soundManager.ballLand()
          // Landing squash → stretch → pop
          gsap.timeline()
            .to(ball.scale, { x: 1.4, y: 0.65, duration: 0.07 })
            .to(ball.scale, { x: 0.8, y: 1.25, duration: 0.08 })
            .to(ball.scale, { x: 1,   y: 1,    duration: 0.14, ease: 'elastic.out(1,0.4)' })
            .to(ball, { alpha: 0, duration: 0.28, delay: 0.22 })
        },
      })
    })
  }
}
