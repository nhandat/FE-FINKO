/**
 * Multi-layer casino/gold-mine background rendered in PixiJS.
 * All objects are created once; GSAP handles idle animations.
 */
import * as PIXI from 'pixi.js'
import gsap from 'gsap'

export class BackgroundLayers {
  readonly container: PIXI.Container

  constructor(parent: PIXI.Container, W: number, H: number) {
    this.container = new PIXI.Container()
    parent.addChild(this.container)

    this.addGradientBase(W, H)
    this.addGoldVeins(W, H)
    this.addPerspectiveGrid(W, H)
    this.addStars(W, H)
    this.addNeonFrame(W, H)
    this.addCornerGems(W, H)
    this.addAmbientPulse(W, H)
  }

  // ── 1. Deep gradient base (HTML canvas → PIXI texture) ──────────
  private addGradientBase(W: number, H: number) {
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const ctx = c.getContext('2d')!

    // Main vertical gradient
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0.00, '#0F0525')
    g.addColorStop(0.25, '#130A30')
    g.addColorStop(0.55, '#0C0620')
    g.addColorStop(1.00, '#050110')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // Central radial glow (purple)
    const r1 = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, W * 0.65)
    r1.addColorStop(0, 'rgba(140, 40, 255, 0.14)')
    r1.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r1; ctx.fillRect(0, 0, W, H)

    // Bottom warm glow (gold/amber)
    const r2 = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.6)
    r2.addColorStop(0, 'rgba(200, 120, 0, 0.12)')
    r2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r2; ctx.fillRect(0, 0, W, H)

    // Vignette (dark edges)
    const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.72)
    vig.addColorStop(0.4, 'rgba(0,0,0,0)')
    vig.addColorStop(1.0, 'rgba(0,0,0,0.62)')
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

    const bg = new PIXI.Sprite(PIXI.Texture.from(c))
    bg.width = W; bg.height = H
    this.container.addChild(bg)
  }

  // ── 2. Gold vein lines ───────────────────────────────────────────
  private addGoldVeins(W: number, H: number) {
    const g = new PIXI.Graphics()

    const veinData = [
      // [x1,y1, cx1,cy1, cx2,cy2, x2,y2]
      [W * 0.05, H * 0.10,  W * 0.12, H * 0.30,  W * 0.08, H * 0.55,  W * 0.15, H * 0.75],
      [W * 0.90, H * 0.15,  W * 0.82, H * 0.38,  W * 0.88, H * 0.60,  W * 0.80, H * 0.80],
      [W * 0.02, H * 0.50,  W * 0.20, H * 0.40,  W * 0.10, H * 0.60,  W * 0.18, H * 0.85],
      [W * 0.92, H * 0.45,  W * 0.75, H * 0.52,  W * 0.85, H * 0.65,  W * 0.78, H * 0.90],
      [W * 0.30, H * 0.02,  W * 0.25, H * 0.12,  W * 0.35, H * 0.08,  W * 0.28, H * 0.20],
      [W * 0.65, H * 0.05,  W * 0.70, H * 0.16,  W * 0.60, H * 0.10,  W * 0.68, H * 0.22],
    ]

    veinData.forEach(([x1,y1,cx1,cy1,cx2,cy2,x2,y2]) => {
      g.lineStyle(1.2, 0xFFD700, 0.18)
      g.moveTo(x1, y1)
      g.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2)
      // Thinner branch
      g.lineStyle(0.6, 0xFFCC44, 0.12)
      g.moveTo(x1 + (Math.random() - 0.5) * 10, y1 + 20)
      g.bezierCurveTo(cx1 + 15, cy1 + 10, cx2 - 10, cy2 - 15, x2 + 8, y2 - 10)
    })

    this.container.addChild(g)
  }

  // ── 3. Perspective grid ──────────────────────────────────────────
  private addPerspectiveGrid(W: number, H: number) {
    const g = new PIXI.Graphics()
    const vx = W / 2, vy = H * 0.22
    const bottom = H - 42
    const cols = 12

    for (let i = 0; i <= cols; i++) {
      const t = i / cols
      const bx = t * W
      g.lineStyle(0.5, 0x5B2FA8, 0.12)
      g.moveTo(vx, vy)
      g.lineTo(bx, bottom)
    }
    const rows = 7
    for (let j = 1; j <= rows; j++) {
      const t = Math.pow(j / rows, 1.6)
      const y = vy + (bottom - vy) * t
      const lx = vx + (0 - vx) * t
      const rx = vx + (W - vx) * t
      g.lineStyle(0.5, 0x5B2FA8, 0.1 * (1 - t * 0.5))
      g.moveTo(lx, y)
      g.lineTo(rx, y)
    }
    this.container.addChild(g)
  }

  // ── 4. Twinkling stars ───────────────────────────────────────────
  private addStars(W: number, H: number) {
    const layer = new PIXI.Container()
    this.container.addChild(layer)

    for (let i = 0; i < 55; i++) {
      const g = new PIXI.Graphics()
      const r = 0.8 + Math.random() * 1.8
      // Cross / plus star shape
      const isCross = Math.random() > 0.6
      if (isCross) {
        g.lineStyle(r * 0.7, 0xFFFFFF, 0.7)
        g.moveTo(-r * 2.5, 0); g.lineTo(r * 2.5, 0)
        g.moveTo(0, -r * 2.5); g.lineTo(0, r * 2.5)
      } else {
        g.beginFill(0xFFFFFF, 0.65)
        g.drawCircle(0, 0, r)
        g.endFill()
      }
      g.x = Math.random() * W
      g.y = 10 + Math.random() * H * 0.82
      g.alpha = 0.15 + Math.random() * 0.55
      layer.addChild(g)

      gsap.to(g, {
        alpha: 0.05 + Math.random() * 0.2,
        duration: 0.9 + Math.random() * 2.0,
        yoyo: true, repeat: -1,
        delay: Math.random() * 3,
        ease: 'sine.inOut',
      })
    }
  }

  // ── 5. Neon frame ─────────────────────────────────────────────────
  private addNeonFrame(W: number, H: number) {
    // Top bar
    const top = new PIXI.Graphics()
    top.beginFill(0xFF2D78, 0.85)
    top.drawRect(0, 0, W, 2.5)
    top.endFill()
    this.container.addChild(top)
    gsap.to(top, { alpha: 0.25, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })

    // Side lines
    const sides = new PIXI.Graphics()
    sides.lineStyle(1.2, 0xB026FF, 0.35)
    sides.moveTo(6, 0); sides.lineTo(6, H)
    sides.moveTo(W - 6, 0); sides.lineTo(W - 6, H)
    this.container.addChild(sides)
    gsap.to(sides, { alpha: 0.12, duration: 2.0, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.7 })

    // Corner accents
    const corners = new PIXI.Graphics()
    const cSize = 18
    ;([
      [6, 6], [W - 6, 6], [6, H - 6], [W - 6, H - 6],
    ] as [number, number][]).forEach(([cx, cy]) => {
      corners.lineStyle(2, 0xFF2D78, 0.7)
      corners.beginFill(0xFF2D78, 0.15)
      corners.drawCircle(cx, cy, cSize * 0.35)
      corners.endFill()
    })
    this.container.addChild(corners)
  }

  // ── 6. Corner gem decorations ────────────────────────────────────
  private addCornerGems(W: number, H: number) {
    const gems = new PIXI.Graphics()
    ;([
      { x: 18, y: 55, color: 0xFF2D78 },
      { x: W - 18, y: 55, color: 0xB026FF },
      { x: 18, y: H - 100, color: 0xFFD700 },
      { x: W - 18, y: H - 100, color: 0x00F5FF },
    ]).forEach(({ x, y, color }) => {
      // Diamond shape
      gems.beginFill(color, 0.5)
      gems.moveTo(x, y - 8)
      gems.lineTo(x + 5, y)
      gems.lineTo(x, y + 6)
      gems.lineTo(x - 5, y)
      gems.closePath()
      gems.endFill()
      gems.lineStyle(1, color, 0.8)
      gems.moveTo(x, y - 8); gems.lineTo(x + 5, y)
      gems.lineTo(x, y + 6); gems.lineTo(x - 5, y)
      gems.closePath()
    })
    this.container.addChild(gems)

    gsap.to(gems, { alpha: 0.4, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
  }

  // ── 7. Floating ambient glow pulses ─────────────────────────────
  private addAmbientPulse(W: number, H: number) {
    const glows = new PIXI.Container()
    this.container.addChild(glows)

    ;([
      { x: W * 0.15, y: H * 0.35, color: 0xB026FF, r: 55 },
      { x: W * 0.85, y: H * 0.28, color: 0xFF2D78, r: 45 },
      { x: W * 0.50, y: H * 0.72, color: 0xFFD700, r: 65 },
    ]).forEach(({ x, y, color, r }) => {
      const g = new PIXI.Graphics()
      g.beginFill(color, 0.06); g.drawCircle(0, 0, r); g.endFill()
      g.beginFill(color, 0.04); g.drawCircle(0, 0, r * 1.6); g.endFill()
      g.x = x; g.y = y; g.alpha = 0.4
      glows.addChild(g)
      gsap.to(g, {
        alpha: 1, scaleX: 1.15, scaleY: 1.15,
        duration: 2.5 + Math.random() * 1.5, yoyo: true, repeat: -1,
        delay: Math.random() * 2, ease: 'sine.inOut',
      })
    })
  }
}
