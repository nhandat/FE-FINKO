import * as PIXI from 'pixi.js'
import { GlowFilter } from 'pixi-filters'
import gsap from 'gsap'

// Palette: index maps to slot position (9 slots for 8 rows)
const PALETTE = [
  0xFFD700, // gold   x10
  0x22C55E, // green  x3
  0x3B82F6, // blue   x1.5
  0x8B5CF6, // purple x1
  0xEF4444, // red    x0.5
  0x8B5CF6, // purple x1
  0x3B82F6, // blue   x1.5
  0x22C55E, // green  x3
  0xFFD700, // gold   x10
]

export class MultiplierBar {
  readonly container: PIXI.Container
  private slots: PIXI.Container[] = []
  private centers: number[] = []
  private glowFilters: GlowFilter[] = []

  private readonly barY: number

  constructor(
    parent: PIXI.Container,
    rows: number,
    multipliers: number[],
    W: number,
    H: number,
  ) {
    this.container = new PIXI.Container()
    parent.addChild(this.container)

    const buckets = rows + 1
    const spacing = (W - 32) / rows
    const slotW   = spacing - 4
    const slotH   = 36
    this.barY = H - slotH / 2 - 10

    for (let i = 0; i < buckets; i++) {
      const cx    = 16 + (i + 0.5) * spacing
      const color = PALETTE[i] ?? 0x8B5CF6
      const mult  = multipliers[i] ?? 1

      this.centers.push(cx)

      const slot = new PIXI.Container()
      slot.x = cx
      slot.y = this.barY

      // Shadow
      const shadow = new PIXI.Graphics()
      shadow.beginFill(0x000000, 0.4)
      shadow.drawRoundedRect(-slotW / 2 + 1, -slotH / 2 + 2, slotW, slotH, 7)
      shadow.endFill()

      // Main background
      const bg = new PIXI.Graphics()
      bg.beginFill(color, 0.88)
      bg.drawRoundedRect(-slotW / 2, -slotH / 2, slotW, slotH, 6)
      bg.endFill()

      // Top shine strip
      const shine = new PIXI.Graphics()
      shine.beginFill(0xFFFFFF, 0.22)
      shine.drawRoundedRect(-slotW / 2 + 2, -slotH / 2 + 2, slotW - 4, slotH * 0.40, 4)
      shine.endFill()

      // Label
      const fontSize = slotW < 28 ? 7 : slotW < 36 ? 9 : 10
      const label = new PIXI.Text(`×${mult}`, {
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize,
        fontWeight: '900',
        fill: 0xFFFFFF,
        align: 'center',
        dropShadow: true,
        dropShadowDistance: 1,
        dropShadowAlpha: 0.6,
      })
      label.anchor.set(0.5)

      slot.addChild(shadow, bg, shine, label)
      this.container.addChild(slot)
      this.slots.push(slot)

      // Pre-create glow filter (disabled until hit)
      const gf = new GlowFilter({ distance: 16, outerStrength: 0, color, quality: 0.2 })
      slot.filters = [gf]
      this.glowFilters.push(gf)
    }
  }

  centerX(idx: number): number { return this.centers[idx] ?? 0 }
  get y(): number { return this.barY }

  highlight(idx: number) {
    const slot = this.slots[idx]
    const gf   = this.glowFilters[idx]
    if (!slot || !gf) return

    gsap.killTweensOf(slot.scale)

    // Scale spring
    gsap.timeline()
      .to(slot.scale, { x: 1.22, y: 1.22, duration: 0.10, ease: 'back.out(2.5)' })
      .to(slot.scale, { x: 1,    y: 1,    duration: 0.38, ease: 'elastic.out(1, 0.4)' })

    // Glow pulse
    const params = { s: 0 }
    gsap.timeline()
      .to(params, {
        s: 5.5, duration: 0.10,
        onUpdate: () => { gf.outerStrength = params.s },
      })
      .to(params, {
        s: 0, duration: 0.55,
        onUpdate: () => { gf.outerStrength = params.s },
      })
  }
}
