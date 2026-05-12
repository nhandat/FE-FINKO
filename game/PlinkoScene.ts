import * as PIXI from 'pixi.js'
import { PegBoard } from './PegBoard'
import { MultiplierBar } from './MultiplierBar'
import { BallController, makeBall } from './BallController'
import { BackgroundLayers } from './effects/BackgroundLayers'
import { burstCoins, shakeStage } from './effects/CoinParticles'
import { soundManager } from './SoundManager'
import type { Direction } from '@/types/plinko'
import { GAME_CONFIGS, SUPER_WIN_THRESHOLD } from '@/types/plinko'

export class PlinkoScene {
  private app: PIXI.Application
  private board!: PegBoard
  private bar!: MultiplierBar
  private ball!: PIXI.Container
  private controller!: BallController

  // Design dimensions (layout is built to these; stage scales to fit real size)
  static readonly DESIGN_W = 390
  static readonly DESIGN_H = 560

  constructor(app: PIXI.Application) {
    this.app = app
    this.build(PlinkoScene.DESIGN_W, PlinkoScene.DESIGN_H)
  }

  private build(W: number, H: number) {
    const stage = this.app.stage
    stage.removeChildren()

    const renderer = this.app.renderer as PIXI.Renderer

    // ── Layer 0: background
    new BackgroundLayers(stage, W, H)

    // ── Layer 1: peg board
    const cfg = GAME_CONFIGS[8]
    this.board = new PegBoard(stage, renderer, cfg.rows, W, H)

    // ── Layer 2: multiplier bar
    this.bar = new MultiplierBar(stage, cfg.rows, cfg.multipliers, W, H)

    // ── Layer 3: ball (topmost)
    this.ball = makeBall()
    const s = this.board.ballStart()
    this.ball.x = s.x
    this.ball.y = s.y
    stage.addChild(this.ball)

    this.controller = new BallController(this.ball, this.board, this.bar)
  }

  async drop(path: Direction[], resultSlot: number, multiplier: number): Promise<void> {
    await this.controller.drop(path, resultSlot)

    if (multiplier >= SUPER_WIN_THRESHOLD) {
      soundManager.bigWin()
      // Two coin bursts from the winning slot
      burstCoins(
        this.app.renderer as PIXI.Renderer,
        this.app.stage,
        this.bar.centerX(resultSlot),
        this.bar.y - 18,
        30,
      )
      setTimeout(() => {
        burstCoins(
          this.app.renderer as PIXI.Renderer,
          this.app.stage,
          this.bar.centerX(resultSlot) + (Math.random() - 0.5) * 40,
          this.bar.y - 22,
          20,
        )
      }, 200)
      shakeStage(this.app.stage)
    } else if (multiplier >= 1) {
      soundManager.win()
      burstCoins(
        this.app.renderer as PIXI.Renderer,
        this.app.stage,
        this.bar.centerX(resultSlot),
        this.bar.y - 18,
        14,
      )
    }
  }
}
