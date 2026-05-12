import * as PIXI from 'pixi.js'
import { PlinkoScene } from './PlinkoScene'
import type { Direction } from '@/types/plinko'

// Suppress console banner
PIXI.utils.skipHello()

export class PlinkoGame {
  private app: PIXI.Application
  private scene: PlinkoScene
  private scaleContainer: PIXI.Container  // wraps stage for uniform scaling

  readonly designW = PlinkoScene.DESIGN_W
  readonly designH = PlinkoScene.DESIGN_H

  constructor(container: HTMLElement, width: number, height: number) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      // Cap pixel ratio at 2 to avoid overdraw on high-DPI mobile
      resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
      autoDensity: true,
      // Power preference for mobile GPU
      powerPreference: 'high-performance',
    })

    // Cap ticker to 60 FPS
    this.app.ticker.maxFPS = 60

    // Scale container: game is designed at DESIGN_W × DESIGN_H
    // and scaled uniformly to fill the actual canvas
    this.scaleContainer = new PIXI.Container()
    this.app.stage.addChild(this.scaleContainer)

    container.appendChild(this.app.view as HTMLCanvasElement)

    // Build scene inside scaleContainer
    const origStage = this.app.stage
    // Override stage temporarily so PlinkoScene adds to scaleContainer
    Object.defineProperty(this.app, 'stage', { get: () => this.scaleContainer, configurable: true })
    this.scene = new PlinkoScene(this.app)
    Object.defineProperty(this.app, 'stage', { get: () => origStage, configurable: true })

    this.applyScale(width, height)
  }

  async drop(path: Direction[], resultSlot: number, multiplier: number) {
    await this.scene.drop(path, resultSlot, multiplier)
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
    this.applyScale(width, height)
  }

  private applyScale(w: number, h: number) {
    const scale = Math.min(w / this.designW, h / this.designH)
    this.scaleContainer.scale.set(scale)
    // Center horizontally if there's extra space
    this.scaleContainer.x = (w - this.designW * scale) / 2
    this.scaleContainer.y = (h - this.designH * scale) / 2
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
  }
}
