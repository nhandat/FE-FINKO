import * as PIXI from 'pixi.js'
import gsap from 'gsap'

const PEG_R = 7

export interface XY { x: number; y: number }

export class PegBoard {
  readonly container: PIXI.Container
  private pegs: PIXI.Container[][] = []

  readonly rows: number
  readonly pegSpacing: number
  readonly rowHeight: number
  readonly centerX: number
  readonly topY: number

  constructor(
    parent: PIXI.Container,
    rows: number,
    W: number,
    H: number,
  ) {
    this.container = new PIXI.Container()
    parent.addChild(this.container)

    this.rows = rows
    this.pegSpacing = (W - 48) / (rows + 1)
    this.rowHeight = (H - 110 - 100) / rows
    this.centerX = W / 2
    this.topY = 55
    this.build()
  }

  private build() {
    for (let r = 0; r < this.rows; r++) {
      this.pegs[r] = []
      for (let c = 0; c <= r; c++) {
        const pos = this.xy(r, c)
        const peg = makePeg()
        peg.x = pos.x
        peg.y = pos.y
        this.container.addChild(peg)
        this.pegs[r][c] = peg
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
    return { x: this.centerX, y: this.topY - this.rowHeight * 0.85 }
  }

  flash(row: number, col: number) {
    const peg = this.pegs[row]?.[col]
    if (!peg) return
    const glow = peg.getChildByName('glow') as PIXI.DisplayObject
    gsap.killTweensOf(peg.scale)
    gsap.killTweensOf(glow)
    gsap.timeline()
      .to(peg.scale, { x: 1.55, y: 1.55, duration: 0.06, ease: 'power2.out' })
      .to(peg.scale, { x: 1, y: 1, duration: 0.22, ease: 'elastic.out(1, 0.45)' })
    gsap.timeline()
      .to(glow, { alpha: 1, duration: 0.05 })
      .to(glow, { alpha: 0, duration: 0.28 })
  }
}

// ── helpers ─────────────────────────────────────────────────────────

function makePeg(): PIXI.Container {
  const c = new PIXI.Container()

  // Glow halo (3 rings)
  const glow = new PIXI.Graphics()
  glow.name = 'glow'
  glow.beginFill(0xFFD700, 0.12); glow.drawCircle(0, 0, PEG_R * 3.2); glow.endFill()
  glow.beginFill(0xFFCC00, 0.22); glow.drawCircle(0, 0, PEG_R * 2.2); glow.endFill()
  glow.beginFill(0xFFDD44, 0.40); glow.drawCircle(0, 0, PEG_R * 1.5); glow.endFill()
  glow.alpha = 0
  c.addChild(glow)

  // Sphere body
  const g = new PIXI.Graphics()
  // dark base
  g.beginFill(0x2E1060); g.drawCircle(0, 0, PEG_R); g.endFill()
  // mid tone
  g.beginFill(0x9B6DDB, 0.85); g.drawCircle(-0.4, -0.4, PEG_R * 0.76); g.endFill()
  // highlight spot
  g.beginFill(0xE8D8FF, 0.75); g.drawCircle(-PEG_R * 0.25, -PEG_R * 0.3, PEG_R * 0.36); g.endFill()
  // specular
  g.beginFill(0xFFFFFF, 0.55); g.drawCircle(-PEG_R * 0.25, -PEG_R * 0.33, PEG_R * 0.16); g.endFill()
  c.addChild(g)

  return c
}
