import * as PIXI from 'pixi.js'
import gsap from 'gsap'

const SLOT_PALETTE = [
  0xFFD700, // gold  — x10
  0x22C55E, // green — x3
  0x3B82F6, // blue  — x1.5
  0x8B5CF6, // purple— x1
  0xEF4444, // red   — x0.5
  0x8B5CF6, // purple— x1
  0x3B82F6, // blue  — x1.5
  0x22C55E, // green — x3
  0xFFD700, // gold  — x10
]

export class MultiplierBar {
  readonly container: PIXI.Container
  private slots: PIXI.Container[] = []
  private slotCenters: number[] = []

  private readonly barY: number
  private readonly slotW: number

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
    const spacing = (W - 32) / rows          // distance between bucket centres
    this.slotW = spacing - 4
    const slotH = 34
    this.barY = H - slotH / 2 - 12

    for (let i = 0; i < buckets; i++) {
      const cx = 16 + (i + 0.5) * spacing
      this.slotCenters.push(cx)

      const slot = new PIXI.Container()
      slot.x = cx
      slot.y = this.barY

      const color = SLOT_PALETTE[i] ?? 0x8B5CF6
      const mult  = multipliers[i] ?? 1

      // glow bg
      const glow = new PIXI.Graphics()
      glow.name = 'glow'
      glow.beginFill(color, 0.45)
      glow.drawRoundedRect(-this.slotW / 2 - 5, -slotH / 2 - 5, this.slotW + 10, slotH + 10, 8)
      glow.endFill()
      glow.alpha = 0

      // main bg
      const bg = new PIXI.Graphics()
      bg.beginFill(color, 0.85)
      bg.drawRoundedRect(-this.slotW / 2, -slotH / 2, this.slotW, slotH, 6)
      bg.endFill()

      // top shine
      const shine = new PIXI.Graphics()
      shine.beginFill(0xFFFFFF, 0.18)
      shine.drawRoundedRect(-this.slotW / 2 + 2, -slotH / 2 + 2, this.slotW - 4, slotH * 0.42, 4)
      shine.endFill()

      const label = new PIXI.Text(
        mult >= 10 ? `×${mult}` : `×${mult}`,
        {
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: this.slotW < 28 ? 8 : 10,
          fontWeight: 'bold',
          fill: 0xFFFFFF,
          align: 'center',
          dropShadow: true,
          dropShadowDistance: 1,
          dropShadowAlpha: 0.5,
        },
      )
      label.anchor.set(0.5)

      slot.addChild(glow, bg, shine, label)
      this.container.addChild(slot)
      this.slots.push(slot)
    }
  }

  centerX(idx: number) { return this.slotCenters[idx] ?? 0 }
  get y() { return this.barY }

  highlight(idx: number) {
    const slot = this.slots[idx]
    if (!slot) return
    const glow = slot.getChildByName('glow') as PIXI.DisplayObject
    gsap.killTweensOf(slot.scale)
    gsap.killTweensOf(glow)
    gsap.timeline()
      .to(slot.scale, { x: 1.18, y: 1.18, duration: 0.10, ease: 'back.out(2)' })
      .to(slot.scale, { x: 1, y: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)' })
    gsap.timeline()
      .to(glow, { alpha: 1, duration: 0.08 })
      .to(glow, { alpha: 0, duration: 0.55, delay: 0.1 })
  }
}
