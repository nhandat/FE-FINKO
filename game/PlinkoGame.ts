/**
 * PlinkoGame — thin façade over PixiJS app + PlinkoScene.
 * Instantiated inside a 'use client' component after mount.
 */
import * as PIXI from 'pixi.js'
import { PlinkoScene } from './PlinkoScene'
import type { Direction } from '@/types/plinko'

export class PlinkoGame {
  private app: PIXI.Application
  private scene: PlinkoScene

  constructor(container: HTMLElement, width: number, height: number) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundAlpha: 0,          // CSS gradient handles bg
      antialias: true,
      resolution: Math.min(window.devicePixelRatio ?? 1, 2),
      autoDensity: true,
    })
    container.appendChild(this.app.view as HTMLCanvasElement)
    this.scene = new PlinkoScene(this.app)
  }

  async drop(path: Direction[], resultSlot: number, multiplier: number) {
    await this.scene.drop(path, resultSlot, multiplier)
  }

  resize(width: number, height: number) {
    this.app.renderer.resize(width, height)
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
  }
}
