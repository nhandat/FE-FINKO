import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { PegBoard } from './PegBoard'
import { MultiplierBar } from './MultiplierBar'
import { BallController, makeBall } from './BallController'
import { burstCoins, shakeStage } from './effects/CoinParticles'
import type { Direction } from '@/types/plinko'
import { GAME_CONFIGS, SUPER_WIN_THRESHOLD } from '@/types/plinko'

export class PlinkoScene {
  private stage: PIXI.Container
  private board: PegBoard
  private bar: MultiplierBar
  private ballContainer: PIXI.Container
  private controller: BallController

  constructor(app: PIXI.Application) {
    const { width: W, height: H } = app.screen
    this.stage = app.stage

    // ── Background ───────────────────────────────────────────────
    this.drawBackground(app, W, H)

    // ── Peg board ────────────────────────────────────────────────
    const cfg = GAME_CONFIGS[8]
    this.board = new PegBoard(this.stage, cfg.rows, W, H)

    // ── Multiplier bar ───────────────────────────────────────────
    this.bar = new MultiplierBar(this.stage, cfg.rows, cfg.multipliers, W, H)

    // ── Ball ─────────────────────────────────────────────────────
    this.ballContainer = makeBall()
    this.stage.addChild(this.ballContainer)

    // Position ball at start offscreen
    const s = this.board.ballStart()
    this.ballContainer.x = s.x
    this.ballContainer.y = s.y

    this.controller = new BallController(this.ballContainer, this.board, this.bar)
  }

  async drop(
    path: Direction[],
    resultSlot: number,
    multiplier: number,
  ): Promise<void> {
    await this.controller.drop(path, resultSlot)

    if (multiplier >= SUPER_WIN_THRESHOLD) {
      burstCoins(this.stage, this.bar.centerX(resultSlot), this.bar.y - 20)
      shakeStage(this.stage)
    }
  }

  private drawBackground(app: PIXI.Application, W: number, H: number) {
    // Deep dark gradient via a gradient texture
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0E0620')
    grad.addColorStop(0.5, '#080412')
    grad.addColorStop(1, '#04020A')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Subtle radial glow center
    const radial = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.6)
    radial.addColorStop(0, 'rgba(130, 40, 220, 0.12)')
    radial.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = radial
    ctx.fillRect(0, 0, W, H)

    const tex = PIXI.Texture.from(canvas)
    const bg = new PIXI.Sprite(tex)
    bg.width = W; bg.height = H
    app.stage.addChild(bg)

    // Neon border strip at very top
    const strip = new PIXI.Graphics()
    strip.beginFill(0xFF2D78, 0.7)
    strip.drawRect(0, 0, W, 2)
    strip.endFill()
    app.stage.addChild(strip)

    // Drop-shadow line separating game from UI
    const line = new PIXI.Graphics()
    line.lineStyle(1, 0x4B1F8C, 0.5)
    line.moveTo(16, H - 90)
    line.lineTo(W - 16, H - 90)
    app.stage.addChild(line)

    // Animate neon border pulse
    gsap.to(strip, { alpha: 0.3, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
  }
}
