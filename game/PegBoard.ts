import * as PIXI from 'pixi.js'
import { GlowFilter } from 'pixi-filters'
import gsap from 'gsap'

export interface XY { x: number; y: number }

const PEG_R = 7

// Pre-rendered textures (created once per app lifecycle)
let _normalTex: PIXI.RenderTexture | null = null
let _hitTex:    PIXI.RenderTexture | null = null

function getPegTextures(renderer: PIXI.Renderer): { normal: PIXI.RenderTexture; hit: PIXI.RenderTexture } {
  const size = PEG_R * 2 + 8 // padding for glow
  const cx   = size / 2

  if (!_normalTex) {
    const g = new PIXI.Graphics()
    // Dark base
    g.beginFill(0x2E1060); g.drawCircle(cx, cx, PEG_R); g.endFill()
    // Mid tone
    g.beginFill(0x9B6DDB, 0.85); g.drawCircle(cx - 0.5, cx - 0.5, PEG_R * 0.77); g.endFill()
    // Highlight
    g.beginFill(0xE0D0FF, 0.80); g.drawCircle(cx - PEG_R * 0.28, cx - PEG_R * 0.32, PEG_R * 0.36); g.endFill()
    // Specular
    g.beginFill(0xFFFFFF, 0.65); g.drawCircle(cx - PEG_R * 0.28, cx - PEG_R * 0.36, PEG_R * 0.17); g.endFill()

    _normalTex = PIXI.RenderTexture.create({ width: size, height: size })
    renderer.render(g, { renderTexture: _normalTex })
    g.destroy()
  }

  if (!_hitTex) {
    const g = new PIXI.Graphics()
    // Bright glowing version
    g.beginFill(0xFFD700, 0.25); g.drawCircle(cx, cx, PEG_R * 2.6); g.endFill()
    g.beginFill(0xFFCC00, 0.45); g.drawCircle(cx, cx, PEG_R * 1.9); g.endFill()
    g.beginFill(0x804000); g.drawCircle(cx, cx, PEG_R); g.endFill()
    g.beginFill(0xFF9900, 0.90); g.drawCircle(cx - 0.5, cx - 0.5, PEG_R * 0.77); g.endFill()
    g.beginFill(0xFFEE88, 0.80); g.drawCircle(cx - PEG_R * 0.28, cx - PEG_R * 0.30, PEG_R * 0.38); g.endFill()
    g.beginFill(0xFFFFFF, 0.70); g.drawCircle(cx - PEG_R * 0.28, cx - PEG_R * 0.34, PEG_R * 0.16); g.endFill()

    _hitTex = PIXI.RenderTexture.create({ width: size, height: size })
    renderer.render(g, { renderTexture: _hitTex })
    g.destroy()
  }

  return { normal: _normalTex, hit: _hitTex }
}

export class PegBoard {
  readonly container: PIXI.Container
  private sprites: PIXI.Sprite[][] = []
  private textures!: ReturnType<typeof getPegTextures>

  readonly rows: number
  readonly pegSpacing: number
  readonly rowHeight: number
  readonly centerX: number
  readonly topY: number

  constructor(parent: PIXI.Container, renderer: PIXI.Renderer, rows: number, W: number, H: number) {
    this.container = new PIXI.Container()
    parent.addChild(this.container)

    this.rows       = rows
    this.pegSpacing = (W - 48) / (rows + 1)
    this.rowHeight  = (H - 110 - 100) / rows
    this.centerX    = W / 2
    this.topY       = 55

    this.textures   = getPegTextures(renderer)
    this.build()
  }

  private build() {
    const off = (PEG_R * 2 + 8) / 2  // texture center offset
    for (let r = 0; r < this.rows; r++) {
      this.sprites[r] = []
      for (let c = 0; c <= r; c++) {
        const pos = this.xy(r, c)
        const spr = new PIXI.Sprite(this.textures.normal)
        spr.anchor.set(0.5)
        spr.x = pos.x
        spr.y = pos.y
        // Sprites are anchor-centered but texture has built-in padding; adjust
        void off // texture is already padded, anchor(0.5) handles centering
        this.container.addChild(spr)
        this.sprites[r][c] = spr
      }
    }
  }

  xy(row: number, col: number): XY {
    return {
      x: this.centerX + (col - row / 2) * this.pegSpacing,
      y: this.topY + row * this.rowHeight,
    }
  }

  ballStart(): XY {
    return { x: this.centerX, y: this.topY - this.rowHeight * 0.88 }
  }

  flash(row: number, col: number) {
    const spr = this.sprites[row]?.[col]
    if (!spr) return

    // Swap to hit texture and scale spring
    spr.texture = this.textures.hit
    gsap.killTweensOf(spr.scale)
    gsap.timeline()
      .to(spr.scale, { x: 1.45, y: 1.45, duration: 0.065, ease: 'power2.out' })
      .to(spr.scale, { x: 1.0,  y: 1.0,  duration: 0.22,  ease: 'elastic.out(1, 0.4)' })
      .call(() => { spr.texture = this.textures.normal }, [], '+=0.0')

    // Momentary GlowFilter burst (remove after anim to keep performance)
    const gf = new GlowFilter({ distance: 14, outerStrength: 3, color: 0xFFD700, quality: 0.2 })
    spr.filters = [gf]
    const params = { s: 3 }
    gsap.to(params, {
      s: 0, duration: 0.30,
      onUpdate: () => { gf.outerStrength = params.s },
      onComplete: () => { spr.filters = [] },
    })
  }
}
